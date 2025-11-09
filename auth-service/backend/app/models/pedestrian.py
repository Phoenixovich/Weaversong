from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PedestrianDataCreate(BaseModel):
    lat: float
    lng: float
    timestamp: Optional[int] = None  # Unix timestamp, defaults to now


class PedestrianDataResponse(BaseModel):
    id: str
    lat: float
    lng: float
    timestamp: int
    hour: int  # 0-23
    day_of_week: int  # 0-6 (Monday=0)
    date: str  # YYYY-MM-DD


class PedestrianAnalyticsRequest(BaseModel):
    location_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius: Optional[float] = 0.01  # Default ~1km radius
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None  # YYYY-MM-DD


class PedestrianAnalyticsResponse(BaseModel):
    location_name: Optional[str]
    lat: float
    lng: float
    total_count: int
    hourly_stats: dict  # {hour: count}
    daily_stats: dict  # {day_of_week: count}
    peak_hours: list  # List of hours with highest traffic
    average_per_hour: float


