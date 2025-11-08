from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from bson import ObjectId


class ReminderBase(BaseModel):
    text: str
    user_id: str


class ReminderCreateRequest(BaseModel):
    text: str


class ReminderCreate(ReminderBase):
    pass


class ReminderResponse(ReminderBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderInDB(ReminderBase):
    id: ObjectId
    created_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

