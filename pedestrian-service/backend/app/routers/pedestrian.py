from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.pedestrian_location import (
    PedestrianLocation,
    LocationAnalysisRequest,
    LocationAnalysisResult
)
from app.database import get_database
from app.services.pedestrian_analysis_service import analyze_pedestrian_data
from app.utils.anonymization import (
    anonymize_location_data,
    generate_anonymous_session_id,
    is_data_anonymized
)
from bson import ObjectId
import uuid

router = APIRouter(prefix="/pedestrian", tags=["pedestrian"])


@router.post("/location", response_model=dict)
async def collect_location(location: PedestrianLocation):
    """
    Collect pedestrian geolocation data from users.
    This endpoint accepts location data from users (with or without authentication).
    All data is anonymized before storage to protect user privacy.
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        # Convert to dict for MongoDB
        location_dict = location.model_dump(by_alias=True, exclude={"id"})
        
        # Generate anonymous session_id if not provided
        if not location_dict.get("session_id"):
            location_dict["session_id"] = generate_anonymous_session_id()
        
        # Anonymize location data before storing
        anonymized_data = anonymize_location_data(location_dict)
        
        # Insert anonymized location data
        result = await collection.insert_one(anonymized_data)
        
        return {
            "success": True,
            "location_id": str(result.inserted_id),
            "message": "Location data collected and anonymized successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error collecting location: {str(e)}")


@router.post("/locations/batch", response_model=dict)
async def collect_locations_batch(locations: List[PedestrianLocation]):
    """
    Collect multiple pedestrian locations in a batch.
    Useful for collecting location history or multiple points at once.
    All data is anonymized before storage to protect user privacy.
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        # Convert to dicts for MongoDB
        locations_dict = [loc.model_dump(by_alias=True, exclude={"id"}) for loc in locations]
        
        # Anonymize all location data before storing
        anonymized_locations = []
        for loc_dict in locations_dict:
            # Generate anonymous session_id if not provided
            if not loc_dict.get("session_id"):
                loc_dict["session_id"] = generate_anonymous_session_id()
            
            # Anonymize location data
            anonymized_data = anonymize_location_data(loc_dict)
            anonymized_locations.append(anonymized_data)
        
        # Insert anonymized batch
        result = await collection.insert_many(anonymized_locations)
        
        return {
            "success": True,
            "count": len(result.inserted_ids),
            "location_ids": [str(id) for id in result.inserted_ids],
            "message": f"Successfully collected and anonymized {len(result.inserted_ids)} locations"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error collecting locations: {str(e)}")


@router.get("/locations", response_model=List[dict])
async def get_locations(
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 1000
):
    """
    Retrieve pedestrian location data with optional filters.
    Note: All data returned is already anonymized (no personally identifiable information).
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        # Build query
        query = {}
        # If user_id or session_id provided, they should already be anonymized
        # But we'll hash them to match the anonymized format in DB
        from app.utils.anonymization import anonymize_user_id, anonymize_session_id
        
        if user_id:
            # Hash the provided user_id to match anonymized format
            query["user_id"] = anonymize_user_id(user_id)
        if session_id:
            # Hash the provided session_id to match anonymized format
            query["session_id"] = anonymize_session_id(session_id)
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        # Fetch locations
        cursor = collection.find(query).sort("timestamp", -1).limit(limit)
        locations = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and ensure data is anonymized
        for loc in locations:
            loc["_id"] = str(loc["_id"])
            if "timestamp" in loc:
                loc["timestamp"] = loc["timestamp"].isoformat()
            # Ensure no PII is returned (should already be anonymized, but double-check)
            # Remove any fields that might have been added
            if "user_id" in loc and loc["user_id"] and not loc["user_id"].startswith("anon_"):
                loc["user_id"] = anonymize_user_id(loc["user_id"])
            if "session_id" in loc and loc["session_id"] and not loc["session_id"].startswith("anon_session_"):
                loc["session_id"] = anonymize_session_id(loc["session_id"])
        
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving locations: {str(e)}")


@router.post("/analyze", response_model=LocationAnalysisResult)
async def analyze_locations(request: LocationAnalysisRequest):
    """
    Analyze pedestrian geolocation data using AI to identify:
    - Best spots for businesses
    - Areas of interest
    - Dead areas (low foot traffic)
    - Dangerous areas
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        # Build query
        query = {}
        if request.start_date or request.end_date:
            query["timestamp"] = {}
            if request.start_date:
                query["timestamp"]["$gte"] = request.start_date
            if request.end_date:
                query["timestamp"]["$lte"] = request.end_date
            else:
                # Default to last 30 days if no end date
                query["timestamp"]["$lte"] = datetime.utcnow()
        
        if request.bounding_box:
            bb = request.bounding_box
            query["latitude"] = {"$gte": bb.get("min_lat"), "$lte": bb.get("max_lat")}
            query["longitude"] = {"$gte": bb.get("min_lng"), "$lte": bb.get("max_lng")}
        
        # Fetch locations
        cursor = collection.find(query)
        locations = await cursor.to_list(length=10000)  # Limit to 10k for analysis
        
        if not locations:
            raise HTTPException(status_code=404, detail="No location data found for the specified criteria")
        
        # Convert MongoDB documents to dicts
        location_dicts = []
        for loc in locations:
            loc_dict = {
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude"),
                "timestamp": loc.get("timestamp"),
                "speed": loc.get("speed"),
                "session_id": loc.get("session_id"),
                "user_id": loc.get("user_id")
            }
            location_dicts.append(loc_dict)
        
        # Perform AI analysis
        analysis_result = await analyze_pedestrian_data(
            location_dicts,
            request.analysis_type
        )
        
        # Get unique users count
        unique_users = len(set(loc.get("user_id") for loc in location_dicts if loc.get("user_id")))
        
        # Extract insights from AI analysis
        insights = analysis_result.get("insights", {})
        aggregated_data = analysis_result.get("aggregated_data", {})
        statistics = analysis_result.get("statistics", {})
        
        # Parse AI analysis to extract structured data
        analysis_text = insights.get("analysis", "")
        
        # Create result
        result = LocationAnalysisResult(
            analysis_type=request.analysis_type,
            total_locations=len(location_dicts),
            unique_users=unique_users,
            time_period={
                "start": request.start_date.isoformat() if request.start_date else None,
                "end": request.end_date.isoformat() if request.end_date else datetime.utcnow().isoformat()
            },
            insights={
                "ai_analysis": analysis_text,
                "statistics": statistics
            },
            heatmap_data=[
                {
                    "latitude": data["latitude"],
                    "longitude": data["longitude"],
                    "intensity": data["visit_count"],
                    "avg_speed": data.get("avg_speed"),
                    "time_distribution": data.get("time_distribution", {})
                }
                for data in aggregated_data.values()
            ]
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing locations: {str(e)}")


@router.get("/stats", response_model=dict)
async def get_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    Get basic statistics about collected pedestrian location data.
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        # Build query
        query = {}
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        # Count total locations
        total_locations = await collection.count_documents(query)
        
        # Count unique users
        unique_users = len(await collection.distinct("user_id", query))
        
        # Count unique sessions
        unique_sessions = len(await collection.distinct("session_id", query))
        
        # Get date range
        if query:
            first_location = await collection.find_one(query, sort=[("timestamp", 1)])
            last_location = await collection.find_one(query, sort=[("timestamp", -1)])
        else:
            first_location = await collection.find_one(sort=[("timestamp", 1)])
            last_location = await collection.find_one(sort=[("timestamp", -1)])
        
        return {
            "total_locations": total_locations,
            "unique_users": unique_users,
            "unique_sessions": unique_sessions,
            "date_range": {
                "start": first_location["timestamp"].isoformat() if first_location else None,
                "end": last_location["timestamp"].isoformat() if last_location else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")


@router.delete("/locations/{location_id}", response_model=dict)
async def delete_location(location_id: str):
    """
    Delete a specific location record (for privacy/GDPR compliance).
    """
    try:
        db = get_database()
        collection = db["pedestrian_locations"]
        
        result = await collection.delete_one({"_id": ObjectId(location_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Location not found")
        
        return {
            "success": True,
            "message": "Location deleted successfully"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error deleting location: {str(e)}")

