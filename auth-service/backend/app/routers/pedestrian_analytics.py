from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_database
from app.models.pedestrian import (
    PedestrianDataCreate,
    PedestrianDataResponse,
    PedestrianAnalyticsRequest,
    PedestrianAnalyticsResponse
)
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.user import UserInDB, UserRole

router = APIRouter(prefix="/pedestrian", tags=["pedestrian"])


def can_access_pedestrian_analytics(user: Optional[UserInDB]) -> bool:
    """Check if user can access pedestrian analytics (premium or admin)"""
    if not user:
        return False
    if user.role == UserRole.ADMIN:
        return True
    if user.is_premium:
        return True
    return False


@router.post("/data", status_code=201)
async def record_pedestrian_data(
    data: PedestrianDataCreate,
    current_user: Optional[UserInDB] = Depends(get_current_user_optional)
):
    """
    Record pedestrian data (anonymous, no user ID).
    This endpoint is public and doesn't require authentication.
    Data is collected without linking to user accounts/devices.
    """
    try:
        db = get_database()
    except Exception:
        raise HTTPException(status_code=503, detail="Database not connected")

    # Validate Bucharest bounds
    BUCHAREST_BOUNDS = {
        "min_lat": 44.35,
        "max_lat": 44.55,
        "min_lng": 25.95,
        "max_lng": 26.25
    }

    if not (BUCHAREST_BOUNDS["min_lat"] <= data.lat <= BUCHAREST_BOUNDS["max_lat"] and
            BUCHAREST_BOUNDS["min_lng"] <= data.lng <= BUCHAREST_BOUNDS["max_lng"]):
        raise HTTPException(
            status_code=400,
            detail="Location must be within Bucharest bounds"
        )

    # Use provided timestamp or current time
    timestamp = data.timestamp or int(datetime.now().timestamp())
    dt = datetime.fromtimestamp(timestamp)

    doc = {
        "lat": data.lat,
        "lng": data.lng,
        "timestamp": timestamp,
        "hour": dt.hour,
        "day_of_week": dt.weekday(),  # 0=Monday, 6=Sunday
        "date": dt.strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow()
    }

    result = await db.pedestrian_data.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "message": "Pedestrian data recorded successfully"
    }


@router.get("/analytics", response_model=List[PedestrianAnalyticsResponse])
async def get_pedestrian_analytics(
    location_name: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: float = Query(0.01, description="Radius in degrees (~1km)"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get pedestrian analytics aggregated by location and hour.
    Requires premium subscription or admin role.
    """
    if not can_access_pedestrian_analytics(current_user):
        raise HTTPException(
            status_code=403,
            detail="This feature requires premium subscription or admin role"
        )

    try:
        db = get_database()
    except Exception:
        raise HTTPException(status_code=503, detail="Database not connected")

    # Build query
    query = {}

    # Location filter
    if lat and lng:
        query["lat"] = {"$gte": lat - radius, "$lte": lat + radius}
        query["lng"] = {"$gte": lng - radius, "$lte": lng + radius}
    elif location_name:
        # Get location coordinates from location library
        from app.services.location_library import get_location_coordinates
        loc_data = get_location_coordinates(location_name)
        if loc_data:
            lat = loc_data.get("lat")
            lng = loc_data.get("lng")
            if lat and lng:
                query["lat"] = {"$gte": lat - radius, "$lte": lat + radius}
                query["lng"] = {"$gte": lng - radius, "$lte": lng + radius}

    # Date filter
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            start_timestamp = int(start_dt.timestamp())
            query["timestamp"] = {"$gte": start_timestamp}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            end_timestamp = int(end_dt.timestamp())
            if "timestamp" in query:
                query["timestamp"]["$lte"] = end_timestamp
            else:
                query["timestamp"] = {"$lte": end_timestamp}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

    # Aggregate data by location and hour
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": {
                    "lat": {"$round": ["$lat", 4]},  # Round to ~100m precision
                    "lng": {"$round": ["$lng", 4]},
                    "hour": "$hour"
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$group": {
                "_id": {
                    "lat": "$_id.lat",
                    "lng": "$_id.lng"
                },
                "total_count": {"$sum": "$count"},
                "hourly_stats": {
                    "$push": {
                        "hour": "$_id.hour",
                        "count": "$count"
                    }
                }
            }
        }
    ]

    results = []
    async for doc in db.pedestrian_data.aggregate(pipeline):
        location_lat = doc["_id"]["lat"]
        location_lng = doc["_id"]["lng"]

        # Build hourly stats dict
        hourly_stats = {str(item["hour"]): item["count"] for item in doc["hourly_stats"]}
        
        # Calculate daily stats
        daily_pipeline = [
            {"$match": {
                "lat": {"$gte": location_lat - 0.0001, "$lte": location_lat + 0.0001},
                "lng": {"$gte": location_lng - 0.0001, "$lte": location_lng + 0.0001}
            }},
            {"$group": {
                "_id": "$day_of_week",
                "count": {"$sum": 1}
            }}
        ]
        
        daily_stats = {}
        async for day_doc in db.pedestrian_data.aggregate(daily_pipeline):
            daily_stats[str(day_doc["_id"])] = day_doc["count"]

        # Find peak hours (top 3)
        sorted_hours = sorted(
            doc["hourly_stats"],
            key=lambda x: x["count"],
            reverse=True
        )
        peak_hours = [item["hour"] for item in sorted_hours[:3]]

        # Calculate average per hour
        total_hours = len(doc["hourly_stats"])
        average_per_hour = doc["total_count"] / total_hours if total_hours > 0 else 0

        # Get location name if possible
        location_name_result = None
        if location_name:
            location_name_result = location_name
        else:
            # Try to reverse geocode to get location name
            from app.services.geocoding import reverse_geocode
            try:
                address = await reverse_geocode(location_lat, location_lng)
                if address:
                    # Extract area name from address
                    location_name_result = address.split(",")[0] if address else None
            except:
                pass

        results.append(PedestrianAnalyticsResponse(
            location_name=location_name_result,
            lat=location_lat,
            lng=location_lng,
            total_count=doc["total_count"],
            hourly_stats=hourly_stats,
            daily_stats=daily_stats,
            peak_hours=peak_hours,
            average_per_hour=round(average_per_hour, 2)
        ))

    return results


@router.get("/popular-locations", response_model=List[dict])
async def get_popular_locations(
    limit: int = Query(10, ge=1, le=50),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get most popular locations by pedestrian count.
    Requires premium subscription or admin role.
    """
    if not can_access_pedestrian_analytics(current_user):
        raise HTTPException(
            status_code=403,
            detail="This feature requires premium subscription or admin role"
        )

    try:
        db = get_database()
    except Exception:
        raise HTTPException(status_code=503, detail="Database not connected")

    pipeline = [
        {
            "$group": {
                "_id": {
                    "lat": {"$round": ["$lat", 4]},
                    "lng": {"$round": ["$lng", 4]}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]

    results = []
    async for doc in db.pedestrian_data.aggregate(pipeline):
        location_lat = doc["_id"]["lat"]
        location_lng = doc["_id"]["lng"]

        # Try to get location name
        location_name = None
        from app.services.geocoding import reverse_geocode
        try:
            address = await reverse_geocode(location_lat, location_lng)
            if address:
                location_name = address.split(",")[0]
        except:
            pass

        results.append({
            "lat": location_lat,
            "lng": location_lng,
            "location_name": location_name,
            "count": doc["count"]
        })

    return results

