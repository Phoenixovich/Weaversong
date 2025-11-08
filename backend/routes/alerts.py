from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from models.alert import AlertCreate, AlertResponse, AlertAnalysisRequest
import db
from services.users import get_or_create_anonymous_user, get_or_create_user_by_username
from services.ai_analysis import analyze_text, analyze_text_sync, analyze_text_with_ai
from services.geocoding import geocode_address, reverse_geocode
from services.neighborhoods import detect_neighborhood, detect_neighborhood_from_coords, get_all_neighborhoods
from services.location_hierarchy import get_location_hierarchy, get_display_location

router = APIRouter()

@router.get("", response_model=list[AlertResponse])
async def get_alerts(
    neighborhood: str | None = Query(None, description="Filter by neighborhood/area"),
    category: str | None = Query(None, description="Filter by category"),
):
    """Get all alerts, sorted by newest first. Can filter by neighborhood and category."""
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Build query
    # Filter by neighborhood (area/sector) and category
    query = {}
    if neighborhood:
        # Check if it's a sector or area
        # If it's a sector, filter by sector in location_hierarchy
        # If it's an area, filter by neighborhood (area name)
        if neighborhood.startswith("Sector "):
            # Filter by sector in location_hierarchy
            query["location_hierarchy.sector"] = neighborhood
        else:
            # Filter by area name in neighborhood field
            query["neighborhood"] = neighborhood
    if category:
        query["category"] = category
    
    cursor = db.database.alerts.find(query).sort("timestamp", -1)
    alerts = []
    async for doc in cursor:
        # Get location hierarchy from doc (don't create on-the-fly - too slow)
        location_hierarchy = doc.get("location_hierarchy")
        
        # If no hierarchy but we have location data, create one using stored coordinate mappings
        if not location_hierarchy and doc.get("location", {}).get("lat") and doc.get("location", {}).get("lng"):
            lat = doc["location"].get("lat")
            lng = doc["location"].get("lng")
            address = doc["location"].get("address", "")
            
            # Use stored coordinate mappings (fast, no API calls)
            from data.bucharest_locations import get_area_sector_from_point
            area_sector = get_area_sector_from_point(lat, lng)
            
            location_hierarchy = {
                "point": f"{lat},{lng}",
                "area": area_sector.get("area"),
                "sector": area_sector.get("sector"),
                "city": "Bucharest" if area_sector.get("sector") else None
            }
            
            # Fallback: Try to detect from existing address if no match from coordinates
            if not location_hierarchy["area"] and not location_hierarchy["sector"] and address:
                from services.neighborhoods import detect_neighborhood
                neighborhood, area_type = detect_neighborhood("", address)
                if neighborhood:
                    if area_type == "sector":
                        location_hierarchy["sector"] = neighborhood
                        location_hierarchy["city"] = "Bucharest"
                    elif area_type == "area":
                        location_hierarchy["area"] = neighborhood
                        from services.location_hierarchy import AREA_TO_SECTOR
                        if neighborhood in AREA_TO_SECTOR:
                            location_hierarchy["sector"] = AREA_TO_SECTOR[neighborhood]
                        location_hierarchy["city"] = "Bucharest"
        
        alerts.append(AlertResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc.get("description"),
            category=doc["category"],
            priority=doc.get("priority", "Medium"),
            location=doc["location"],
            location_hierarchy=location_hierarchy,
            neighborhood=doc.get("neighborhood"),
            area_type=doc.get("area_type"),
            timestamp=doc["timestamp"],
            user_id=doc.get("user_id", ""),
            phone=doc.get("phone"),
            email=doc.get("email"),
            other_contact=doc.get("other_contact")
        ))
    return alerts

@router.get("/neighborhoods", response_model=dict)
async def get_neighborhoods():
    """Get all available neighborhoods for filtering"""
    return get_all_neighborhoods()

@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(alert: AlertCreate):
    """Create a new alert. Links to user (anonymous by default, or specified username)."""
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Get or create user (anonymous if no username provided)
    if alert.username:
        user_id = await get_or_create_user_by_username(alert.username)
    else:
        user_id = await get_or_create_anonymous_user()
    
    alert_doc = {
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
        "other_contact": alert.other_contact
    }
    
    result = await db.database.alerts.insert_one(alert_doc)
    created = await db.database.alerts.find_one({"_id": result.inserted_id})
    
    return AlertResponse(
        id=str(created["_id"]),
        title=created["title"],
        description=created.get("description"),
        category=created["category"],
        priority=created.get("priority", "Medium"),
        location=created["location"],
        location_hierarchy=created.get("location_hierarchy"),
        neighborhood=created.get("neighborhood"),
        area_type=created.get("area_type"),
        timestamp=created["timestamp"],
        user_id=created["user_id"],
        phone=created.get("phone"),
        email=created.get("email"),
        other_contact=created.get("other_contact")
    )

@router.post("/analyze", response_model=dict)
async def analyze_alert_text(request: AlertAnalysisRequest):
    """
    Analyze user text to extract structured alert data
    Returns: category, priority, title, description, location suggestions
    """
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # FIRST: Try library-based analysis (no AI)
    from services.location_library import find_location_in_text
    from services.title_extractor import extract_title_from_text
    
    library_location = find_location_in_text(request.text)
    library_title = extract_title_from_text(request.text)
    
    # If we found both location and title in library, use library-based analysis
    if library_location and library_title:
        # Use library-based analysis (faster, no AI)
        location_name, _ = library_location
        analysis = await analyze_text(request.text, location=location_name)
    else:
        # Use AI to analyze text and extract structured data
        analysis = await analyze_text_with_ai(request.text, request.user_lat, request.user_lng)
        
        # If AI analysis didn't work, fall back to keyword-based analysis
        if not analysis or not analysis.get("title"):
            # Extract location first for better title generation
            location_text = None
            temp_analysis = analyze_text_sync(request.text)  # Quick sync analysis for location
            if temp_analysis.get("location_mentions") and len(temp_analysis["location_mentions"]) > 0:
                location_text = temp_analysis["location_mentions"][0]
            
            # Full analysis with AI title generation
            analysis = await analyze_text(request.text, location=location_text)
    text_lower = request.text.lower()
    
    # Special handling: Weather alerts should be city-wide (Bucharest)
    is_weather_related = any(keyword in text_lower for keyword in ["weather", "rain", "storm", "snow", "ice", "flood", "wind", "temperature", "hail", "thunder"])
    
    # Try to geocode location if mentioned
    location_data = {
        "lat": None,
        "lng": None,
        "address": None
    }
    
    # Get location mentions from analysis
    location_mentions = analysis.get("location_mentions", [])
    
    # If we found a library location earlier but location_mentions is empty, use it
    # This ensures library locations are always used
    if not location_mentions or len(location_mentions) == 0:
        if library_location:
            location_name, _ = library_location
            location_mentions = [location_name]
            # Also update analysis to include location_mentions
            analysis["location_mentions"] = location_mentions
    
    # Priority: If location mentions found in text, use those (don't use user location)
    # This ensures mentioned locations are always used instead of current GPS location
    if location_mentions and len(location_mentions) > 0:
        # FIRST: Try to get location from library (no geocoding needed)
        location_text = location_mentions[0]
        from services.location_library import get_location_coordinates
        library_coords = get_location_coordinates(location_text)
        
        if library_coords:
            # Use library coordinates directly
            base_lat = library_coords["lat"]
            base_lng = library_coords["lng"]
            
            # Apply clustering if there are multiple events at this location
            from services.location_clustering import get_clustered_coordinates
            clustered_lat, clustered_lng = await get_clustered_coordinates(
                location_text, base_lat, base_lng, db.database
            )
            
            location_data["lat"] = clustered_lat
            location_data["lng"] = clustered_lng
            location_data["address"] = location_text
        else:
            # Fallback: Try to geocode the location mention
            # Correct address if needed (using AI/fuzzy matching)
            from services.address_correction import correct_address
            address_correction = correct_address(location_text)
            
            # Use corrected address if available and confident, otherwise use original
            address_to_geocode = address_correction.get("corrected") if address_correction.get("corrected") and address_correction.get("confidence", 0) >= 0.6 else location_text
            
            geocoded = await geocode_address(address_to_geocode, use_correction=True)
            if geocoded:
                base_lat = geocoded["lat"]
                base_lng = geocoded["lng"]
                
                # Apply clustering
                from services.location_clustering import get_clustered_coordinates
                clustered_lat, clustered_lng = await get_clustered_coordinates(
                    location_text, base_lat, base_lng, db.database
                )
                
                location_data["lat"] = clustered_lat
                location_data["lng"] = clustered_lng
                location_data["address"] = geocoded.get("address", location_text)
                
                # Add correction info if address was corrected
                if geocoded.get("corrected"):
                    analysis["address_correction"] = {
                        "original": location_text,
                        "corrected": geocoded.get("corrected_address"),
                        "confidence": address_correction.get("confidence", 0),
                        "suggestions": address_correction.get("suggestions", [])
                    }
    # Fallback: If no location mentioned in text, use user's GPS location
    elif request.user_lat and request.user_lng:
        location_data["lat"] = request.user_lat
        location_data["lng"] = request.user_lng
        # Try to get address from coordinates
        address = await reverse_geocode(request.user_lat, request.user_lng)
        if address:
            location_data["address"] = address
    
    # If we have a library location, set hierarchy FIRST (before get_location_hierarchy)
    # This ensures library locations always have proper hierarchy
    location_hierarchy = {
        "point": None,
        "area": None,
        "sector": None,
        "city": None
    }
    
    if library_location:
        location_name, location_data_lib = library_location
        # Check if area is mentioned in text - only set area if explicitly mentioned
        text_lower = request.text.lower()
        location_name_lower = location_name.lower()
        
        # If location name appears in text, it's an area
        if location_name_lower in text_lower or any(keyword in text_lower for keyword in location_data_lib.get("keywords", [])):
            location_hierarchy["area"] = location_name
        # Always set sector from library if available
        if location_data_lib.get("sector"):
            location_hierarchy["sector"] = location_data_lib.get("sector")
        # Set city if we have sector
        if location_hierarchy.get("sector"):
            location_hierarchy["city"] = "Bucharest"
        # If we have coordinates, set point
        if location_data.get("lat") and location_data.get("lng"):
            location_hierarchy["point"] = f"{location_data['lat']},{location_data['lng']}"
        # Ensure location_mentions includes the library location
        if location_name not in location_mentions:
            location_mentions.append(location_name)
            analysis["location_mentions"] = location_mentions
    
    # Get location hierarchy from coordinates/address if we don't have library location
    # or if we need to enhance it with coordinates
    if not library_location or (location_data.get("lat") and location_data.get("lng") and not location_hierarchy.get("point")):
        hierarchy_from_coords = await get_location_hierarchy(
            lat=location_data.get("lat"),
            lng=location_data.get("lng"),
            address=location_data.get("address"),
            text=request.text
        )
        # Merge hierarchy from coordinates (don't overwrite library data)
        if hierarchy_from_coords.get("point") and not location_hierarchy.get("point"):
            location_hierarchy["point"] = hierarchy_from_coords.get("point")
        if hierarchy_from_coords.get("area") and not location_hierarchy.get("area"):
            location_hierarchy["area"] = hierarchy_from_coords.get("area")
        if hierarchy_from_coords.get("sector") and not location_hierarchy.get("sector"):
            location_hierarchy["sector"] = hierarchy_from_coords.get("sector")
        if hierarchy_from_coords.get("city") and not location_hierarchy.get("city"):
            location_hierarchy["city"] = hierarchy_from_coords.get("city")
    
    # If AI extracted area/sector, use them (they might be more accurate)
    if analysis.get("area"):
        location_hierarchy["area"] = analysis["area"]
    if analysis.get("sector"):
        location_hierarchy["sector"] = analysis["sector"]
        location_hierarchy["city"] = "Bucharest"
    
    # Special handling: Weather alerts are city-wide (shown in all areas)
    if is_weather_related:
        location_hierarchy = {
            "point": None,
            "area": None,
            "sector": None,
            "city": "Bucharest"
        }
        location_data["lat"] = None
        location_data["lng"] = None
        location_data["address"] = "Bucharest, Romania"
    
    # Special handling: Smoke alerts that aren't point-specific should be sector/area specific
    is_smoke = "smoke" in text_lower
    if is_smoke and not location_hierarchy.get("point"):
        # If smoke and no specific point, keep area/sector but remove point
        if location_hierarchy.get("area") or location_hierarchy.get("sector"):
            location_hierarchy["point"] = None
            location_data["lat"] = None
            location_data["lng"] = None
    
    # Get display location for backward compatibility
    display_location = get_display_location(location_hierarchy)
    neighborhood = display_location if display_location != "Unknown" else None
    area_type = None
    if location_hierarchy.get("sector"):
        area_type = "sector"
    elif location_hierarchy.get("area"):
        area_type = "area"
    elif location_hierarchy.get("city"):
        area_type = "city"
    
    return {
        **analysis,
        "location": location_data,
        "location_hierarchy": location_hierarchy,
        "neighborhood": neighborhood,
        "area_type": area_type
    }

