from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Trade(BaseModel):
    name: str
    experience_years: int = 0
    description: Optional[str] = None
    rate: Optional[float] = None


class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class HelpboardUser(BaseModel):
    user_id: str
    location: Location
    radius_km: int = 3
    trades: List[Trade]
    availability: str = "available"
    date_created: Optional[datetime] = Field(default_factory=datetime.utcnow)
    date_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
