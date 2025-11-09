from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class PedestrianLocation(BaseModel):
    """
    Model for storing pedestrian geolocation data.
    Note: All data is anonymized before storage (user_id, session_id are hashed,
    device_info is sanitized, coordinates are rounded) to protect user privacy.
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[str] = None  # Optional user ID (will be anonymized/hashed before storage)
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    accuracy: Optional[float] = Field(None, ge=0, description="GPS accuracy in meters")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    speed: Optional[float] = Field(None, ge=0, description="Speed in m/s")
    heading: Optional[float] = Field(None, ge=0, le=360, description="Heading in degrees")
    device_info: Optional[dict] = None  # Device type, OS (sanitized - no browser version, model, etc.)
    session_id: Optional[str] = None  # To group locations from same session (will be anonymized/hashed before storage)
    is_active: bool = True  # Whether user is actively moving

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "latitude": 44.4268,
                "longitude": 26.1025,
                "accuracy": 10.5,
                "speed": 1.2,
                "heading": 45.0,
                "device_info": {"type": "mobile", "os": "Android"},
                "session_id": "session_123"
            }
        }


class LocationAnalysisRequest(BaseModel):
    """Request model for analyzing geolocation data"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    bounding_box: Optional[dict] = None  # {min_lat, max_lat, min_lng, max_lng}
    analysis_type: str = Field(default="comprehensive", description="Type of analysis: comprehensive, business_spots, dead_areas, dangerous_areas")


class LocationAnalysisResult(BaseModel):
    """Result model for geolocation analysis"""
    analysis_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    total_locations: int
    unique_users: int
    time_period: dict  # start and end dates
    insights: dict  # AI-generated insights
    business_opportunities: Optional[list] = None
    areas_of_interest: Optional[list] = None
    dead_areas: Optional[list] = None
    dangerous_areas: Optional[list] = None
    heatmap_data: Optional[list] = None  # Aggregated location data for visualization

    class Config:
        json_schema_extra = {
            "example": {
                "analysis_type": "comprehensive",
                "total_locations": 1500,
                "unique_users": 45,
                "insights": {
                    "peak_hours": ["08:00-10:00", "17:00-19:00"],
                    "most_visited_area": {"lat": 44.4268, "lng": 26.1025}
                }
            }
        }

