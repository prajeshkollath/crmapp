from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from uuid import UUID
import httpx
import asyncio
import json
from datetime import datetime, timezone

from app.models.webhook import WebhookSubscription, IntegrationEvent
from app.core.security import create_webhook_signature

class WebhookService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
    
    async def emit_event(
        self,
        event_name: str,
        payload: Dict[str, Any]
    ):
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.tenant_id == self.tenant_id,
            WebhookSubscription.event_name == event_name,
            WebhookSubscription.enabled == True
        )
        result = await self.db.execute(stmt)
        subscriptions = result.scalars().all()
        
        for subscription in subscriptions:
            asyncio.create_task(self._send_webhook(subscription, payload))
    
    async def _send_webhook(self, subscription: WebhookSubscription, payload: Dict[str, Any]):
        try:
            payload_bytes = json.dumps(payload).encode()
            signature = create_webhook_signature(payload_bytes, subscription.secret)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    subscription.target_url,
                    json=payload,
                    headers={
                        "X-Webhook-Signature": signature,
                        "X-Event-Name": subscription.event_name
                    }
                )
                response.raise_for_status()
        except Exception as e:
            print(f"Webhook delivery failed: {e}")
    
    async def store_inbound_event(
        self,
        event_name: str,
        payload: Dict[str, Any]
    ) -> IntegrationEvent:
        event = IntegrationEvent(
            tenant_id=self.tenant_id,
            event_name=event_name,
            payload=payload,
            status="received",
            received_at=datetime.now(timezone.utc)
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event