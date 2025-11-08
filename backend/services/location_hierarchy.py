"""
Location hierarchy service for Bucharest
Point (coordinates) -> Area -> Sector -> Bucharest
"""
from typing import Dict, List, Tuple, Optional
from services.neighborhoods import SECTORS, AREAS, detect_neighborhood
from services.geocoding import reverse_geocode
from data.bucharest_locations import get_area_sector_from_point

# Map areas to their sectors according to official Bucharest distribution
AREA_TO_SECTOR: Dict[str, str] = {
    # Sector 1 areas
    "Dorobanți": "Sector 1",
    "Băneasa": "Sector 1",
    "Aviației": "Sector 1",
    "Pipera": "Sector 1",
    "Aviatorilor": "Sector 1",
    "Primăverii": "Sector 1",
    "Romană": "Sector 1",
    "Victoriei": "Sector 1",
    "Herăstrău": "Sector 1",
    "Bucureștii Noi": "Sector 1",
    "Dămăroaia": "Sector 1",
    "Străulești": "Sector 1",
    "Chitila": "Sector 1",
    "Grivița": "Sector 1",
    "1 Mai": "Sector 1",
    "Pajura": "Sector 1",
    "Domenii": "Sector 1",
    "Giulești Stadium": "Sector 1",
    "Cismigiu": "Sector 1",
    "Gara de Nord": "Sector 1",
    "Politehnica": "Sector 1",
    "Piata Victoriei": "Sector 1",
    "Calea Victoriei": "Sector 1",
    "Bulevardul Magheru": "Sector 1",
    "Baneasa": "Sector 1",
    "Otopeni": "Sector 1",
    
    # Sector 2 areas
    "Pantelimon": "Sector 2",
    "Colentina": "Sector 2",
    "Iancului": "Sector 2",
    "Tei": "Sector 2",
    "Floreasca": "Sector 2",
    "Moșilor": "Sector 2",
    "Obor": "Sector 2",
    "Vatra Luminoasă": "Sector 2",
    "Fundeni": "Sector 2",
    "Ștefan cel Mare": "Sector 2",
    
    # Sector 3 areas
    "Vitan": "Sector 3",
    "Dudești": "Sector 3",
    "Titan": "Sector 3",
    "Centrul Civic": "Sector 3",
    "Balta Albă": "Sector 3",
    "Dristor": "Sector 3",
    "Lipscani": "Sector 3",
    "Muncii": "Sector 3",
    "Unirii": "Sector 3",
    "Piata Unirii": "Sector 3",
    "Carol Park": "Sector 3",
    "Carturesti Carusel": "Sector 3",
    
    # Sector 4 areas
    "Berceni": "Sector 4",
    "Olteniței": "Sector 4",
    "Văcărești": "Sector 4",
    "Timpuri Noi": "Sector 4",
    "Tineretului": "Sector 4",
    "Progresul": "Sector 4",
    
    # Sector 5 areas
    "Rahova": "Sector 5",
    "Ferentari": "Sector 5",
    "Giurgiului": "Sector 5",
    "Cotroceni": "Sector 5",
    "AFI Cotroceni": "Sector 5",
    "13 Septembrie": "Sector 5",
    "Dealul Spirii": "Sector 5",
    "Odăi": "Sector 5",
    
    # Sector 6 areas
    "Giulești": "Sector 6",
    "Crângași": "Sector 6",
    "Drumul Taberei": "Sector 6",
    "Militari": "Sector 6",
    "Regie": "Sector 6",
    "Grozăvești": "Sector 6",
    "Ghencea": "Sector 6",
    "Crangasi": "Sector 6",  # Alternative spelling
    "Giulesti": "Sector 6",  # Alternative spelling
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
    
    # Get address and sector from coordinates if not provided (only if we don't have area/sector yet)
    if not address and lat and lng and not result.get("area") and not result.get("sector"):
        try:
            # Try Google Maps reverse geocoding with sector extraction first
            from services.geocoding import reverse_geocode_with_sector
            geocode_result = await reverse_geocode_with_sector(lat, lng)
            
            if geocode_result:
                address = geocode_result.get("address")
                # Use sector from Google Maps if available
                if geocode_result.get("sector") and not result.get("sector"):
                    result["sector"] = geocode_result.get("sector")
                    result["city"] = "Bucharest"
                # Use area from Google Maps if available
                if geocode_result.get("area") and not result.get("area"):
                    result["area"] = geocode_result.get("area")
                    result["city"] = "Bucharest"
            else:
                # Fallback to regular reverse geocoding
                address = await reverse_geocode(lat, lng)
        except Exception as e:
            print(f"Reverse geocoding failed: {e}")
            address = None
    
    # Detect neighborhood from text and address (if not already found from coordinates)
    # Only set area if it's explicitly mentioned in text, not from coordinates alone
    if not result.get("area") and not result.get("sector"):
        neighborhood, area_type = detect_neighborhood(text, address)
        
        if neighborhood:
            if area_type == "sector":
                result["sector"] = neighborhood
                result["city"] = "Bucharest"
            elif area_type == "area":
                # Only set area if it's mentioned in text (not just from address)
                # Check if area name appears in the text
                text_lower = text.lower() if text else ""
                neighborhood_lower = neighborhood.lower()
                
                # If area is mentioned in text, set it
                if any(keyword in text_lower for keyword in AREAS.get(neighborhood, [])) or neighborhood_lower in text_lower:
                    result["area"] = neighborhood
                    # Try to get sector from area mapping
                    if neighborhood in AREA_TO_SECTOR:
                        result["sector"] = AREA_TO_SECTOR[neighborhood]
                    result["city"] = "Bucharest"
                else:
                    # Area not mentioned in text, only set sector if we can determine it
                    if neighborhood in AREA_TO_SECTOR:
                        result["sector"] = AREA_TO_SECTOR[neighborhood]
                        result["city"] = "Bucharest"
            elif area_type == "city":
                result["city"] = neighborhood
    
    # If we have coordinates but no area/sector, try to detect from address
    # Only set sector from address, don't set area unless mentioned in text
    if lat and lng and not result.get("area") and not result.get("sector"):
        if address:
            # Try to extract sector from address
            address_lower = address.lower()
            for sector in SECTORS.keys():
                if sector.lower() in address_lower:
                    result["sector"] = sector
                    result["city"] = "Bucharest"
                    break
            
            # Don't extract area from address alone - only if mentioned in text
            # Area should only be set if explicitly mentioned in user input
    
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

