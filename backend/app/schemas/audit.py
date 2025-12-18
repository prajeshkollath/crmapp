from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class AuditLogResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    changed_by_user_id: Optional[UUID] = None
    timestamp: datetime
    before_data: Optional[Dict[str, Any]] = None
    after_data: Optional[Dict[str, Any]] = None
    changes: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)

class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    logs: list[AuditLogResponse]