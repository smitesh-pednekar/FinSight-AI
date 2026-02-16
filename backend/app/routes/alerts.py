"""API routes for alerts and risk management."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import RiskFlag, Document
from app.schemas import AlertResponse, AlertsListResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=AlertsListResponse)
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all risk flags/alerts.
    
    - Supports filtering by risk level and resolution status
    - Paginated results
    - Ordered by creation date (newest first)
    """
    # Build query with join to get document info
    query = select(RiskFlag, Document).join(Document, RiskFlag.document_id == Document.id)
    
    # Apply filters
    filters = []
    if risk_level:
        filters.append(RiskFlag.risk_level == risk_level)
    if is_resolved is not None:
        filters.append(RiskFlag.is_resolved == is_resolved)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(RiskFlag)
    if filters:
        count_query = count_query.where(and_(*filters))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(RiskFlag.created_at.desc()).offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    rows = result.all()
    
    # Format response
    alerts = []
    for risk, document in rows:
        alerts.append(AlertResponse(
            id=risk.id,
            document_id=risk.document_id,
            document_filename=document.filename,
            risk_type=risk.risk_type,
            risk_level=risk.risk_level,
            description=risk.description,
            created_at=risk.created_at,
            is_resolved=risk.is_resolved
        ))
    
    return AlertsListResponse(
        alerts=alerts,
        total=total
    )


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: uuid.UUID,
    resolution_notes: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark an alert as resolved.
    
    - Requires resolution notes
    - Updates resolution status and timestamp
    """
    # Get risk flag
    result = await db.execute(
        select(RiskFlag).where(RiskFlag.id == alert_id)
    )
    risk_flag = result.scalar_one_or_none()
    
    if not risk_flag:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if risk_flag.is_resolved:
        raise HTTPException(status_code=400, detail="Alert is already resolved")
    
    # Update
    from datetime import datetime
    risk_flag.is_resolved = True
    risk_flag.resolved_at = datetime.utcnow()
    risk_flag.resolution_notes = resolution_notes
    
    await db.commit()
    await db.refresh(risk_flag)
    
    # Log audit entry
    from app.utils import log_audit
    await log_audit(
        db,
        action="ALERT_RESOLVE",
        resource_type="alert",
        document_id=risk_flag.document_id,
        resource_id=risk_flag.id,
        description=f"Resolved risk flag: {risk_flag.risk_type}",
        changes={"resolution_notes": resolution_notes}
    )
    await db.commit()
    
    return {"message": "Alert resolved", "alert": risk_flag}
