"""AI-powered financial data extraction using LangChain."""

import json
import logging
from typing import Optional, Any
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models import DocumentType

logger = logging.getLogger(__name__)
settings = get_settings()


# Extraction schemas for different document types
class InvoiceExtraction(BaseModel):
    """Schema for invoice data extraction."""
    invoice_number: Optional[str] = Field(None, description="Invoice number or ID")
    invoice_date: Optional[str] = Field(None, description="Invoice date (YYYY-MM-DD)")
    due_date: Optional[str] = Field(None, description="Payment due date (YYYY-MM-DD)")
    vendor_name: Optional[str] = Field(None, description="Vendor/supplier company name")
    vendor_address: Optional[str] = Field(None, description="Vendor address")
    vendor_tax_id: Optional[str] = Field(None, description="Vendor tax ID or GST number")
    customer_name: Optional[str] = Field(None, description="Customer/buyer company name")
    customer_address: Optional[str] = Field(None, description="Customer address")
    line_items: list[dict[str, Any]] = Field(default_factory=list, description="List of invoice line items")
    subtotal: Optional[float] = Field(None, description="Subtotal amount before tax")
    tax_amount: Optional[float] = Field(None, description="Total tax amount")
    tax_rate: Optional[float] = Field(None, description="Tax rate percentage")
    total_amount: Optional[float] = Field(None, description="Total invoice amount")
    currency: str = Field(default="USD", description="Currency code")
    payment_terms: Optional[str] = Field(None, description="Payment terms")
    notes: Optional[str] = Field(None, description="Additional notes or comments")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Extraction confidence score")


class BankStatementExtraction(BaseModel):
    """Schema for bank statement extraction."""
    account_number: Optional[str] = Field(None, description="Bank account number")
    account_holder: Optional[str] = Field(None, description="Account holder name")
    bank_name: Optional[str] = Field(None, description="Bank name")
    statement_period_start: Optional[str] = Field(None, description="Statement period start date")
    statement_period_end: Optional[str] = Field(None, description="Statement period end date")
    opening_balance: Optional[float] = Field(None, description="Opening balance")
    closing_balance: Optional[float] = Field(None, description="Closing balance")
    total_credits: Optional[float] = Field(None, description="Total credit amount")
    total_debits: Optional[float] = Field(None, description="Total debit amount")
    transactions: list[dict[str, Any]] = Field(default_factory=list, description="List of transactions")
    currency: str = Field(default="USD")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class FinancialStatementExtraction(BaseModel):
    """Schema for P&L and Balance Sheet extraction."""
    statement_type: str = Field(..., description="PROFIT_LOSS or BALANCE_SHEET")
    company_name: Optional[str] = Field(None, description="Company name")
    period_start: Optional[str] = Field(None, description="Period start date")
    period_end: Optional[str] = Field(None, description="Period end date")
    revenue: Optional[float] = Field(None, description="Total revenue")
    expenses: Optional[float] = Field(None, description="Total expenses")
    net_income: Optional[float] = Field(None, description="Net income/profit")
    assets: Optional[float] = Field(None, description="Total assets")
    liabilities: Optional[float] = Field(None, description="Total liabilities")
    equity: Optional[float] = Field(None, description="Total equity")
    line_items: list[dict[str, Any]] = Field(default_factory=list, description="Financial line items")
    currency: str = Field(default="USD")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class AIExtractor:
    """AI-powered financial data extractor."""
    
    def __init__(self):
        """Initialize AI extractor with LLM."""
        if settings.google_api_key:
            logger.info(f"Initializing Gemini LLM with model {settings.google_model}")
            self.llm = ChatGoogleGenerativeAI(
                model=settings.google_model,
                temperature=0,
                google_api_key=settings.google_api_key,
                convert_system_message_to_human=True,
            )
        else:
            logger.info(f"Initializing OpenAI LLM with model {settings.openai_model}")
            self.llm = ChatOpenAI(
                model=settings.openai_model,
                temperature=0,
                api_key=settings.openai_api_key,
            )
    
    async def extract_financial_data(
        self,
        text: str,
        document_type: str
    ) -> tuple[dict[str, Any], float]:
        """
        Extract structured financial data from text.
        
        Args:
            text: Extracted document text
            document_type: Type of financial document
            
        Returns:
            Tuple of (extracted_data_dict, confidence_score)
        """
        try:
            if document_type == DocumentType.INVOICE.value:
                return await self._extract_invoice(text)
            elif document_type == DocumentType.BANK_STATEMENT.value:
                return await self._extract_bank_statement(text)
            elif document_type in [DocumentType.PROFIT_LOSS.value, DocumentType.BALANCE_SHEET.value]:
                return await self._extract_financial_statement(text, document_type)
            else:
                logger.warning(f"Unsupported document type for extraction: {document_type}")
                return {}, 0.0
        except Exception as e:
            logger.error(f"Error during AI extraction: {str(e)}")
            raise
    
    async def _extract_invoice(self, text: str) -> tuple[dict[str, Any], float]:
        """Extract invoice data."""
        parser = PydanticOutputParser(pydantic_object=InvoiceExtraction)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a financial document parser specialized in invoices.
Extract structured data from the invoice text with high accuracy.
Return ONLY valid JSON matching the schema. Do not hallucinate fields.
If a field is not present, use null. Use ISO date format (YYYY-MM-DD).

{format_instructions}"""),
            ("user", "Extract all financial data from this invoice:\n\n{text}")
        ])
        
        chain = prompt | self.llm
        
        response = await chain.ainvoke({
            "text": text[:15000],
            "format_instructions": parser.get_format_instructions()
        })
        
        # Parse the response
        try:
            extracted = parser.parse(response.content)
            data = extracted.model_dump()
            confidence = data.pop("confidence", 0.8)
            return data, confidence
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {str(e)}")
            return {}, 0.0
    
    async def _extract_bank_statement(self, text: str) -> tuple[dict[str, Any], float]:
        """Extract bank statement data."""
        parser = PydanticOutputParser(pydantic_object=BankStatementExtraction)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a financial document parser specialized in bank statements.
Extract structured data with precision. Return ONLY valid JSON.

{format_instructions}"""),
            ("user", "Extract all data from this bank statement:\n\n{text}")
        ])
        
        chain = prompt | self.llm
        
        response = await chain.ainvoke({
            "text": text[:15000],
            "format_instructions": parser.get_format_instructions()
        })
        
        try:
            extracted = parser.parse(response.content)
            data = extracted.model_dump()
            confidence = data.pop("confidence", 0.8)
            return data, confidence
        except Exception as e:
            logger.error(f"Failed to parse bank statement: {str(e)}")
            return {}, 0.0
    
    async def _extract_financial_statement(
        self,
        text: str,
        statement_type: str
    ) -> tuple[dict[str, Any], float]:
        """Extract P&L or Balance Sheet data."""
        parser = PydanticOutputParser(pydantic_object=FinancialStatementExtraction)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a financial document parser for corporate financial statements.
Extract data accurately. Return ONLY valid JSON matching the schema.

{format_instructions}"""),
            ("user", "Extract financial data from this {statement_type}:\n\n{text}")
        ])
        
        chain = prompt | self.llm
        
        response = await chain.ainvoke({
            "text": text[:15000],
            "statement_type": statement_type,
            "format_instructions": parser.get_format_instructions()
        })
        
        try:
            extracted = parser.parse(response.content)
            data = extracted.model_dump()
            confidence = data.pop("confidence", 0.8)
            return data, confidence
        except Exception as e:
            logger.error(f"Failed to parse financial statement: {str(e)}")
            return {}, 0.0
    
    async def classify_document(self, text: str) -> str:
        """
        Classify document type from text.
        
        Args:
            text: Document text
            
        Returns:
            DocumentType enum value
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a document classifier for financial documents.
Classify the document into ONE of these types:
- INVOICE
- BANK_STATEMENT
- PROFIT_LOSS
- BALANCE_SHEET
- TAX_DOCUMENT
- FINANCIAL_CONTRACT
- UNKNOWN

Return ONLY the type name, nothing else."""),
            ("user", "Classify this financial document:\n\n{text}")
        ])
        
        chain = prompt | self.llm
        
        response = await chain.ainvoke({"text": text[:4000]})
        
        doc_type = response.content.strip().upper()
        
        # Validate against known types
        valid_types = [dt.value for dt in DocumentType]
        if doc_type in valid_types:
            return doc_type
        
        return DocumentType.UNKNOWN.value
