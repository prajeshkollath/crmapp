from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.firebase_auth import verify_firebase_token
from app.models.user import User, UserSession
from app.models.role import Role
from app.models.permission import Permission

security = HTTPBearer(auto_error=False)


async def get_firebase_token(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extract Firebase ID token from Authorization header."""
    if credentials:
        return credentials.credentials
    return None


async def get_current_user_firebase(
    db: AsyncSession = Depends(get_db), 
    token: Optional[str] = Depends(get_firebase_token)
) -> User:
    """
    Validate Firebase token and get/create user in database.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        # Verify Firebase token
        decoded = verify_firebase_token(token)
        firebase_uid = decoded['uid']
        email = decoded.get('email')
        name = decoded.get('name') or decoded.get('email', '').split('@')[0]
        picture = decoded.get('picture')
        email_verified = decoded.get('email_verified', False)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    # Find user by Firebase UID
    stmt = select(User).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user on first login (upsert pattern)
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name,
            picture=picture,
            email_verified=email_verified,
            role='agent',  # Default role
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update user info on login
        if name and user.name != name:
            user.name = name
        if picture and user.picture != picture:
            user.picture = picture
        if user.email_verified != email_verified:
            user.email_verified = email_verified
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(get_firebase_token)
) -> User:
    """
    Get current authenticated user. Uses Firebase authentication.
    """
    return await get_current_user_firebase(db, token)


async def get_user_permissions(user: User, db: AsyncSession) -> set:
    """Get all permissions for a user based on their roles."""
    permissions = set()
    
    # Add default permissions based on role
    role_permissions = {
        'admin': {'*.*'},  # Full access
        'manager': {
            'contacts.read', 'contacts.create', 'contacts.update', 'contacts.delete',
            'audit.read',
            'webhooks.read', 'webhooks.create',
        },
        'agent': {
            'contacts.read', 'contacts.create', 'contacts.update',
            'audit.read',
        },
        'viewer': {
            'contacts.read',
            'audit.read',
        }
    }
    
    user_role = user.role or 'viewer'
    permissions.update(role_permissions.get(user_role, set()))
    
    return permissions


def require_permission(permission: str):
    """Dependency to check if user has required permission."""
    async def permission_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        user_perms = await get_user_permissions(user, db)
        
        if permission not in user_perms and '*.*' not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        return user
    return permission_checker


def require_role(allowed_roles: list):
    """Dependency to check if user has one of the allowed roles."""
    async def role_checker(
        user: User = Depends(get_current_user)
    ):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker
