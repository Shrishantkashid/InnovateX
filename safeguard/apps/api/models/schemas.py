from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    email: EmailStr
    role: str # 'woman'|'child'|'parent'|'admin'

class UserCreate(UserBase):
    name: str # Maps to full_name in DB
    password: str
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None # Can be stored in metadata or phone
    module: str = "m1" # Default to module 1

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool = False
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class AadhaarOTPRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12)

class AadhaarOTPResponse(BaseModel):
    reference_id: str
    message: str

class AadhaarVerifyRequest(BaseModel):
    reference_id: str
    otp: str
