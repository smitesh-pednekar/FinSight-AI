"""API routes for document management."""

import asyncio
import os
import uuid
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import get_settings
from app.models import Document, DocumentStatus, FinancialExtraction, FinancialValidation, RiskFlag
from app.schemas import (
    DocumentUploadResponse, DocumentResponse, DocumentListResponse,
    DocumentDetailResponse, FinancialExtractionResponse,
    ValidationResponse, RiskFlagResponse
)
from app.services.processor import DocumentProcessor

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


async def process_document_background(document_id: uuid.UUID):
    """Background task to process document."""
    from app.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        processor = DocumentProcessor()
        await processor.process_document(db, document_id)


@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a financial document for processing.
    
    - Accepts PDF, DOCX, and image files
    - Processing happens asynchronously
    - Returns immediately with document ID and status
    """
    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Validate file type
    allowed_extensions = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"]
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = uuid.uuid4()
    safe_filename = f"{file_id}{file_ext}"
    file_path = upload_dir / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # For demo, use a hardcoded user_id (in production, get from auth)
    demo_user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    
    # Create database record
    document = Document(
        user_id=demo_user_id,
        filename=safe_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        mime_type=file.content_type,
        status=DocumentStatus.UPLOADED.value,
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Log audit entry
    from app.utils import log_audit
    await log_audit(
        db,
        action="DOCUMENT_UPLOAD",
        resource_type="document",
        document_id=document.id,
        resource_id=document.id,
        description=f"Uploaded financial document: {file.filename}"
    )
    await db.commit()

    # Start background processing
    background_tasks.add_task(process_document_background, document.id)
    
    return document


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all documents with pagination and filtering.
    
    - Supports filtering by status and document type
    - Paginated results
    """
    # Build query
    query = select(Document)
    
    # Apply filters
    filters = []
    if status:
        filters.append(Document.status == status)
    if document_type:
        filters.append(Document.document_type == document_type)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(Document)
    if filters:
        count_query = count_query.where(and_(*filters))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Document.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return DocumentListResponse(
        documents=documents,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed document information including extractions, validations, and risks.
    
    - Returns complete document data
    - Includes all related financial data
    """
    # Query with eager loading of relationships
    query = (
        select(Document)
        .options(
            selectinload(Document.extractions),
            selectinload(Document.validations),
            selectinload(Document.risk_flags)
        )
        .where(Document.id == document_id)
    )
    
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.post("/{document_id}/retry", response_model=DocumentResponse)
async def retry_document_processing(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Retry processing a failed document.
    
    - Only works for failed documents
    - Resets status and starts processing again
    """
    # Get document
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.status != DocumentStatus.FAILED.value:
        raise HTTPException(
            status_code=400,
            detail="Only failed documents can be retried"
        )
    
    # Reset status
    document.status = DocumentStatus.UPLOADED.value
    document.error_message = None
    await db.commit()
    await db.refresh(document)
    
    # Log audit entry
    from app.utils import log_audit
    await log_audit(
        db,
        action="DOCUMENT_RETRY",
        resource_type="document",
        document_id=document.id,
        resource_id=document.id,
        description=f"Retried AI synthesis for: {document.original_filename}"
    )
    await db.commit()
    
    # Start background processing
    background_tasks.add_task(process_document_background, document.id)
    
    return document


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a document and all related data.
    
    - Removes file from storage
    - Deletes database record (cascades to related data)
    """
    # Get document
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    file_path = Path(document.file_path)
    if file_path.exists():
        file_path.unlink()
    
    # Log audit entry before deletion
    from app.utils import log_audit
    await log_audit(
        db,
        action="DOCUMENT_DELETE",
        resource_type="document",
        description=f"Permanently deleted document: {document.original_filename}",
        changes={"filename": document.filename, "original_filename": document.original_filename}
    )
    # We commit the log before deleting the document if we want to keep the log
    # Note: the log has document_id, which might be a foreign key constraint issue if we delete the document
    # However, AuditLog table has Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    # If it's a hard delete on document, we might lose the log document_id link.
    # But often audit logs should persist.
    
    # Actually, let's set document_id to None in the log if we delete the document?
    # Or just let the foreign key handle it (cascade vs set null).
    # In models.py: document = relationship("Document", back_populates="audit_logs")
    # No cascade delete on audit logs in models.py for AuditLog.
    # So if there is a FK, we might get an error if we don't handle it.
    
    # Let's check models.py for AuditLog FK.
    # document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    # So we should probably NOT link it if we are deleting the document, or use a soft delete.
    
    # For now, I'll log it without the document_id link to avoid FK issues.
    # Actually, I'll just skip the document_id in the log call for DELETE.
    
    # Delete database record
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted successfully"}
