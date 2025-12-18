from fastapi import APIRouter, Depends, Request, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from uuid import UUID
import json

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.models.webhook import WebhookSubscription
from app.schemas.webhook import (
    WebhookSubscriptionCreate,
    WebhookSubscriptionUpdate,
    WebhookSubscriptionResponse,
    IntegrationEventResponse
)
from app.services.webhook_service import WebhookService
from app.core.security import verify_webhook_signature, generate_webhook_secret

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/{event_name}")
async def inbound_webhook(
    event_name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_tenant_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    if not x_tenant_id or not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing tenant ID or API key"
        )
    
    try:
        tenant_id = UUID(x_tenant_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant ID format"
        )
    
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant or tenant.webhook_api_key != x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tenant or API key"
        )
    
    payload = await request.json()
    
    webhook_service = WebhookService(db, tenant_id)
    event = await webhook_service.store_inbound_event(event_name, payload)
    
    return IntegrationEventResponse.model_validate(event)

@router.post("/subscriptions", response_model=WebhookSubscriptionResponse)
async def create_webhook_subscription(
    subscription_data: WebhookSubscriptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subscription = WebhookSubscription(
        **subscription_data.model_dump(),
        tenant_id=user.tenant_id,
        secret=generate_webhook_secret()
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return WebhookSubscriptionResponse.model_validate(subscription)

@router.get("/subscriptions", response_model=list[WebhookSubscriptionResponse])
async def list_webhook_subscriptions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.tenant_id == user.tenant_id
    )
    result = await db.execute(stmt)
    subscriptions = result.scalars().all()
    return [
        WebhookSubscriptionResponse.model_validate(sub)
        for sub in subscriptions
    ]

@router.delete("/subscriptions/{subscription_id}")
async def delete_webhook_subscription(
    subscription_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.id == subscription_id,
        WebhookSubscription.tenant_id == user.tenant_id
    )
    result = await db.execute(stmt)
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    await db.delete(subscription)
    await db.commit()
    return {"message": "Subscription deleted successfully"}