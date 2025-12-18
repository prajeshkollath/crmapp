# Webhook Integration Guide

Integrate your CRM with automation platforms like **n8n** and **Activepieces** using webhooks.

---

## Overview

This CRM supports two webhook types:

1. **Outbound Webhooks**: CRM triggers workflows when events happen (e.g., contact created)
2. **Inbound Webhooks**: Workflows can send data into the CRM (e.g., lead captured from form)

---

## Outbound Webhooks (CRM → Workflow)

### Available Events

- `contact.created`
- `contact.updated`
- `contact.deleted`
- `user.created`
- _(Add more as you create modules)_

### Step 1: Create Webhook Subscription

**API Endpoint**: `POST /api/webhooks/subscriptions`

**Request**:
```bash
curl -X POST http://localhost:8001/api/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "event_name": "contact.created",
    "target_url": "https://your-n8n-instance.com/webhook/contact-created",
    "enabled": true
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_name": "contact.created",
  "target_url": "https://your-n8n-instance.com/webhook/contact-created",
  "enabled": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### Step 2: Verify Webhook Signature (Security)

Webhooks include HMAC SHA-256 signature in the `X-Webhook-Signature` header.

**n8n Example** (HTTP Request node):
```javascript
// Get the signature from headers
const signature = $node["Webhook"].context["headers"]["x-webhook-signature"];
const secret = "your-webhook-secret"; // From subscription creation
const payload = JSON.stringify($json);

// Verify signature
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error("Invalid webhook signature");
}

return $json;
```

### Step 3: Handle Webhook in n8n

**Workflow Example**:

1. **Webhook Trigger** node:
   - Method: POST
   - Path: `contact-created`
   - Authentication: None (we verify signature in next step)

2. **Code** node (verify signature):
   ```javascript
   // Signature verification code from above
   ```

3. **Business Logic** nodes:
   - Send email notification
   - Update Google Sheets
   - Create HubSpot contact
   - etc.

**Payload Structure**:
```json
{
  "contact_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com"
}
```

---

## Inbound Webhooks (Workflow → CRM)

### Step 1: Get Your Tenant Credentials

**Get Tenant ID**:
```bash
curl http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

Response includes `tenant_id`.

**Generate API Key** (Admin only):

For MVP, manually update your tenant in the database:

```sql
UPDATE tenants 
SET webhook_api_key = 'your-secure-random-key-here'
WHERE id = 'your-tenant-id';
```

Production: Add UI endpoint to generate/rotate API keys.

### Step 2: Send Webhook from n8n/Activepieces

**Endpoint**: `POST /api/webhooks/{event_name}`

**Required Headers**:
- `X-Tenant-ID`: Your tenant UUID
- `X-API-Key`: Your tenant API key
- `Content-Type`: application/json

**Example** (n8n HTTP Request node):

```javascript
// Node configuration
{
  "url": "http://your-crm-domain.com/api/webhooks/lead.captured",
  "method": "POST",
  "headers": {
    "X-Tenant-ID": "123e4567-e89b-12d3-a456-426614174000",
    "X-API-Key": "your-secure-api-key",
    "Content-Type": "application/json"
  },
  "body": {
    "email": "{{$json["email"]}}",
    "source": "website_form",
    "utm_campaign": "{{$json["utm_campaign"]}}",
    "metadata": {
      "page_url": "{{$json["page_url"]}}",
      "timestamp": "{{$now}}"
    }
  }
}
```

**Response**:
```json
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_name": "lead.captured",
  "payload": {
    "email": "lead@example.com",
    "source": "website_form",
    "utm_campaign": "summer2025"
  },
  "status": "received",
  "received_at": "2025-01-15T10:35:00Z"
}
```

### Step 3: Process Inbound Events

Events are stored in the `integration_events` table. Process them:

**Option A**: Polling (Simple)

```python
# background worker script
import asyncio
from sqlalchemy import select
from app.models.webhook import IntegrationEvent
from app.core.database import AsyncSessionLocal

async def process_events():
    async with AsyncSessionLocal() as db:
        stmt = select(IntegrationEvent).where(
            IntegrationEvent.status == "received"
        ).limit(10)
        result = await db.execute(stmt)
        events = result.scalars().all()
        
        for event in events:
            try:
                # Process event based on event_name
                if event.event_name == "lead.captured":
                    # Create contact from lead
                    pass
                
                event.status = "processed"
                event.processed_at = datetime.now(timezone.utc)
            except Exception as e:
                event.status = "failed"
                event.error_message = str(e)
            
            await db.commit()

# Run every minute
while True:
    await process_events()
    await asyncio.sleep(60)
```

**Option B**: Background Tasks (FastAPI)

Process immediately after receiving:

```python
from fastapi import BackgroundTasks

@router.post("/webhooks/{event_name}")
async def inbound_webhook(
    event_name: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    ...
):
    event = await webhook_service.store_inbound_event(event_name, payload)
    
    # Process in background
    background_tasks.add_task(process_event, event.id, db)
    
    return event
```

---

## Common Use Cases

### 1. Lead Capture from Website Form

**Flow**: Form → n8n → CRM Inbound Webhook → Create Contact

**n8n Workflow**:
1. Webhook Trigger (receives form submission)
2. HTTP Request to CRM:
   ```
   POST /api/webhooks/lead.captured
   Headers: X-Tenant-ID, X-API-Key
   Body: { email, name, source: "website" }
   ```

### 2. Contact Created → Send Welcome Email

**Flow**: CRM Contact Created → Outbound Webhook → n8n → SendGrid

**n8n Workflow**:
1. Webhook Trigger (listens to CRM)
2. Verify Signature
3. HTTP Request to CRM:
   ```
   GET /api/contacts/{contact_id}
   Headers: Authorization: Bearer TOKEN
   ```
4. SendGrid node: Send email template

### 3. Deal Won → Update HubSpot

**Flow**: CRM Deal Updated (stage=won) → Outbound Webhook → n8n → HubSpot API

**n8n Workflow**:
1. Webhook Trigger
2. Verify Signature
3. Check if `$json.stage === "won"`
4. HubSpot node: Create/Update deal

### 4. Stripe Payment → Create Invoice in CRM

**Flow**: Stripe Webhook → n8n → CRM Inbound Webhook → Create Invoice

**n8n Workflow**:
1. Stripe Webhook Trigger
2. HTTP Request to CRM:
   ```
   POST /api/webhooks/payment.received
   Body: { amount, customer_email, invoice_id }
   ```

---

## Activepieces Integration

Same concepts apply. Use Activepieces' HTTP Request pieces:

**Inbound Webhook**:
- Trigger: Webhook
- Action: HTTP Request to CRM
- Headers: X-Tenant-ID, X-API-Key

**Outbound Webhook**:
- Trigger: Webhook (from CRM)
- Actions: Any Activepieces integrations

---

## Security Best Practices

1. **Always Verify Signatures** for outbound webhooks
2. **Rotate API Keys** regularly (build UI for this)
3. **Use HTTPS** in production
4. **Whitelist IPs** if possible (n8n/Activepieces static IPs)
5. **Rate Limiting**: Add to inbound webhook endpoint

---

## Testing Webhooks Locally

### Use ngrok for Local Development

```bash
# Expose local backend
ngrok http 8001

# Use ngrok URL in webhook subscriptions
POST /api/webhooks/subscriptions
{
  "target_url": "https://abc123.ngrok.io/webhook/test"
}
```

### Manual Testing with curl

**Trigger Outbound Webhook**:
```bash
# Create a contact (triggers contact.created webhook)
curl -X POST http://localhost:8001/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'
```

**Test Inbound Webhook**:
```bash
curl -X POST http://localhost:8001/api/webhooks/test.event \
  -H "X-Tenant-ID: your-tenant-id" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Monitoring & Debugging

### Check Webhook Subscriptions

```bash
curl http://localhost:8001/api/webhooks/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Inbound Events

```sql
SELECT * FROM integration_events 
ORDER BY received_at DESC 
LIMIT 10;
```

### Check Webhook Delivery Logs

Add logging to `webhook_service.py`:

```python
import logging

logger = logging.getLogger(__name__)

async def _send_webhook(self, subscription, payload):
    try:
        # ... send webhook
        logger.info(f"Webhook delivered: {subscription.event_name} to {subscription.target_url}")
    except Exception as e:
        logger.error(f"Webhook failed: {subscription.event_name} to {subscription.target_url} - {e}")
```

---

## Summary

### Outbound Webhooks (CRM → n8n/Activepieces)
1. Create subscription via API
2. CRM automatically sends events
3. Verify signature in workflow
4. Build automation logic

### Inbound Webhooks (n8n/Activepieces → CRM)
1. Get tenant ID + API key
2. Send POST request with headers
3. CRM stores event
4. Process event (polling or background task)

---

You now have a fully automation-ready CRM platform!