import re
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.database import get_database
from app.models.citypulse_alert import AlertCreate, AlertResponse, AlertAnalysisRequest, LocationSearchRequest
from app.services import ai_analysis
from app.services.ai_analysis import VALID_CATEGORIES, VALID_PRIORITIES
from app.services.ai_title_generator import generate_title
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.user import UserInDB
from app.utils.permissions import can_edit_alert, can_delete_alert

router = APIRouter(prefix="/citypulse/alerts", tags=["citypulse"])


def get_date_range(date_filter: str | None) -> tuple[int, int] | None:
	"""Calculate timestamp range based on date filter option."""
	if not date_filter:
		return None
	
	now = datetime.now()
	today_start = datetime(now.year, now.month, now.day)
	
	if date_filter == "today":
		start_timestamp = int(today_start.timestamp())
		end_timestamp = int(now.timestamp())
		return (start_timestamp, end_timestamp)
	
	elif date_filter == "past_3_days":
		start_date = today_start - timedelta(days=3)
		start_timestamp = int(start_date.timestamp())
		end_timestamp = int(now.timestamp())
		return (start_timestamp, end_timestamp)
	
	elif date_filter == "this_week":
		# Get start of week (Monday)
		days_since_monday = now.weekday()
		week_start = today_start - timedelta(days=days_since_monday)
		start_timestamp = int(week_start.timestamp())
		end_timestamp = int(now.timestamp())
		return (start_timestamp, end_timestamp)
	
	elif date_filter == "this_month":
		month_start = datetime(now.year, now.month, 1)
		start_timestamp = int(month_start.timestamp())
		end_timestamp = int(now.timestamp())
		return (start_timestamp, end_timestamp)
	
	return None


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
	neighborhood: List[str] | None = Query(None, description="Filter by neighborhood/area (can specify multiple)"),
	category: List[str] | None = Query(None, description="Filter by category (can specify multiple)"),
	priority: List[str] | None = Query(None, description="Filter by priority (can specify multiple)"),
	date_filter: str | None = Query(None, description="Filter by date: today, past_3_days, this_week, this_month"),
):
	"""Get all CityPulse alerts. Tries to use MongoDB if configured; returns empty list if DB not available."""
	try:
		db = get_database()
	except Exception:
		# Database not connected
		raise HTTPException(status_code=503, detail="Database not connected")

	query = {}
	and_conditions = []
	
	# Handle multiple neighborhoods (OR logic - alert matches any of the selected neighborhoods)
	if neighborhood and len(neighborhood) > 0:
		# Also check location_hierarchy for area/sector matches
		neighborhood_query = {"$or": [
			{"neighborhood": {"$in": neighborhood}},
			{"location_hierarchy.area": {"$in": neighborhood}},
			{"location_hierarchy.sector": {"$in": neighborhood}},
		]}
		and_conditions.append(neighborhood_query)
	
	# Handle multiple categories (OR logic)
	if category and len(category) > 0:
		and_conditions.append({"category": {"$in": category}})
	
	# Handle multiple priorities (OR logic)
	if priority and len(priority) > 0:
		and_conditions.append({"priority": {"$in": priority}})
	
	# Add date filter
	date_range = get_date_range(date_filter)
	if date_range:
		start_ts, end_ts = date_range
		and_conditions.append({"timestamp": {"$gte": start_ts, "$lte": end_ts}})
	
	# Combine all conditions with $and if we have multiple filters
	if len(and_conditions) > 1:
		query["$and"] = and_conditions
	elif len(and_conditions) == 1:
		query.update(and_conditions[0])

	cursor = db.alerts.find(query).sort("timestamp", -1)
	alerts = []
	async for doc in cursor:
		alerts.append(AlertResponse(
			id=str(doc.get("_id")),
			title=doc.get("title"),
			description=doc.get("description"),
			category=doc.get("category"),
			priority=doc.get("priority", "Medium"),
			location=doc.get("location", {}),
			location_hierarchy=doc.get("location_hierarchy"),
			neighborhood=doc.get("neighborhood"),
			area_type=doc.get("area_type"),
			timestamp=doc.get("timestamp", 0),
			user_id=doc.get("user_id", ""),
			phone=doc.get("phone"),
			email=doc.get("email"),
			other_contact=doc.get("other_contact"),
		))
	return alerts


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
	alert: AlertCreate,
	current_user: Optional[UserInDB] = Depends(get_current_user_optional)
):
	"""Create a CityPulse alert and persist to MongoDB when available."""
	try:
		db = get_database()
	except Exception:
		raise HTTPException(status_code=503, detail="Database not connected")

	# Use authenticated user ID if available, otherwise use username or empty string
	user_id = str(current_user.id) if current_user else (alert.username or "")

	doc = {
		"title": alert.title,
		"description": alert.description,
		"category": alert.category,
		"priority": alert.priority,
		"location": alert.location.model_dump(),
		"location_hierarchy": alert.location_hierarchy.model_dump() if alert.location_hierarchy else None,
		"neighborhood": alert.neighborhood,
		"area_type": alert.area_type,
		"timestamp": int(datetime.now().timestamp()),
		"user_id": user_id,
		"phone": alert.phone,
		"email": alert.email,
		"other_contact": alert.other_contact,
	}

	result = await db.alerts.insert_one(doc)
	created = await db.alerts.find_one({"_id": result.inserted_id})

	return AlertResponse(
		id=str(created.get("_id")),
		title=created.get("title"),
		description=created.get("description"),
		category=created.get("category"),
		priority=created.get("priority", "Medium"),
		location=created.get("location", {}),
		location_hierarchy=created.get("location_hierarchy"),
		neighborhood=created.get("neighborhood"),
		area_type=created.get("area_type"),
		timestamp=created.get("timestamp", 0),
		user_id=created.get("user_id", ""),
		phone=created.get("phone"),
		email=created.get("email"),
		other_contact=created.get("other_contact"),
	)


@router.post("/location/geocode", response_model=dict)
async def geocode_location(lat: float = Query(...), lng: float = Query(...)):
	"""Get location hierarchy (area, sector, address) from coordinates. Only for Bucharest."""
	from app.services.location_hierarchy import get_location_hierarchy
	from app.services.geocoding import reverse_geocode_with_sector
	
	# Bucharest bounds check
	BUCHAREST_BOUNDS = {
		"min_lat": 44.35,
		"max_lat": 44.55,
		"min_lng": 25.95,
		"max_lng": 26.25
	}
	
	if not (BUCHAREST_BOUNDS["min_lat"] <= lat <= BUCHAREST_BOUNDS["max_lat"] and
			BUCHAREST_BOUNDS["min_lng"] <= lng <= BUCHAREST_BOUNDS["max_lng"]):
		raise HTTPException(
			status_code=400,
			detail="Location must be within Bucharest bounds"
		)
	
	try:
		# Get location hierarchy
		hierarchy = await get_location_hierarchy(lat=lat, lng=lng)
		
		# Get address
		geocode_result = await reverse_geocode_with_sector(lat, lng)
		address = geocode_result.get("address") if geocode_result else None
		
		return {
			"lat": lat,
			"lng": lng,
			"address": address,
			"location_hierarchy": hierarchy,
			"area": hierarchy.get("area"),
			"sector": hierarchy.get("sector"),
			"city": hierarchy.get("city", "Bucharest")
		}
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to geocode location: {str(e)}"
		)


@router.post("/location/search", response_model=dict)
async def search_location(request: LocationSearchRequest):
	"""Search for locations in Bucharest by name."""
	from app.services.geocoding import geocode_address
	from app.services.location_hierarchy import get_location_hierarchy
	
	query = request.query.strip()
	if not query:
		return {
			"results": [],
			"message": "Query parameter is required"
		}
	
	try:
		print(f"Searching for location: {query}")
		# Geocode the search query
		geocode = await geocode_address(query)
		if not geocode:
			print(f"No geocode result for: {query}")
			return {
				"results": [],
				"message": f"No locations found for '{query}'. Try searching for a specific area in Bucharest (e.g., 'Herastrau', 'Piata Unirii', 'Sector 1')."
			}
		
		print(f"Geocode result: {geocode}")
		lat = geocode.get("lat")
		lng = geocode.get("lng")
		address = geocode.get("address")
		
		if not lat or not lng:
			print(f"Missing coordinates in geocode result: {geocode}")
			return {
				"results": [],
				"message": "Could not determine coordinates for this location"
			}
		
		# Check if within Bucharest bounds
		BUCHAREST_BOUNDS = {
			"min_lat": 44.35,
			"max_lat": 44.55,
			"min_lng": 25.95,
			"max_lng": 26.25
		}
		
		if not (BUCHAREST_BOUNDS["min_lat"] <= lat <= BUCHAREST_BOUNDS["max_lat"] and
				BUCHAREST_BOUNDS["min_lng"] <= lng <= BUCHAREST_BOUNDS["max_lng"]):
			print(f"Location outside Bucharest bounds: lat={lat}, lng={lng}")
			return {
				"results": [],
				"message": f"Location '{query}' is outside Bucharest. Please search for locations within Bucharest only."
			}
		
		# Get location hierarchy
		hierarchy = await get_location_hierarchy(lat=lat, lng=lng, address=address)
		print(f"Location hierarchy: {hierarchy}")
		
		result = {
			"results": [{
				"lat": lat,
				"lng": lng,
				"address": address,
				"location_hierarchy": hierarchy,
				"area": hierarchy.get("area"),
				"sector": hierarchy.get("sector"),
				"city": hierarchy.get("city", "Bucharest")
			}]
		}
		print(f"Returning search result: {result}")
		return result
	except Exception as e:
		print(f"Error searching location: {e}")
		import traceback
		traceback.print_exc()
		raise HTTPException(
			status_code=500,
			detail=f"Failed to search location: {str(e)}"
		)


@router.post("/analyze", response_model=dict)
async def analyze_alert_text(request: AlertAnalysisRequest):
	"""Analyze alert text and extract structured alert data (title + location are mandatory)."""
	text = request.text.strip()

	result = None
	try:
		result = await ai_analysis.analyze_text_with_ai(
			text,
			user_lat=request.user_lat,
			user_lng=request.user_lng,
			is_speech=request.is_speech,
		)
	except Exception as ai_error:
		print(f"AI analysis error: {ai_error}")
		result = None

	if result and isinstance(result, dict) and result.get("is_valid_alert") is False:
		return {
			"is_valid_alert": False,
			"reason": result.get("reason", "Input does not appear to be a valid alert."),
		}

	if not result:
		try:
			result = await ai_analysis.analyze_text(text)
		except Exception as fallback_error:
			print(f"Fallback analysis error: {fallback_error}")
			result = None

	if not result or not isinstance(result, dict):
		return {
			"is_valid_alert": False,
			"reason": "Failed to analyze input. Please try again.",
		}

	alert = dict(result)

	contacts = alert.get("contacts") if isinstance(alert.get("contacts"), dict) else {}
	alert["phone"] = contacts.get("phone") or alert.get("phone")
	alert["email"] = contacts.get("email") or alert.get("email")
	alert["other_contact"] = contacts.get("other") or contacts.get("other_contact") or alert.get("other_contact")

	category = (alert.get("category") or "General")
	if isinstance(category, str):
		category = category.strip().title()
	if category not in VALID_CATEGORIES:
		category = "General"
	alert["category"] = category

	priority = (alert.get("priority") or "Medium")
	if isinstance(priority, str):
		priority = priority.strip().title()
	if priority not in VALID_PRIORITIES:
		priority = "Medium"
	alert["priority"] = priority

	if isinstance(alert.get("description"), str):
		description = alert["description"].strip()
		alert["description"] = description if description else None

	from app.services.location_hierarchy import get_location_hierarchy
	from app.services.location_library import get_location_coordinates
	from app.services.geocoding import geocode_address

	def to_float(value: Optional[float]) -> Optional[float]:
		try:
			if value is None or value == "":
				return None
			return float(value)
		except (TypeError, ValueError):
			return None

	def normalize_area_name(name: Optional[str]) -> Optional[str]:
		if not name or not isinstance(name, str):
			return None
		clean = name.strip()
		lower = clean.lower()
		street_prefixes = ("bulevardul", "strada", "str.", "calea", "șoseaua", "sos", "sos.", "aleea", "bd.", "b-dul", "bvd", "piata")
		if any(lower.startswith(prefix) for prefix in street_prefixes):
			return None
		return clean

	location_data = alert.get("location") if isinstance(alert.get("location"), dict) else {}
	location = {
		"lat": to_float(location_data.get("lat")) if location_data else None,
		"lng": to_float(location_data.get("lng")) if location_data else None,
		"address": location_data.get("address") if location_data else None,
	}

	location_hierarchy = alert.get("location_hierarchy") if isinstance(alert.get("location_hierarchy"), dict) else {"point": None, "area": None, "sector": None, "city": None}
	neighborhood = None
	area_type: Optional[str] = None
	if location_hierarchy.get("area"):
		neighborhood = location_hierarchy.get("area")
		area_type = "area"
	elif location_hierarchy.get("sector"):
		neighborhood = location_hierarchy.get("sector")
		area_type = "sector"

	if (location["lat"] is None or location["lng"] is None) and request.user_lat is not None and request.user_lng is not None:
		location["lat"] = float(request.user_lat)
		location["lng"] = float(request.user_lng)

	location_mentions = alert.get("location_mentions") or []
	if not isinstance(location_mentions, list):
		location_mentions = [location_mentions]

	for loc_name in location_mentions:
		loc_data = get_location_coordinates(loc_name)
		if loc_data:
			location["lat"] = to_float(loc_data.get("lat"))
			location["lng"] = to_float(loc_data.get("lng"))
			if loc_data.get("sector"):
				location_hierarchy["sector"] = loc_data["sector"]
				neighborhood = loc_data["sector"]
				area_type = "sector"
			if loc_name:
				location_hierarchy["area"] = loc_name
				if not neighborhood:
					neighborhood = loc_name
					area_type = "area"
			location_hierarchy["city"] = "Bucharest"
			break

	if location["lat"] is None or location["lng"] is None:
		area_hint = alert.get("area") or location_hierarchy.get("area")
		if area_hint:
			geocode = await geocode_address(area_hint)
			if geocode:
				location["lat"] = to_float(geocode.get("lat"))
				location["lng"] = to_float(geocode.get("lng"))
				location["address"] = geocode.get("address")
		if location["lat"] is None or location["lng"] is None:
			if location_mentions:
				geocode = await geocode_address(location_mentions[0])
				if geocode:
					location["lat"] = to_float(geocode.get("lat"))
					location["lng"] = to_float(geocode.get("lng"))
					location["address"] = geocode.get("address")

	if location["lat"] is None or location["lng"] is None:
		return {
			"is_valid_alert": False,
			"reason": "Location could not be determined. Please provide or select a location.",
		}

	hierarchy = await get_location_hierarchy(lat=location["lat"], lng=location["lng"], text=text)
	if hierarchy:
		location_hierarchy = {**location_hierarchy, **hierarchy}

	location_hierarchy["point"] = f"{location['lat']},{location['lng']}"
	if not location_hierarchy.get("city"):
		location_hierarchy["city"] = "Bucharest"

	clean_area = normalize_area_name(location_hierarchy.get("area"))
	if clean_area != location_hierarchy.get("area"):
		location_hierarchy["area"] = clean_area
	if clean_area:
		neighborhood = clean_area
		area_type = "area"
	elif area_type == "area":
		neighborhood = location_hierarchy.get("sector")
		area_type = "sector" if location_hierarchy.get("sector") else None

	# Ensure area and sector fields are always populated
	fallback_location = neighborhood or location_hierarchy.get("sector") or location.get("address")
	if not location_hierarchy.get("area"):
		if area_type == "area" and neighborhood:
			location_hierarchy["area"] = neighborhood
		elif fallback_location:
			location_hierarchy["area"] = fallback_location
		else:
			location_hierarchy["area"] = "Unknown"
	if not location_hierarchy.get("sector"):
		if area_type == "sector" and neighborhood:
			location_hierarchy["sector"] = neighborhood
		else:
			location_hierarchy["sector"] = "Unknown"

	# Ensure address includes street/area/sector information
	if not location.get("address"):
		address_parts: list[str] = []
		if location_mentions:
			first_mention = str(location_mentions[0]).strip()
			if first_mention:
				address_parts.append(first_mention)
		if location_hierarchy.get("area"):
			area_val = location_hierarchy["area"]
			if area_val and area_val not in address_parts:
				address_parts.append(area_val)
		if location_hierarchy.get("sector"):
			sector_val = location_hierarchy["sector"]
			if sector_val and sector_val not in address_parts:
				address_parts.append(sector_val)
		if address_parts:
			location["address"] = ", ".join(address_parts)

	alert["location"] = location
	alert["location_hierarchy"] = location_hierarchy
	alert["neighborhood"] = neighborhood
	alert["area_type"] = area_type

	# Remove any legacy top-level keys returned by AI
	alert.pop("area", None)
	alert.pop("sector", None)

	title = ""
	try:
		title = await generate_title(text, category, priority, fallback_location)
	except Exception as gen_err:
		print(f"Title generation fallback error: {gen_err}")
	if not title:
		title = (alert.get("title") or text).strip()
	if len(title) > 60:
		title = f"{title[:57].rstrip()}..."
	alert["title"] = title

	alert["phone"] = alert.get("phone")
	alert["email"] = alert.get("email")
	alert["other_contact"] = alert.get("other_contact")
	alert["is_valid_alert"] = True

	return alert


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
	alert_id: str,
	update_data: dict,
	current_user: UserInDB = Depends(get_current_user)
):
	"""Update an alert. Requires permission to edit."""
	try:
		db = get_database()
	except Exception:
		raise HTTPException(status_code=503, detail="Database not connected")
	
	try:
		oid = ObjectId(alert_id)
	except Exception:
		raise HTTPException(status_code=400, detail="Invalid alert ID format")
	
	# Get the alert
	alert = await db.alerts.find_one({"_id": oid})
	if not alert:
		raise HTTPException(status_code=404, detail="Alert not found")
	
	# Check permissions
	alert_user_id = alert.get("user_id", "")
	if not can_edit_alert(current_user, alert_user_id):
		raise HTTPException(
			status_code=403,
			detail="You don't have permission to edit this alert"
		)
	
	# Prepare update data (only allow updating specific fields)
	allowed_fields = ["title", "description", "category", "priority", "phone", "email", "other_contact"]
	update_dict = {}
	
	for field in allowed_fields:
		if field in update_data:
			update_dict[field] = update_data[field]
	
	if not update_dict:
		raise HTTPException(status_code=400, detail="No valid fields to update")
	
	# Update the alert
	await db.alerts.update_one(
		{"_id": oid},
		{"$set": update_dict}
	)
	
	# Get updated alert
	updated = await db.alerts.find_one({"_id": oid})
	
	return AlertResponse(
		id=str(updated.get("_id")),
		title=updated.get("title"),
		description=updated.get("description"),
		category=updated.get("category"),
		priority=updated.get("priority", "Medium"),
		location=updated.get("location", {}),
		location_hierarchy=updated.get("location_hierarchy"),
		neighborhood=updated.get("neighborhood"),
		area_type=updated.get("area_type"),
		timestamp=updated.get("timestamp", 0),
		user_id=updated.get("user_id", ""),
		phone=updated.get("phone"),
		email=updated.get("email"),
		other_contact=updated.get("other_contact"),
	)


@router.delete("/{alert_id}")
async def delete_alert(
	alert_id: str,
	current_user: UserInDB = Depends(get_current_user)
):
	"""Delete an alert. Requires permission to delete."""
	try:
		db = get_database()
	except Exception:
		raise HTTPException(status_code=503, detail="Database not connected")
	
	try:
		oid = ObjectId(alert_id)
	except Exception:
		raise HTTPException(status_code=400, detail="Invalid alert ID format")
	
	# Get the alert
	alert = await db.alerts.find_one({"_id": oid})
	if not alert:
		raise HTTPException(status_code=404, detail="Alert not found")
	
	# Check permissions
	alert_user_id = alert.get("user_id", "")
	if not can_delete_alert(current_user, alert_user_id):
		raise HTTPException(
			status_code=403,
			detail="You don't have permission to delete this alert"
		)
	
	# Delete the alert
	result = await db.alerts.delete_one({"_id": oid})
	
	if result.deleted_count == 0:
		raise HTTPException(status_code=404, detail="Alert not found")
	
	return {"message": "Alert deleted successfully"}

