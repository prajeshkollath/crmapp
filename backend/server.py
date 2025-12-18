from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="CRM Platform API",
    description="Multi-tenant CRM with automation hooks",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "crm-platform"}

@app.get("/api/")
async def root():
    return {"message": "CRM Platform API - Demo Mode (Configure PostgreSQL for full features)"}

@app.get("/api/auth/me")
async def get_current_user():
    # Mock user for demo
    return {
        "id": "demo-user-123",
        "email": "demo@example.com",
        "name": "Demo User",
        "picture": "https://via.placeholder.com/150",
        "tenant_id": "demo-tenant-123",
        "is_active": True,
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z",
        "roles": ["Admin"],
        "permissions": ["*.*"]
    }

@app.get("/api/contacts")
async def list_contacts():
    # Mock contacts for demo
    return {
        "total": 2,
        "page": 1,
        "page_size": 20,
        "contacts": [
            {
                "id": "contact-1",
                "tenant_id": "demo-tenant-123",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "company": "Acme Corp",
                "tags": ["prospect", "enterprise"],
                "created_at": "2025-01-15T10:00:00Z",
                "updated_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": "contact-2",
                "tenant_id": "demo-tenant-123",
                "first_name": "Jane",
                "last_name": "Smith",
                "email": "jane@example.com",
                "phone": "+0987654321",
                "company": "Tech Inc",
                "tags": ["customer", "vip"],
                "created_at": "2025-01-14T09:00:00Z",
                "updated_at": "2025-01-14T09:00:00Z"
            }
        ]
    }

@app.get("/api/audit/logs")
async def get_audit_logs():
    # Mock audit logs for demo
    return {
        "total": 3,
        "page": 1,
        "page_size": 50,
        "logs": [
            {
                "id": "log-1",
                "tenant_id": "demo-tenant-123",
                "entity_type": "contact",
                "entity_id": "contact-1",
                "action": "CREATE",
                "changed_by_user_id": "demo-user-123",
                "timestamp": "2025-01-15T10:00:00Z",
                "after_data": {"name": "John Doe"}
            },
            {
                "id": "log-2",
                "tenant_id": "demo-tenant-123",
                "entity_type": "contact",
                "entity_id": "contact-1",
                "action": "UPDATE",
                "changed_by_user_id": "demo-user-123",
                "timestamp": "2025-01-15T11:00:00Z",
                "before_data": {"company": "Old Corp"},
                "after_data": {"company": "Acme Corp"}
            },
            {
                "id": "log-3",
                "tenant_id": "demo-tenant-123",
                "entity_type": "contact",
                "entity_id": "contact-2",
                "action": "CREATE",
                "changed_by_user_id": "demo-user-123",
                "timestamp": "2025-01-14T09:00:00Z",
                "after_data": {"name": "Jane Smith"}
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
