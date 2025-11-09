from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    TRUSTED_USER = "trusted_user"
    MODERATOR = "moderator"
    REPRESENTATIVE = "representative"
    BUSINESS_OWNER = "business_owner"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    username: str
    name: str
    is_premium: bool = False
    role: UserRole = UserRole.USER
    show_premium_badge: bool = True
    default_phone: Optional[str] = None
    default_other_contact: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password length and requirements"""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 200:
            raise ValueError('Password must be less than 200 characters long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    date_created: datetime

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: ObjectId
    password_hash: str
    date_created: datetime
    is_premium: bool = False
    role: UserRole = UserRole.USER
    show_premium_badge: bool = True
    default_phone: Optional[str] = None
    default_other_contact: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

