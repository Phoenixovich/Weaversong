from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HelpboardResponse(BaseModel):
    request_id: str
    responder_id: str
    message: str
    status: str = "pending"
    date_created: Optional[datetime] = Field(default_factory=datetime.utcnow)
    date_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
