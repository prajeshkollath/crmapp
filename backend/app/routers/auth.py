from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import re

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter(prefix="/auth", tags=["auth"])


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    picture: Optional[str]
    role: str
    email_verified: bool
    tenant_id: Optional[str]
    
    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user info."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        picture=user.picture,
        role=user.role,
        email_verified=user.email_verified,
        tenant_id=str(user.tenant_id) if user.tenant_id else None
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    if request.name is not None:
        user.name = request.name
    if request.phone is not None:
        user.phone = request.phone
    
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        picture=user.picture,
        role=user.role,
        email_verified=user.email_verified,
        tenant_id=str(user.tenant_id) if user.tenant_id else None
    )


@router.post("/logout")
async def logout(response: Response):
    """Logout - clears any server-side session data."""
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}


@router.post("/setup-tenant")
async def setup_tenant(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a tenant for the user if they don't have one."""
    if user.tenant_id:
        return {"message": "Tenant already exists", "tenant_id": str(user.tenant_id)}
    
    # Create tenant from user email
    slug = re.sub(r'[^a-z0-9]+', '-', user.email.split('@')[0].lower()).strip('-')
    
    # Check if slug exists
    stmt = select(Tenant).where(Tenant.slug == slug)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        slug = f"{slug}-{str(user.id)[:8]}"
    
    tenant = Tenant(
        name=f"{user.name or user.email}'s Organization",
        slug=slug
    )
    db.add(tenant)
    await db.flush()
    
    user.tenant_id = tenant.id
    user.role = 'admin'  # First user of a tenant is admin
    await db.commit()
    
    return {"message": "Tenant created", "tenant_id": str(tenant.id)}
