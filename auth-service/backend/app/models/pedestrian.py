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


class LocationGroup(BaseModel):
    grid_key: str
    lat: float
    lng: float
    count: int
    traffic_score: float
    hourly_distribution: dict
    daily_distribution: dict
    peak_hours: list
    peak_hour_counts: list
    address: Optional[str] = None
    area_name: Optional[str] = None


class BusinessLocationSuggestion(BaseModel):
    rank: int
    lat: float
    lng: float
    address: str
    traffic_score: float
    reasoning: str
    business_type: str
    estimated_daily_visitors: int
    best_hours: list
    recommendations: list


class PedestrianLocationAnalysisRequest(BaseModel):
    start_date: Optional[str] = None  # ISO format or YYYY-MM-DD
    end_date: Optional[str] = None  # ISO format or YYYY-MM-DD
    business_type: str = "general"  # e.g., "vending_machine", "cafe", "restaurant", "shop"
    max_suggestions: int = 10
    use_cache: bool = True
    force_refresh: bool = False


class PedestrianLocationAnalysisResponse(BaseModel):
    analysis_date: str
    start_date: str
    end_date: str
    total_locations_analyzed: int
    location_groups: dict  # Dict[str, LocationGroup]
    suggestions: list  # List[BusinessLocationSuggestion]
    snapshot_key: str
    from_cache: bool


