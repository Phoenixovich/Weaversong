"""
Pedestrian Location Analysis Service
Analyzes pedestrian data, groups by location, and suggests optimal business/vending machine locations using AI
"""
import math
import json
import httpx
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from collections import defaultdict
from app.database import get_database
from app.config import settings
from app.services.geocoding import reverse_geocode


# Grid size for location grouping (~100 meters)
GRID_SIZE = 0.001  # ~100 meters in degrees
SNAPSHOT_EXPIRY_HOURS = 24  # Snapshots expire after 24 hours


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula"""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def get_grid_key(lat: float, lng: float) -> str:
    """Get grid key for location grouping"""
    grid_lat = round(lat / GRID_SIZE) * GRID_SIZE
    grid_lng = round(lng / GRID_SIZE) * GRID_SIZE
    return f"{grid_lat:.4f},{grid_lng:.4f}"


def get_grid_center(grid_key: str) -> Tuple[float, float]:
    """Get center coordinates of a grid cell"""
    parts = grid_key.split(",")
    return (float(parts[0]), float(parts[1]))


async def group_pedestrian_data_by_location(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_count: int = 10
) -> Dict[str, Dict]:
    """
    Group pedestrian data by location using grid-based clustering
    
    Returns:
        Dict mapping grid_key to location stats
    """
    db = get_database()
    collection = db["pedestrian_data"]
    
    # Build query
    query = {}
    if start_date:
        query["timestamp"] = {"$gte": int(start_date.timestamp())}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = int(end_date.timestamp())
        else:
            query["timestamp"] = {"$lte": int(end_date.timestamp())}
    
    # Aggregate by grid location
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": {
                    "grid_lat": {"$round": ["$lat", 4]},
                    "grid_lng": {"$round": ["$lng", 4]},
                },
                "count": {"$sum": 1},
                "avg_lat": {"$avg": "$lat"},
                "avg_lng": {"$avg": "$lng"},
                "hours": {"$push": "$hour"},
                "days_of_week": {"$push": "$day_of_week"},
                "timestamps": {"$push": "$timestamp"}
            }
        },
        {"$match": {"count": {"$gte": min_count}}},
        {"$sort": {"count": -1}}
    ]
    
    location_groups = {}
    async for doc in collection.aggregate(pipeline):
        grid_lat = doc["_id"]["grid_lat"]
        grid_lng = doc["_id"]["grid_lng"]
        grid_key = get_grid_key(grid_lat, grid_lng)
        
        # Calculate hourly distribution
        hour_distribution = defaultdict(int)
        for hour in doc["hours"]:
            hour_distribution[hour] += 1
        
        # Calculate day of week distribution
        day_distribution = defaultdict(int)
        for day in doc["days_of_week"]:
            day_distribution[day] += 1
        
        # Find peak hours
        peak_hours = sorted(hour_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Calculate traffic score (weighted by peak hours)
        traffic_score = doc["count"]
        peak_multiplier = 1.0
        for hour, count in peak_hours:
            if 8 <= hour <= 20:  # Business hours
                peak_multiplier += 0.2
        traffic_score *= peak_multiplier
        
        location_groups[grid_key] = {
            "grid_key": grid_key,
            "lat": doc["avg_lat"],
            "lng": doc["avg_lng"],
            "count": doc["count"],
            "traffic_score": round(traffic_score, 2),
            "hourly_distribution": dict(hour_distribution),
            "daily_distribution": dict(day_distribution),
            "peak_hours": [h[0] for h in peak_hours],
            "peak_hour_counts": [h[1] for h in peak_hours],
            "first_seen": min(doc["timestamps"]),
            "last_seen": max(doc["timestamps"])
        }
    
    return location_groups


async def get_or_create_snapshot(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Get cached snapshot or create new one
    
    Returns:
        Snapshot data with location groups and analysis
    """
    db = get_database()
    snapshot_collection = db["pedestrian_analysis_snapshots"]
    
    # Create new snapshot
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)  # Default to last 30 days
    
    # Create snapshot key
    start_ts = int(start_date.timestamp()) if start_date else None
    end_ts = int(end_date.timestamp()) if end_date else None
    snapshot_key = f"{start_ts}_{end_ts}"
    
    if not force_refresh:
        # Check for existing snapshot
        existing = await snapshot_collection.find_one({
            "snapshot_key": snapshot_key,
            "created_at": {
                "$gte": datetime.utcnow() - timedelta(hours=SNAPSHOT_EXPIRY_HOURS)
            }
        })
        
        if existing:
            # Convert MongoDB datetime fields back to datetime objects if needed
            if isinstance(existing.get("start_date"), str):
                try:
                    existing["start_date"] = datetime.fromisoformat(existing["start_date"])
                except:
                    pass
            if isinstance(existing.get("end_date"), str):
                try:
                    existing["end_date"] = datetime.fromisoformat(existing["end_date"])
                except:
                    pass
            return existing
    
    print(f"Creating new snapshot for {start_date.date()} to {end_date.date()}")
    
    # Group data by location
    location_groups = await group_pedestrian_data_by_location(start_date, end_date)
    
    # Get location names
    for grid_key, group_data in location_groups.items():
        try:
            address = await reverse_geocode(group_data["lat"], group_data["lng"])
            if address:
                group_data["address"] = address
                # Extract area name
                parts = address.split(",")
                group_data["area_name"] = parts[0] if parts else None
        except:
            pass
    
    # Create snapshot document
    snapshot = {
        "snapshot_key": snapshot_key,
        "start_date": start_date,
        "end_date": end_date,
        "location_groups": location_groups,
        "total_locations": len(location_groups),
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=SNAPSHOT_EXPIRY_HOURS)
    }
    
    # Save snapshot
    await snapshot_collection.update_one(
        {"snapshot_key": snapshot_key},
        {"$set": snapshot},
        upsert=True
    )
    
    return snapshot


async def suggest_business_locations_with_ai(
    location_groups: Dict[str, Dict],
    business_type: str = "general",
    max_suggestions: int = 10
) -> List[Dict[str, Any]]:
    """
    Use AI to suggest optimal business/vending machine locations
    
    Args:
        location_groups: Dictionary of location groups from analysis
        business_type: Type of business (e.g., "vending_machine", "cafe", "restaurant", "shop")
        max_suggestions: Maximum number of suggestions to return
    
    Returns:
        List of suggested locations with AI reasoning
    """
    gemini_api_key = getattr(settings, "gemini_api_key", None)
    if not gemini_api_key:
        # Fallback to simple scoring if AI is not available
        return suggest_business_locations_simple(location_groups, business_type, max_suggestions)
    
    # Prepare data for AI analysis
    top_locations = sorted(
        location_groups.values(),
        key=lambda x: x["traffic_score"],
        reverse=True
    )[:max_suggestions * 2]  # Send more for AI to choose from
    
    # Format location data for AI
    location_data = []
    for loc in top_locations:
        location_data.append({
            "coordinates": {"lat": loc["lat"], "lng": loc["lng"]},
            "address": loc.get("address", "Unknown"),
            "traffic_count": loc["count"],
            "traffic_score": loc["traffic_score"],
            "peak_hours": loc["peak_hours"],
            "hourly_distribution": loc["hourly_distribution"]
        })
    
    # Create prompt for AI
    prompt = f"""Analyze pedestrian traffic data and suggest the best locations for {business_type} businesses or vending machines in Bucharest, Romania.

Location Data:
{json.dumps(location_data, indent=2)}

Consider:
1. Traffic volume and consistency
2. Peak hours (business hours 8-20 are more valuable)
3. Location accessibility and visibility
4. Competition (avoid clustering too many suggestions close together)
5. Local context (address/area characteristics)

Return a JSON array of suggested locations with this structure:
[
  {{
    "rank": 1,
    "lat": 44.xxxx,
    "lng": 26.xxxx,
    "address": "address string",
    "traffic_score": score,
    "reasoning": "Why this location is good for {business_type}",
    "business_type": "{business_type}",
    "estimated_daily_visitors": number,
    "best_hours": [8, 12, 18],
    "recommendations": ["specific recommendations for this location"]
  }}
]

Return only the JSON array, no other text."""

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            if "candidates" in data and len(data["candidates"]) > 0:
                result_text = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Extract JSON from response
                result_text = result_text.strip()
                if result_text.startswith("```json"):
                    result_text = result_text[7:]
                if result_text.startswith("```"):
                    result_text = result_text[3:]
                if result_text.endswith("```"):
                    result_text = result_text[:-3]
                result_text = result_text.strip()
                
                suggestions = json.loads(result_text)
                
                # Validate and format suggestions
                formatted_suggestions = []
                for suggestion in suggestions[:max_suggestions]:
                    if "lat" in suggestion and "lng" in suggestion:
                        formatted_suggestions.append({
                            "rank": suggestion.get("rank", len(formatted_suggestions) + 1),
                            "lat": float(suggestion["lat"]),
                            "lng": float(suggestion["lng"]),
                            "address": suggestion.get("address", "Unknown"),
                            "traffic_score": suggestion.get("traffic_score", 0),
                            "reasoning": suggestion.get("reasoning", ""),
                            "business_type": business_type,
                            "estimated_daily_visitors": suggestion.get("estimated_daily_visitors", 0),
                            "best_hours": suggestion.get("best_hours", []),
                            "recommendations": suggestion.get("recommendations", [])
                        })
                
                return formatted_suggestions
    except Exception as e:
        print(f"AI suggestion error: {e}")
        # Fallback to simple scoring
        return suggest_business_locations_simple(location_groups, business_type, max_suggestions)
    
    return suggest_business_locations_simple(location_groups, business_type, max_suggestions)


def suggest_business_locations_simple(
    location_groups: Dict[str, Dict],
    business_type: str = "general",
    max_suggestions: int = 10
) -> List[Dict[str, Any]]:
    """
    Simple scoring-based suggestion (fallback when AI is not available)
    """
    # Score locations
    scored_locations = []
    for grid_key, loc_data in location_groups.items():
        score = loc_data["traffic_score"]
        
        # Adjust score based on business type
        if business_type == "vending_machine":
            # Vending machines benefit from consistent traffic throughout the day
            hour_variance = len(loc_data["hourly_distribution"])
            score *= (1 + hour_variance * 0.1)
        elif business_type in ["cafe", "restaurant"]:
            # Cafes/restaurants benefit from lunch and dinner hours
            lunch_traffic = sum(loc_data["hourly_distribution"].get(h, 0) for h in [11, 12, 13, 14])
            dinner_traffic = sum(loc_data["hourly_distribution"].get(h, 0) for h in [18, 19, 20, 21])
            score *= (1 + (lunch_traffic + dinner_traffic) * 0.01)
        
        scored_locations.append({
            "rank": 0,  # Will be set after sorting
            "lat": loc_data["lat"],
            "lng": loc_data["lng"],
            "address": loc_data.get("address", "Unknown"),
            "traffic_score": score,
            "reasoning": f"High traffic location with {loc_data['count']} pedestrian records. Peak hours: {', '.join(map(str, loc_data['peak_hours']))}",
            "business_type": business_type,
            "estimated_daily_visitors": loc_data["count"],
            "best_hours": loc_data["peak_hours"],
            "recommendations": [f"Consider {business_type} placement here due to high foot traffic"]
        })
    
    # Sort by score and assign ranks
    scored_locations.sort(key=lambda x: x["traffic_score"], reverse=True)
    for i, loc in enumerate(scored_locations[:max_suggestions], 1):
        loc["rank"] = i
    
    return scored_locations[:max_suggestions]


async def analyze_pedestrian_locations(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    business_type: str = "general",
    max_suggestions: int = 10,
    use_cache: bool = True,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Main analysis function that groups data and suggests business locations
    
    Returns:
        Complete analysis with location groups and AI suggestions
    """
    # Get or create snapshot
    snapshot = await get_or_create_snapshot(start_date, end_date, force_refresh)
    location_groups = snapshot["location_groups"]
    
    # Get AI suggestions
    suggestions = await suggest_business_locations_with_ai(
        location_groups,
        business_type,
        max_suggestions
    )
    
    return {
        "analysis_date": datetime.utcnow().isoformat(),
        "start_date": snapshot["start_date"].isoformat() if isinstance(snapshot["start_date"], datetime) else str(snapshot["start_date"]),
        "end_date": snapshot["end_date"].isoformat() if isinstance(snapshot["end_date"], datetime) else str(snapshot["end_date"]),
        "total_locations_analyzed": snapshot["total_locations"],
        "location_groups": location_groups,
        "suggestions": suggestions,
        "snapshot_key": snapshot["snapshot_key"],
        "from_cache": not force_refresh and "created_at" in snapshot
    }

