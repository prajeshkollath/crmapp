from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserSession
from app.models.role import Role
from app.models.permission import Permission

security = HTTPBearer(auto_error=False)

async def get_session_token(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    session_token = request.cookies.get("session_token")
    if not session_token and credentials:
        session_token = credentials.credentials
    return session_token

async def get_current_user(db: AsyncSession = Depends(get_db), session_token: Optional[str] = Depends(get_session_token)) -> User:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    stmt = select(UserSession).where(UserSession.session_token == session_token)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    stmt = select(User).where(User.id == session.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

async def get_user_permissions(user: User, db: AsyncSession) -> set:
    permissions = set()
    
    stmt = select(User).where(User.id == user.id)
    result = await db.execute(stmt)
    user_with_roles = result.scalar_one_or_none()
    
    if user_with_roles:
        for role in user_with_roles.roles:
            stmt = select(Role).where(Role.id == role.id)
            result = await db.execute(stmt)
            role_with_perms = result.scalar_one_or_none()
            if role_with_perms:
                for perm in role_with_perms.permissions:
                    permissions.add(f"{perm.resource}.{perm.action}")
        
        for group in user_with_roles.groups:
            for perm in group.permissions:
                permissions.add(f"{perm.resource}.{perm.action}")
    
    return permissions

def require_permission(permission: str):
    async def permission_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        user_perms = await get_user_permissions(user, db)
        
        if permission not in user_perms and "*.*" not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        return user
    return permission_checker