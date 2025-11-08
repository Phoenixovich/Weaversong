"""
Location hierarchy service for Bucharest
Point (coordinates) -> Area -> Sector -> Bucharest
"""
from typing import Dict, List, Tuple, Optional
from services.neighborhoods import SECTORS, AREAS, detect_neighborhood
from services.geocoding import reverse_geocode
from data.bucharest_locations import get_area_sector_from_point

# Map areas to their sectors (approximate mapping)
AREA_TO_SECTOR: Dict[str, str] = {
    "Gara de Nord": "Sector 1",
    "Politehnica": "Sector 1",
    "AFI Cotroceni": "Sector 5",
    "Herastrau": "Sector 1",
    "Cismigiu": "Sector 1",
    "Piata Unirii": "Sector 3",
    "Piata Victoriei": "Sector 1",
    "Calea Victoriei": "Sector 1",
    "Bulevardul Magheru": "Sector 1",
    "Lipscani": "Sector 3",
    "Drumul Taberei": "Sector 6",
    "Militari": "Sector 6",
    "Berceni": "Sector 4",
    "Pantelimon": "Sector 2",
    "Titan": "Sector 3",
    "Vitan": "Sector 3",
    "Rahova": "Sector 5",
    "Crangasi": "Sector 6",
    "Giulesti": "Sector 6",
    "Baneasa": "Sector 1",
    "Otopeni": "Sector 1",
}

async def get_location_hierarchy(
    lat: float | None = None,
    lng: float | None = None,
    address: str | None = None,
    text: str = ""
) -> Dict[str, Optional[str]]:
    """
    Get hierarchical location: point -> area -> sector -> city
    Returns: {
        "point": "lat,lng" or None,
        "area": area name or None,
        "sector": sector name or None,
        "city": "Bucharest" or None
    }
    """
    result = {
        "point": None,
        "area": None,
        "sector": None,
        "city": None
    }
    
    # If we have coordinates, we have a point
    if lat and lng:
        result["point"] = f"{lat},{lng}"
        
        # First, try to get area/sector from stored coordinate mappings (fast, no API call)
        area_sector = get_area_sector_from_point(lat, lng)
        if area_sector.get("area"):
            result["area"] = area_sector["area"]
        if area_sector.get("sector"):
            result["sector"] = area_sector["sector"]
            result["city"] = "Bucharest"
    
    # Get address from coordinates if not provided (only if we don't have area/sector yet)
    if not address and lat and lng and not result.get("area") and not result.get("sector"):
        try:
            address = await reverse_geocode(lat, lng)
        except Exception as e:
            print(f"Reverse geocoding failed: {e}")
            address = None
    
    # Detect neighborhood from text and address (if not already found from coordinates)
    if not result.get("area") and not result.get("sector"):
        neighborhood, area_type = detect_neighborhood(text, address)
        
        if neighborhood:
            if area_type == "sector":
                result["sector"] = neighborhood
                result["city"] = "Bucharest"
            elif area_type == "area":
                result["area"] = neighborhood
                # Try to get sector from area mapping
                if neighborhood in AREA_TO_SECTOR:
                    result["sector"] = AREA_TO_SECTOR[neighborhood]
                result["city"] = "Bucharest"
            elif area_type == "city":
                result["city"] = neighborhood
    
    # If we have coordinates but no area/sector, try to detect from address
    if lat and lng and not result.get("area") and not result.get("sector"):
        if address:
            # Try to extract sector from address
            address_lower = address.lower()
            for sector in SECTORS.keys():
                if sector.lower() in address_lower:
                    result["sector"] = sector
                    result["city"] = "Bucharest"
                    break
            
            # Try to extract area from address
            if not result.get("area"):
                for area, keywords in AREAS.items():
                    if any(keyword in address_lower for keyword in keywords):
                        result["area"] = area
                        if area in AREA_TO_SECTOR:
                            result["sector"] = AREA_TO_SECTOR[area]
                        result["city"] = "Bucharest"
                        break
    
    # If we have point/area/sector, we always have city
    if result["point"] or result["area"] or result["sector"]:
        result["city"] = "Bucharest"
    
    return result

def get_display_location(hierarchy: Dict[str, Optional[str]]) -> str:
    """
    Get display string for location hierarchy
    Priority: point -> area -> sector -> city
    """
    if hierarchy.get("point"):
        # If we have a specific point, show area or sector if available
        if hierarchy.get("area"):
            return f"{hierarchy['area']}, {hierarchy.get('sector', '')}".strip()
        if hierarchy.get("sector"):
            return hierarchy["sector"]
        return "Bucharest"
    
    if hierarchy.get("area"):
        return f"{hierarchy['area']}, {hierarchy.get('sector', '')}".strip()
    
    if hierarchy.get("sector"):
        return hierarchy["sector"]
    
    if hierarchy.get("city"):
        return hierarchy["city"]
    
    return "Unknown"

