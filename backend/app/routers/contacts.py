from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse, ContactListResponse
from app.services.contact_service import ContactService

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.post("", response_model=ContactResponse, dependencies=[Depends(require_permission("contacts.create"))])
async def create_contact(
    contact_data: ContactCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ContactService(db, user.tenant_id)
    return await service.create_contact(contact_data, user.id)

@router.get("", response_model=ContactListResponse, dependencies=[Depends(require_permission("contacts.read"))])
async def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ContactService(db, user.tenant_id)
    contacts, total = await service.list_contacts(
        page, page_size, search, tag, sort_by, sort_order
    )
    return ContactListResponse(
        total=total,
        page=page,
        page_size=page_size,
        contacts=contacts
    )

@router.get("/{contact_id}", response_model=ContactResponse, dependencies=[Depends(require_permission("contacts.read"))])
async def get_contact(
    contact_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ContactService(db, user.tenant_id)
    return await service.get_contact(contact_id)

@router.put("/{contact_id}", response_model=ContactResponse, dependencies=[Depends(require_permission("contacts.update"))])
async def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ContactService(db, user.tenant_id)
    return await service.update_contact(contact_id, contact_data, user.id)

@router.delete("/{contact_id}", dependencies=[Depends(require_permission("contacts.delete"))])
async def delete_contact(
    contact_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ContactService(db, user.tenant_id)
    await service.delete_contact(contact_id, user.id)
    return {"message": "Contact deleted successfully"}