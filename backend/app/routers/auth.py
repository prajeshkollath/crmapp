from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import httpx
import re

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserSession
from app.models.tenant import Tenant
from app.models.role import Role
from app.models.permission import Permission
from app.schemas.auth import SessionDataResponse
from app.schemas.user import UserWithRoles

router = APIRouter(prefix="/auth", tags=["auth"])

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

@router.post("/session", response_model=SessionDataResponse)
async def process_session(
    session_id: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to verify session: {str(e)}"
            )
    
    stmt = select(User).where(User.email == user_data["email"])
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        slug = re.sub(r'[^a-z0-9]+', '-', user_data["email"].split('@')[0].lower()).strip('-')
        tenant = Tenant(
            name=f"{user_data['name']}'s Organization",
            slug=slug
        )
        db.add(tenant)
        await db.flush()
        
        user = User(
            tenant_id=tenant.id,
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture")
        )
        db.add(user)
        await db.flush()
        
        stmt = select(Permission).where(Permission.name == "*.*")
        result = await db.execute(stmt)
        all_perm = result.scalar_one_or_none()
        if not all_perm:
            all_perm = Permission(
                name="*.*",
                description="All permissions",
                resource="*",
                action="*"
            )
            db.add(all_perm)
            await db.flush()
        
        admin_role = Role(
            tenant_id=tenant.id,
            name="Admin",
            description="Full access administrator"
        )
        db.add(admin_role)
        await db.flush()
        
        admin_role.permissions.append(all_perm)
        user.roles.append(admin_role)
        
        await db.commit()
    
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at
    )
    db.add(user_session)
    await db.commit()
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return SessionDataResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        tenant_id=user.tenant_id,
        session_token=session_token
    )

@router.get("/me", response_model=UserWithRoles)
async def get_current_user_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user.id)
    result = await db.execute(stmt)
    user_with_relations = result.scalar_one()
    
    roles = [role.name for role in user_with_relations.roles]
    permissions = set()
    for role in user_with_relations.roles:
        stmt = select(Role).where(Role.id == role.id)
        result = await db.execute(stmt)
        role_with_perms = result.scalar_one_or_none()
        if role_with_perms:
            for perm in role_with_perms.permissions:
                permissions.add(f"{perm.resource}.{perm.action}")
    
    return UserWithRoles(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
        permissions=list(permissions)
    )

@router.post("/logout")
async def logout(
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSession).where(UserSession.user_id == user.id)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    for session in sessions:
        await db.delete(session)
    await db.commit()
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}