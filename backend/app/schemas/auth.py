from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class GoogleAuthRequest(BaseModel):
    session_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SessionDataResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    picture: Optional[str] = None
    tenant_id: UUID
    session_token: str