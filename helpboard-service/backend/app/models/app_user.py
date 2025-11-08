from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AppUser(BaseModel):
    username: str
    email: EmailStr
    name: Optional[str] = None
    password_hash: Optional[str] = None
    date_created: Optional[datetime] = None
