from pydantic import BaseModel
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
	neighborhood: str | None = None
	area_type: str | None = None
	username: str | None = None
	phone: str | None = None
	email: str | None = None
	other_contact: str | None = None


class AlertResponse(BaseModel):
	id: str
	title: str
	description: str | None
	category: AlertCategory
	priority: AlertPriority
	location: AlertLocation
	location_hierarchy: LocationHierarchy | None = None
	neighborhood: str | None = None
	area_type: str | None = None
	timestamp: int
	user_id: str
	phone: str | None = None
	email: str | None = None
	other_contact: str | None = None


class AlertAnalysisRequest(BaseModel):
	text: str
	user_lat: float | None = None
	user_lng: float | None = None
	is_speech: bool = False

