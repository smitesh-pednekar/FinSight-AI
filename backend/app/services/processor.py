"""Document processing pipeline - orchestrates all processing steps."""

import asyncio
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Document, DocumentStatus, DocumentType,
    FinancialExtraction, FinancialValidation, RiskFlag
)
from app.services.extractor import DocumentExtractor
from app.services.ai_extractor import AIExtractor
from app.services.validator import FinancialValidator
from app.services.risk_detector import RiskDetector
from app.services.semantic_search import SemanticSearchService

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Main document processing pipeline.
    
    Orchestrates: extraction → classification → AI extraction → validation → risk detection → embeddings
    """
    
    def __init__(self):
        """Initialize document processor."""
        self.text_extractor = DocumentExtractor()
        self.ai_extractor = AIExtractor()
        self.validator = FinancialValidator()
        self.risk_detector = RiskDetector()
        self.search_service = SemanticSearchService()
    
    async def process_document(
        self,
        db: AsyncSession,
        document_id: UUID
    ) -> bool:
        """
        Process a document through the complete pipeline.
        
        Args:
            db: Database session
            document_id: Document UUID
            
        Returns:
            True if processing succeeded, False otherwise
        """
        logger.info(f"Starting processing for document {document_id}")
        
        # Get document
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            logger.error(f"Document {document_id} not found")
            return False
        
        try:
            # Update status
            document.status = DocumentStatus.PROCESSING.value
            document.processing_started_at = datetime.utcnow()
            await db.commit()
            
            # Step 1: Extract text
            logger.info(f"Step 1: Extracting text from {document.filename}")
            extracted_text, page_count = await self._extract_text(document)
            
            if not extracted_text:
                raise ValueError("Failed to extract text from document")
            
            # Update document
            document.extracted_text = extracted_text
            document.page_count = page_count
            await db.commit()
            
            # Step 2: Classify document type
            logger.info("Step 2: Classifying document type")
            document_type = await self._classify_document(extracted_text)
            document.document_type = document_type
            await db.commit()
            
            # Step 3: Extract financial data with AI
            logger.info("Step 3: Extracting financial data")
            extraction_record = await self._extract_financial_data(
                db, document, extracted_text, document_type
            )
            
            # Step 4: Validate extracted data
            logger.info("Step 4: Running validations")
            validation_records = await self._validate_data(
                db, document, extraction_record
            )
            
            # Step 5: Detect risks
            logger.info("Step 5: Detecting risks")
            risk_records = await self._detect_risks(
                db, document, extraction_record, validation_records
            )
            
            # Step 6: Create embeddings for semantic search
            logger.info("Step 6: Creating embeddings")
            await self._create_embeddings(db, document, extracted_text)
            
            # Mark as completed
            document.status = DocumentStatus.COMPLETED.value
            document.processing_completed_at = datetime.utcnow()
            
            # Log audit entry
            from app.utils import log_audit
            await log_audit(
                db,
                action="DOCUMENT_PROCESS_COMPLETE",
                resource_type="document",
                document_id=document.id,
                resource_id=document.id,
                description=f"AI synthesized {document.document_type}: {document.original_filename}"
            )
            
            await db.commit()
            
            logger.info(f"Successfully processed document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            
            # Mark as failed
            document.status = DocumentStatus.FAILED.value
            document.error_message = str(e)
            document.retry_count += 1
            await db.commit()
            
            return False
    
    async def _extract_text(self, document: Document) -> tuple[str, int]:
        """Extract text from document file."""
        try:
            text, page_count = self.text_extractor.extract_text(
                document.file_path,
                document.mime_type
            )
            return text, page_count
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            raise
    
    async def _classify_document(self, text: str) -> str:
        """Classify document type using AI."""
        try:
            doc_type = await self.ai_extractor.classify_document(text)
            return doc_type
        except Exception as e:
            logger.error(f"Document classification failed: {str(e)}")
            return DocumentType.UNKNOWN.value
    
    async def _extract_financial_data(
        self,
        db: AsyncSession,
        document: Document,
        text: str,
        document_type: str
    ) -> Optional[FinancialExtraction]:
        """Extract financial data using AI."""
        try:
            extracted_data, confidence = await self.ai_extractor.extract_financial_data(
                text, document_type
            )
            
            if not extracted_data:
                logger.warning(f"No financial data extracted for document {document.id}")
                return None
            
            # Create extraction record
            extraction = FinancialExtraction(
                document_id=document.id,
                extracted_data=extracted_data,
                confidence_score=confidence,
                invoice_number=extracted_data.get("invoice_number"),
                invoice_date=self._parse_date(extracted_data.get("invoice_date")),
                due_date=self._parse_date(extracted_data.get("due_date")),
                vendor_name=extracted_data.get("vendor_name"),
                customer_name=extracted_data.get("customer_name"),
                subtotal=extracted_data.get("subtotal"),
                tax_amount=extracted_data.get("tax_amount"),
                total_amount=extracted_data.get("total_amount"),
                currency=extracted_data.get("currency", "USD"),
                extraction_method="AI_LANGCHAIN",
            )
            
            db.add(extraction)
            await db.commit()
            await db.refresh(extraction)
            
            return extraction
            
        except Exception as e:
            logger.error(f"Financial data extraction failed: {str(e)}")
            return None
    
    async def _validate_data(
        self,
        db: AsyncSession,
        document: Document,
        extraction: Optional[FinancialExtraction]
    ) -> list[FinancialValidation]:
        """Run validations on extracted data."""
        if not extraction:
            return []
        
        try:
            # Run validations based on document type
            if document.document_type == DocumentType.INVOICE.value:
                validation_results = self.validator.validate_invoice(extraction.extracted_data)
            elif document.document_type == DocumentType.BANK_STATEMENT.value:
                validation_results = self.validator.validate_bank_statement(extraction.extracted_data)
            else:
                validation_results = []
            
            # Store validation results
            validation_records = []
            for vr in validation_results:
                validation = FinancialValidation(
                    document_id=document.id,
                    validation_type=vr.validation_type,
                    is_valid=vr.is_valid,
                    expected_value={"value": vr.expected_value} if vr.expected_value is not None else None,
                    actual_value={"value": vr.actual_value} if vr.actual_value is not None else None,
                    error_message=vr.error_message,
                    severity=vr.severity,
                )
                db.add(validation)
                validation_records.append(validation)
            
            await db.commit()
            
            return validation_records
            
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return []
    
    async def _detect_risks(
        self,
        db: AsyncSession,
        document: Document,
        extraction: Optional[FinancialExtraction],
        validations: list[FinancialValidation]
    ) -> list[RiskFlag]:
        """Detect risks and anomalies."""
        if not extraction:
            return []
        
        try:
            # Detect risks based on document type
            if document.document_type == DocumentType.INVOICE.value:
                # Convert validation objects to simple objects for risk detector
                validation_results = []
                for v in validations:
                    # Create a simple object with the needed attributes
                    class SimpleValidation:
                        def __init__(self, val):
                            self.validation_type = val.validation_type
                            self.is_valid = val.is_valid
                            self.expected_value = val.expected_value
                            self.actual_value = val.actual_value
                            self.error_message = val.error_message
                            self.severity = val.severity
                    
                    validation_results.append(SimpleValidation(v))
                
                risk_flags = self.risk_detector.detect_invoice_risks(
                    extraction.extracted_data,
                    validation_results
                )
            else:
                risk_flags = []
            
            if not risk_flags:
                return []
            
            # Generate AI explanations concurrently for all risk flags
            document_context = {
                "document_type": document.document_type,
                "extracted_data": extraction.extracted_data,
            }
            
            explanation_tasks = [
                self.risk_detector.generate_ai_explanation(rf, document_context)
                for rf in risk_flags
            ]
            
            explanations = await asyncio.gather(*explanation_tasks, return_exceptions=True)
            
            # Store risk flags with their explanations
            risk_records = []
            for rf, ai_explanation in zip(risk_flags, explanations):
                # Handle any failed explanation gracefully
                if isinstance(ai_explanation, Exception):
                    logger.warning(f"AI explanation failed for risk {rf['risk_type']}: {ai_explanation}")
                    ai_explanation = rf.get("description", "")
                
                risk = RiskFlag(
                    document_id=document.id,
                    risk_type=rf["risk_type"],
                    risk_level=rf["risk_level"],
                    description=rf["description"],
                    ai_explanation=ai_explanation,
                    evidence=rf.get("evidence"),
                )
                db.add(risk)
                risk_records.append(risk)
            
            await db.commit()
            
            return risk_records
            
        except Exception as e:
            logger.error(f"Risk detection failed: {str(e)}")
            return []
    
    async def _create_embeddings(
        self,
        db: AsyncSession,
        document: Document,
        text: str
    ) -> int:
        """Create embeddings for semantic search."""
        try:
            metadata = {
                "document_type": document.document_type,
                "filename": document.filename,
            }
            
            chunk_count = await self.search_service.create_chunks_and_embeddings(
                db, document.id, text, metadata
            )
            
            return chunk_count
            
        except Exception as e:
            logger.error(f"Embedding creation failed: {str(e)}")
            return 0
    
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO date string to datetime."""
        if not date_str:
            return None
        
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
