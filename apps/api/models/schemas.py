from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional

class UserBase(BaseModel):
    email: EmailStr
    role: Literal['woman', 'child', 'parent', 'admin']

class UserCreate(UserBase):
    name: str # Maps to full_name in DB
    password: str
    phone: Optional[str] = None
    emergencyContact: Optional[str] = None
    aadhaarNumber: Optional[str] = Field(default=None, min_length=12, max_length=12)
    aadhaarReferenceId: Optional[str] = None
    module: str = "m1" # Default to module 1

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    unique_id: Optional[str] = None
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
