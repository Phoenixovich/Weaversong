from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]


class ResponseRef(BaseModel):
    response_id: Optional[str] = None
    responder_id: Optional[str] = None
    status: str = "pending"


class HelpboardRequest(BaseModel):
    user_id: str
    title: str
    description: Optional[str]
    trade_needed: Optional[str]
    location: Location
    radius_km: int = 2
    status: str = "open"
    urgency: str = "normal"
    budget: Optional[float]
    responses: Optional[List[ResponseRef]] = []
    date_created: Optional[datetime] = Field(default_factory=datetime.utcnow)
    date_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
