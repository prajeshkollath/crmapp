from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.contact_repository import ContactRepository
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.services.audit_service import AuditService
from app.services.webhook_service import WebhookService
from pydantic import TypeAdapter

class ContactService:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
        self.repository = ContactRepository(db, tenant_id)
        self.audit_service = AuditService(db, tenant_id)
        self.webhook_service = WebhookService(db, tenant_id)
    
    async def create_contact(self, contact_data: ContactCreate, user_id: UUID) -> ContactResponse:
        existing = await self.repository.get_by_email(contact_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact with this email already exists in your tenant"
            )
        
        contact = await self.repository.create(contact_data, user_id)
        
        contact_dict = ContactResponse.model_validate(contact).model_dump(mode='json')
        await self.audit_service.log_create(
            "contact",
            contact.id,
            contact_dict,
            user_id
        )
        
        await self.webhook_service.emit_event(
            "contact.created",
            {"contact_id": str(contact.id), "email": contact.email}
        )
        
        return ContactResponse.model_validate(contact)
    
    async def get_contact(self, contact_id: UUID) -> ContactResponse:
        contact = await self.repository.get_by_id(contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        return ContactResponse.model_validate(contact)
    
    async def list_contacts(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        tag: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[ContactResponse], int]:
        contacts, total = await self.repository.list(
            page, page_size, search, tag, sort_by, sort_order
        )
        return [
            ContactResponse.model_validate(contact) for contact in contacts
        ], total
    
    async def update_contact(
        self,
        contact_id: UUID,
        contact_data: ContactUpdate,
        user_id: UUID
    ) -> ContactResponse:
        contact = await self.repository.get_by_id(contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        if contact_data.email and contact_data.email != contact.email:
            existing = await self.repository.get_by_email(contact_data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contact with this email already exists"
                )
        
        before_data = ContactResponse.model_validate(contact).model_dump(mode='json')
        
        updated_contact = await self.repository.update(contact, contact_data, user_id)
        
        after_data = ContactResponse.model_validate(updated_contact).model_dump(mode='json')
        await self.audit_service.log_update(
            "contact",
            contact.id,
            before_data,
            after_data,
            user_id
        )
        
        await self.webhook_service.emit_event(
            "contact.updated",
            {"contact_id": str(contact.id), "email": updated_contact.email}
        )
        
        return ContactResponse.model_validate(updated_contact)
    
    async def delete_contact(self, contact_id: UUID, user_id: UUID) -> None:
        contact = await self.repository.get_by_id(contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        before_data = ContactResponse.model_validate(contact).model_dump(mode='json')
        
        await self.repository.delete(contact)
        
        await self.audit_service.log_delete(
            "contact",
            contact.id,
            before_data,
            user_id
        )
        
        await self.webhook_service.emit_event(
            "contact.deleted",
            {"contact_id": str(contact_id)}
        )