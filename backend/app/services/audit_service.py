from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone

from app.models.audit import AuditLog

class AuditService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
    
    async def log_create(
        self,
        entity_type: str,
        entity_id: UUID,
        after_data: Dict[str, Any],
        user_id: UUID
    ):
        log = AuditLog(
            tenant_id=self.tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action="CREATE",
            changed_by_user_id=user_id,
            after_data=after_data,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log)
        await self.db.commit()
    
    async def log_update(
        self,
        entity_type: str,
        entity_id: UUID,
        before_data: Dict[str, Any],
        after_data: Dict[str, Any],
        user_id: UUID
    ):
        changes = {}
        for key in after_data.keys():
            if key in before_data and before_data[key] != after_data[key]:
                changes[key] = {
                    "old": str(before_data[key]),
                    "new": str(after_data[key])
                }
        
        log = AuditLog(
            tenant_id=self.tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action="UPDATE",
            changed_by_user_id=user_id,
            before_data=before_data,
            after_data=after_data,
            changes=changes,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log)
        await self.db.commit()
    
    async def log_delete(
        self,
        entity_type: str,
        entity_id: UUID,
        before_data: Dict[str, Any],
        user_id: UUID
    ):
        log = AuditLog(
            tenant_id=self.tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action="DELETE",
            changed_by_user_id=user_id,
            before_data=before_data,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log)
        await self.db.commit()