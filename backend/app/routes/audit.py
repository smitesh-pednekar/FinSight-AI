"""API routes for audit logs."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogListResponse

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List all audit logs for tracking activity.
    
    - Provides a full history of system actions
    - Paginated and sorted by newest first
    """
    # Build query
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(AuditLog)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return AuditLogListResponse(
        logs=logs,
        total=total
    )
