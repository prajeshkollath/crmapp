# Module Replication Guide

This guide shows you how to add new modules (Companies, Deals, Tasks, etc.) by replicating the **Contacts** module pattern.

---

## Overview

The Contacts module demonstrates the complete pattern:
- ✅ Database model with tenant isolation
- ✅ Pydantic schemas for validation
- ✅ Repository for data access
- ✅ Service with business logic + audit + webhooks
- ✅ Router with permission enforcement
- ✅ Alembic migration

To add a new module (e.g., **Companies**), you copy and adapt these 7 files.

---

## Step 1: Create the Database Model

**File**: `backend/app/models/company.py`

```python
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
import uuid
from app.models.base import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Your business fields
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(JSONB, default=list, nullable=False)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
```

**Key Rules**:
- Always include `tenant_id` with `ForeignKey` and `index=True`
- Add `created_at`, `updated_at`, `created_by`, `updated_by` for audit
- Use `UUID` for primary keys
- Use `JSONB` for flexible fields like tags, metadata

---

## Step 2: Create Pydantic Schemas

**File**: `backend/app/schemas/company.py`

```python
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class CompanyResponse(CompanyBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class CompanyListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    companies: List[CompanyResponse]
```

---

## Step 3: Create Repository

**File**: `backend/app/repositories/company_repository.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate

class CompanyRepository:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
    
    async def create(self, company_data: CompanyCreate, created_by: UUID) -> Company:
        company = Company(
            **company_data.model_dump(),
            tenant_id=self.tenant_id,
            created_by=created_by,
            updated_by=created_by
        )
        self.db.add(company)
        await self.db.commit()
        await self.db.refresh(company)
        return company
    
    async def get_by_id(self, company_id: UUID) -> Optional[Company]:
        stmt = select(Company).where(
            Company.id == company_id,
            Company.tenant_id == self.tenant_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Company], int]:
        stmt = select(Company).where(Company.tenant_id == self.tenant_id)
        
        if search:
            stmt = stmt.where(
                or_(
                    Company.name.ilike(f"%{search}%"),
                    Company.domain.ilike(f"%{search}%")
                )
            )
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar()
        
        if sort_order == "desc":
            stmt = stmt.order_by(getattr(Company, sort_by).desc())
        else:
            stmt = stmt.order_by(getattr(Company, sort_by).asc())
        
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        companies = result.scalars().all()
        
        return companies, total
    
    async def update(self, company: Company, company_data: CompanyUpdate, updated_by: UUID) -> Company:
        update_data = company_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        company.updated_by = updated_by
        
        await self.db.commit()
        await self.db.refresh(company)
        return company
    
    async def delete(self, company: Company) -> None:
        await self.db.delete(company)
        await self.db.commit()
```

**Key Pattern**: Repository always:
1. Receives `tenant_id` in constructor
2. Filters all queries by `tenant_id`
3. Never exposes cross-tenant data

---

## Step 4: Create Service

**File**: `backend/app/services/company_service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.services.audit_service import AuditService
from app.services.webhook_service import WebhookService

class CompanyService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.repository = CompanyRepository(db, tenant_id)
        self.audit_service = AuditService(db, tenant_id)
        self.webhook_service = WebhookService(db, tenant_id)
    
    async def create_company(self, company_data: CompanyCreate, user_id: UUID) -> CompanyResponse:
        company = await self.repository.create(company_data, user_id)
        
        # Audit log
        company_dict = CompanyResponse.model_validate(company).model_dump(mode='json')
        await self.audit_service.log_create(
            "company",
            company.id,
            company_dict,
            user_id
        )
        
        # Webhook event
        await self.webhook_service.emit_event(
            "company.created",
            {"company_id": str(company.id), "name": company.name}
        )
        
        return CompanyResponse.model_validate(company)
    
    async def get_company(self, company_id: UUID) -> CompanyResponse:
        company = await self.repository.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return CompanyResponse.model_validate(company)
    
    async def list_companies(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> tuple[List[CompanyResponse], int]:
        companies, total = await self.repository.list(page, page_size, search)
        return [
            CompanyResponse.model_validate(company) for company in companies
        ], total
    
    async def update_company(
        self,
        company_id: UUID,
        company_data: CompanyUpdate,
        user_id: UUID
    ) -> CompanyResponse:
        company = await self.repository.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        before_data = CompanyResponse.model_validate(company).model_dump(mode='json')
        updated_company = await self.repository.update(company, company_data, user_id)
        after_data = CompanyResponse.model_validate(updated_company).model_dump(mode='json')
        
        await self.audit_service.log_update(
            "company",
            company.id,
            before_data,
            after_data,
            user_id
        )
        
        await self.webhook_service.emit_event(
            "company.updated",
            {"company_id": str(company.id), "name": updated_company.name}
        )
        
        return CompanyResponse.model_validate(updated_company)
    
    async def delete_company(self, company_id: UUID, user_id: UUID) -> None:
        company = await self.repository.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        before_data = CompanyResponse.model_validate(company).model_dump(mode='json')
        await self.repository.delete(company)
        
        await self.audit_service.log_delete(
            "company",
            company.id,
            before_data,
            user_id
        )
        
        await self.webhook_service.emit_event(
            "company.deleted",
            {"company_id": str(company_id)}
        )
```

**Service Pattern**: Always includes:
1. Audit logging (CREATE, UPDATE, DELETE)
2. Webhook events
3. Business logic and validation

---

## Step 5: Create Router

**File**: `backend/app/routers/companies.py`

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyListResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])

@router.post("", response_model=CompanyResponse, dependencies=[Depends(require_permission("companies.create"))])
async def create_company(
    company_data: CompanyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db, user.tenant_id)
    return await service.create_company(company_data, user.id)

@router.get("", response_model=CompanyListResponse, dependencies=[Depends(require_permission("companies.read"))])
async def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db, user.tenant_id)
    companies, total = await service.list_companies(page, page_size, search)
    return CompanyListResponse(
        total=total,
        page=page,
        page_size=page_size,
        companies=companies
    )

@router.get("/{company_id}", response_model=CompanyResponse, dependencies=[Depends(require_permission("companies.read"))])
async def get_company(
    company_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db, user.tenant_id)
    return await service.get_company(company_id)

@router.put("/{company_id}", response_model=CompanyResponse, dependencies=[Depends(require_permission("companies.update"))])
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db, user.tenant_id)
    return await service.update_company(company_id, company_data, user.id)

@router.delete("/{company_id}", dependencies=[Depends(require_permission("companies.delete"))])
async def delete_company(
    company_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db, user.tenant_id)
    await service.delete_company(company_id, user.id)
    return {"message": "Company deleted successfully"}
```

**Router Pattern**: Each endpoint:
1. Enforces permission via `require_permission()`
2. Gets current user for tenant context
3. Delegates to service layer

---

## Step 6: Register Router

**File**: `backend/server.py`

Add import and include:

```python
from app.routers import auth, contacts, companies, webhooks, audit

app.include_router(companies.router, prefix="/api")
```

---

## Step 7: Create Migration

```bash
cd backend
alembic revision --autogenerate -m "Add companies table"
alembic upgrade head
```

---

## Step 8: Add Permissions

Create a seeder script or add via SQL:

```sql
INSERT INTO permissions (id, name, description, resource, action) VALUES
(gen_random_uuid(), 'companies.read', 'View companies', 'companies', 'read'),
(gen_random_uuid(), 'companies.create', 'Create companies', 'companies', 'create'),
(gen_random_uuid(), 'companies.update', 'Update companies', 'companies', 'update'),
(gen_random_uuid(), 'companies.delete', 'Delete companies', 'companies', 'delete');
```

Add to Admin role:

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin' AND p.resource = 'companies';
```

---

## Step 9: Frontend (Optional)

Create corresponding React components:
- `CompanyList.jsx` - Table view
- `CompanyForm.jsx` - Create/Edit modal
- API calls in `api/companies.js`

---

## Checklist for New Module

- [ ] Create model with `tenant_id`, audit fields
- [ ] Create Pydantic schemas (Base, Create, Update, Response)
- [ ] Create repository with tenant filtering
- [ ] Create service with audit + webhooks
- [ ] Create router with permission checks
- [ ] Register router in `server.py`
- [ ] Create Alembic migration
- [ ] Add permissions to database
- [ ] Test CRUD operations
- [ ] Add frontend components (if needed)

---

## Common Modules to Add

### Deals/Opportunities
```python
class Deal(Base):
    __tablename__ = "deals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    stage = Column(String(50), nullable=False)
    probability = Column(Integer, default=0)
    expected_close_date = Column(Date, nullable=True)
    contact_id = Column(UUID(as_uuid=True), ForeignKey('contacts.id'), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=True)
    # ... audit fields
```

### Tasks
```python
class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="todo")
    priority = Column(String(20), default="medium")
    due_date = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    # ... audit fields
```

### Email Templates
```python
class EmailTemplate(Base):
    __tablename__ = "email_templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.id'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=True)
    # ... audit fields
```

---

## Summary

Adding a new module requires:
1. **7 files** to copy/adapt from Contacts
2. **1 migration** to create the table
3. **4 permissions** to add to database
4. **~30 minutes** for an experienced developer

The pattern ensures:
- ✅ Tenant isolation
- ✅ Permission enforcement
- ✅ Audit logging
- ✅ Webhook integration
- ✅ Clean architecture

You now have a production-ready, extensible CRM platform!