"""API routes for reports generation."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Document
from app.schemas import ReportRequest, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a comprehensive audit-ready report for a document.
    
    - Includes all extracted data, validations, and risk flags
    - Suitable for compliance and auditing purposes
    - Returns structured JSON that can be downloaded
    """
    # Query with eager loading
    query = (
        select(Document)
        .options(
            selectinload(Document.extractions),
            selectinload(Document.validations),
            selectinload(Document.risk_flags)
        )
        .where(Document.id == request.document_id)
    )
    
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Build report
    report = ReportResponse(
        document=document,
        extractions=document.extractions if request.include_extractions else [],
        validations=document.validations if request.include_validations else [],
        risk_flags=document.risk_flags if request.include_risks else [],
        generated_at=datetime.utcnow()
    )
    
    return report


@router.get("/{document_id}", response_model=ReportResponse)
async def get_document_report(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a complete report for a document (convenience endpoint).
    
    - Includes all data by default
    """
    request = ReportRequest(
        document_id=document_id,
        include_extractions=True,
        include_validations=True,
        include_risks=True
    )
    
    return await generate_report(request, db)
