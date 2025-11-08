from pydantic import BaseModel, Field
from typing import Literal

AlertCategory = Literal["Road", "Safety", "Lost", "Weather", "Emergency", "Event", "Infrastructure", "Environment", "Traffic", "Crime", "PublicTransport", "Construction", "General"]
AlertPriority = Literal["Low", "Medium", "High", "Critical"]

class AlertLocation(BaseModel):
    lat: float | None = None
    lng: float | None = None
    address: str | None = None

class LocationHierarchy(BaseModel):
    point: str | None = None  # "lat,lng" format
    area: str | None = None  # e.g., "Gara de Nord", "Herastrau"
    sector: str | None = None  # e.g., "Sector 1"
    city: str | None = None  # "Bucharest"

class AlertCreate(BaseModel):
    title: str
    description: str | None = None
    category: AlertCategory
    priority: AlertPriority = "Medium"
    location: AlertLocation
    location_hierarchy: LocationHierarchy | None = None
    neighborhood: str | None = None  # For backward compatibility
    area_type: str | None = None  # For backward compatibility
    username: str | None = None  # Optional: if provided, link to that user; otherwise anonymous
    phone: str | None = None  # Optional contact phone number
    email: str | None = None  # Optional contact email
    other_contact: str | None = None  # Optional other contact information (e.g., WhatsApp, Telegram, etc.)


class AlertResponse(BaseModel):
    id: str
    title: str
    description: str | None
    category: AlertCategory
    priority: AlertPriority
    location: AlertLocation
    location_hierarchy: LocationHierarchy | None = None  # Hierarchical location data
    neighborhood: str | None = None  # Display location (backward compatibility)
    area_type: str | None = None  # "sector", "area", or "city" (backward compatibility)
    timestamp: int
    user_id: str
    phone: str | None = None  # Optional contact phone number
    email: str | None = None  # Optional contact email
    other_contact: str | None = None  # Optional other contact information
    

class AlertAnalysisRequest(BaseModel):
    text: str
    user_lat: float | None = None  # User's current location
    user_lng: float | None = None

