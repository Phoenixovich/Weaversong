from fastapi import APIRouter, HTTPException
import db

router = APIRouter()

@router.get("")
async def get_sectors():
    """Get all sectors with their polygon boundaries from MongoDB"""
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        cursor = db.database.sectors.find({})
        sectors = []
        async for doc in cursor:
            # Extract polygon coordinates from GeoJSON format
            polygon = doc.get("polygon", {})
            coordinates = polygon.get("coordinates", [])
            
            # GeoJSON Polygon format: coordinates[0] is the outer ring
            # Check if coordinates are stored as [lat, lng] or [lng, lat]
            # Bucharest coordinates: lat ~44.4, lng ~26.1
            # If first coord > 40, it's likely lat (stored as [lat, lng])
            # If first coord < 30, it's likely lng (stored as [lng, lat] per GeoJSON)
            if coordinates and len(coordinates) > 0:
                outer_ring = coordinates[0]  # First ring is the outer boundary
                if outer_ring and len(outer_ring) > 0:
                    first_coord = outer_ring[0]
                    # Check if stored as [lat, lng] (first value > 40) or [lng, lat] (first value < 30)
                    if len(first_coord) >= 2 and first_coord[0] > 40:
                        # Stored as [lat, lng] - use directly for Leaflet
                        polygon_coords = [[coord[0], coord[1]] for coord in outer_ring]
                    else:
                        # Stored as [lng, lat] (GeoJSON) - convert to [lat, lng] for Leaflet
                        polygon_coords = [[coord[1], coord[0]] for coord in outer_ring]
                else:
                    polygon_coords = []
            else:
                polygon_coords = []
            
            # Extract center point
            center = doc.get("center", {})
            center_coords = center.get("coordinates", [])
            center_point = None
            if center_coords and len(center_coords) >= 2:
                # Check if stored as [lat, lng] or [lng, lat]
                if center_coords[0] > 40:
                    # Stored as [lat, lng] - use directly
                    center_point = [center_coords[0], center_coords[1]]
                else:
                    # Stored as [lng, lat] (GeoJSON) - convert to [lat, lng]
                    center_point = [center_coords[1], center_coords[0]]
            
            sector_doc = {
                "sector": doc.get("sector"),
                "type": doc.get("type", "sector"),
                "polygon": polygon_coords,
                "center": center_point,
                "metadata": doc.get("metadata", {})
            }
            sectors.append(sector_doc)
        
        return sectors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sectors: {str(e)}")

