from uuid import UUID
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog

async def log_audit(
    db: AsyncSession,
    action: str,
    resource_type: str,
    user_id: Optional[UUID] = None,
    document_id: Optional[UUID] = None,
    resource_id: Optional[UUID] = None,
    description: Optional[str] = None,
    changes: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log an action to the audit trail."""
    # For demo, use the hardcoded user_id if none provided
    if not user_id:
        user_id = UUID("00000000-0000-0000-0000-000000000001")
        
    audit_entry = AuditLog(
        user_id=user_id,
        document_id=document_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit_entry)
    # We don't commit here to allow it to be part of the calling transaction if needed
    # But for some routes we might need to commit explicitly
