from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID

from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate

class ContactRepository:
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
    
    async def create(self, contact_data: ContactCreate, created_by: UUID) -> Contact:
        contact = Contact(
            **contact_data.model_dump(),
            tenant_id=self.tenant_id,
            created_by=created_by,
            updated_by=created_by
        )
        self.db.add(contact)
        await self.db.commit()
        await self.db.refresh(contact)
        return contact
    
    async def get_by_id(self, contact_id: UUID) -> Optional[Contact]:
        stmt = select(Contact).where(
            Contact.id == contact_id,
            Contact.tenant_id == self.tenant_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[Contact]:
        stmt = select(Contact).where(
            Contact.email == email,
            Contact.tenant_id == self.tenant_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        tag: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Contact], int]:
        stmt = select(Contact).where(Contact.tenant_id == self.tenant_id)
        
        if search:
            search_filter = or_(
                Contact.first_name.ilike(f"%{search}%"),
                Contact.last_name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
                Contact.phone.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        if tag:
            stmt = stmt.where(Contact.tags.contains([tag]))
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar()
        
        if sort_order == "desc":
            stmt = stmt.order_by(getattr(Contact, sort_by).desc())
        else:
            stmt = stmt.order_by(getattr(Contact, sort_by).asc())
        
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(stmt)
        contacts = result.scalars().all()
        
        return contacts, total
    
    async def update(self, contact: Contact, contact_data: ContactUpdate, updated_by: UUID) -> Contact:
        update_data = contact_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        contact.updated_by = updated_by
        
        await self.db.commit()
        await self.db.refresh(contact)
        return contact
    
    async def delete(self, contact: Contact) -> None:
        await self.db.delete(contact)
        await self.db.commit()