from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class WebhookSubscriptionBase(BaseModel):
    event_name: str
    target_url: str
    enabled: bool = True

class WebhookSubscriptionCreate(WebhookSubscriptionBase):
    pass

class WebhookSubscriptionUpdate(BaseModel):
    target_url: Optional[str] = None
    enabled: Optional[bool] = None

class WebhookSubscriptionResponse(WebhookSubscriptionBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class IntegrationEventResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    event_name: str
    payload: Dict[str, Any]
    status: str
    received_at: datetime
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)