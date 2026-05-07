from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str # 'woman'|'child'|'parent'|'admin'
    module: str # 'm1'|'m2'|'m3'

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_metadata: Optional[Dict[str, Any]] = None

class AadhaarOTPRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12)

class AadhaarVerifyRequest(BaseModel):
    otp: str
    reference_id: str
    aadhaar_number: Optional[str] = None # Optional, usually reference_id is enough

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    sub: Optional[str] = None
