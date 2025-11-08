"""
Location Clustering Service
"""
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from app.database import get_database

CLUSTER_OFFSET = 0.001  # ~100 meters

def calculate_cluster_offset(base_lat: float, base_lng: float, index: int, total: int) -> Tuple[float, float]:
    if total <= 1:
        return (base_lat, base_lng)
    angle = (2 * math.pi * index) / total
    radius = CLUSTER_OFFSET * (1 + index * 0.3)
    lat_offset = radius * math.cos(angle)
    lng_offset = radius * math.sin(angle)
    return (base_lat + lat_offset, base_lng + lng_offset)

async def get_clustered_coordinates(location_name: str, lat: float, lng: float, db=None) -> Tuple[float, float]:
    if db is None:
        try:
            db = get_database()
        except Exception:
            return (lat, lng)
    try:
        from datetime import datetime, timedelta
        threshold = CLUSTER_OFFSET * 2
        query = {
            "location.lat": {"$gte": lat - threshold, "$lte": lat + threshold},
            "location.lng": {"$gte": lng - threshold, "$lte": lng + threshold},
            "timestamp": {"$gte": int((datetime.now() - timedelta(days=7)).timestamp())}
        }
        if location_name:
            from app.services.location_library import get_location_coordinates
            loc_data = get_location_coordinates(location_name)
            if loc_data:
                query["$or"] = [{"location_hierarchy.area": location_name}, {"location_hierarchy.sector": loc_data.get("sector")}]
        count = await db.alerts.count_documents(query)
        clustered_lat, clustered_lng = calculate_cluster_offset(lat, lng, count, count + 1)
        return (clustered_lat, clustered_lng)
    except Exception as e:
        print(f"Error in clustering: {e}")
        return (lat, lng)

def should_cluster(location_name: str, lat: float, lng: float) -> bool:
    large_areas = ["Herastrau", "Cismigiu", "Carol Park"]
    if location_name in large_areas:
        return False
    return True
