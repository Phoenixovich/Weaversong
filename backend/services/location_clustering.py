"""
Location Clustering Service
Handles multiple events at the same location by adding small offsets to coordinates
This prevents markers from overlapping on the map
"""
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# Small offset in degrees (approximately 50-100 meters)
CLUSTER_OFFSET = 0.001  # ~100 meters

def calculate_cluster_offset(
    base_lat: float,
    base_lng: float,
    index: int,
    total: int
) -> Tuple[float, float]:
    """
    Calculate offset coordinates for clustering
    Uses a spiral pattern to distribute markers around the base location
    
    Args:
        base_lat: Base latitude
        base_lng: Base longitude
        index: Index of this marker (0-based)
        total: Total number of markers at this location
    
    Returns:
        (lat, lng) with offset applied
    """
    if total <= 1:
        return (base_lat, base_lng)
    
    # Use spiral pattern for distribution
    angle = (2 * math.pi * index) / total
    radius = CLUSTER_OFFSET * (1 + index * 0.3)  # Slightly increasing radius
    
    # Convert to lat/lng offset (approximate)
    lat_offset = radius * math.cos(angle)
    lng_offset = radius * math.sin(angle)
    
    return (base_lat + lat_offset, base_lng + lng_offset)

async def get_clustered_coordinates(
    location_name: str,
    lat: float,
    lng: float,
    db=None
) -> Tuple[float, float]:
    """
    Get coordinates with clustering offset if there are multiple alerts at this location
    Checks the database for existing alerts at the same location
    
    Args:
        location_name: Name of the location
        lat: Base latitude
        lng: Base longitude
        db: Database instance (optional, for checking existing alerts)
    
    Returns:
        (lat, lng) with clustering offset if needed
    """
    if db is None:
        return (lat, lng)
    
    try:
        # Count existing alerts at this location (within small radius)
        # We'll match by location name or coordinates within cluster offset
        from datetime import datetime, timedelta
        
        # Check for alerts in the last 7 days at similar coordinates
        threshold = CLUSTER_OFFSET * 2  # Check within 2x cluster offset
        
        query = {
            "location.lat": {
                "$gte": lat - threshold,
                "$lte": lat + threshold
            },
            "location.lng": {
                "$gte": lng - threshold,
                "$lte": lng + threshold
            },
            "timestamp": {
                "$gte": int((datetime.now() - timedelta(days=7)).timestamp())
            }
        }
        
        # Also check by location hierarchy if available
        if location_name:
            # Try to match by area or sector
            from services.location_library import get_location_coordinates
            loc_data = get_location_coordinates(location_name)
            if loc_data:
                query["$or"] = [
                    {"location_hierarchy.area": location_name},
                    {"location_hierarchy.sector": loc_data.get("sector")}
                ]
        
        count = await db.alerts.count_documents(query)
        
        # Apply clustering offset
        clustered_lat, clustered_lng = calculate_cluster_offset(lat, lng, count, count + 1)
        
        return (clustered_lat, clustered_lng)
    
    except Exception as e:
        print(f"Error in clustering: {e}")
        return (lat, lng)

def should_cluster(location_name: str, lat: float, lng: float) -> bool:
    """
    Determine if a location should use clustering
    Some locations (like large parks) might not need clustering
    """
    # Large areas that might have multiple events naturally spread out
    large_areas = ["Herastrau", "Cismigiu", "Carol Park"]
    
    if location_name in large_areas:
        return False
    
    return True

