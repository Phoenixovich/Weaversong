"""
Bucharest neighborhoods and areas mapping
"""
from typing import Dict, List, Tuple

# Bucharest sectors
SECTORS = {
    "Sector 1": ["Sector 1", "Sectorul 1"],
    "Sector 2": ["Sector 2", "Sectorul 2"],
    "Sector 3": ["Sector 3", "Sectorul 3"],
    "Sector 4": ["Sector 4", "Sectorul 4"],
    "Sector 5": ["Sector 5", "Sectorul 5"],
    "Sector 6": ["Sector 6", "Sectorul 6"],
}

# Major areas and neighborhoods
AREAS: Dict[str, List[str]] = {
    "Gara de Nord": ["gara de nord", "gara nord", "nord station", "train station"],
    "Politehnica": ["politehnica", "university", "upb", "polytechnic"],
    "AFI Cotroceni": ["afi", "afi cotroceni", "cotroceni", "cotroceni palace"],
    "Herastrau": ["herastrau", "parc herastrau", "herastrau park"],
    "Cismigiu": ["cismigiu", "parc cismigiu", "cismigiu park"],
    "Piata Unirii": ["piata unirii", "unirii", "unirii square"],
    "Piata Victoriei": ["piata victoriei", "victoriei", "victoriei square"],
    "Calea Victoriei": ["calea victoriei", "victoriei street"],
    "Bulevardul Magheru": ["magheru", "bulevardul magheru", "magheru boulevard"],
    "Lipscani": ["lipscani", "strada lipscani", "old town"],
    "Drumul Taberei": ["drumul taberei", "taberei"],
    "Militari": ["militari", "militari residence"],
    "Berceni": ["berceni"],
    "Pantelimon": ["pantelimon"],
    "Titan": ["titan"],
    "Vitan": ["vitan"],
    "Rahova": ["rahova"],
    "Crangasi": ["crangasi"],
    "Giulesti": ["giulesti"],
    "Baneasa": ["baneasa", "baneasa airport"],
    "Otopeni": ["otopeni", "otopeni airport"],
}

def detect_neighborhood(text: str, address: str | None = None) -> Tuple[str | None, str | None]:
    """
    Detect neighborhood/area from text or address
    Returns: (neighborhood_name, area_type) where area_type is 'sector', 'area', or 'city'
    """
    text_lower = text.lower() if text else ""
    address_lower = address.lower() if address else ""
    combined = f"{text_lower} {address_lower}"
    
    # Check for sectors first (more specific)
    for sector, keywords in SECTORS.items():
        if any(keyword in combined for keyword in keywords):
            return sector, "sector"
    
    # Check for specific areas
    for area, keywords in AREAS.items():
        if any(keyword in combined for keyword in keywords):
            return area, "area"
    
    # Try to detect sector from address patterns (e.g., "Sector 1, Bucharest")
    import re
    sector_match = re.search(r'sector\s*(\d)', combined, re.IGNORECASE)
    if sector_match:
        sector_num = sector_match.group(1)
        return f"Sector {sector_num}", "sector"
    
    # If address contains "Bucharest" or "Bucuresti", it's city-wide
    if "bucharest" in combined or "bucuresti" in combined:
        return "Bucharest", "city"
    
    return None, None

async def detect_neighborhood_from_coords(lat: float, lng: float, address: str | None = None) -> Tuple[str | None, str | None]:
    """
    Detect neighborhood from coordinates by reverse geocoding
    Returns: (neighborhood_name, area_type)
    """
    from services.geocoding import reverse_geocode
    
    # If address not provided, get it from coordinates
    if not address:
        address = await reverse_geocode(lat, lng)
    
    if address:
        return detect_neighborhood("", address)
    
    return None, None

def get_all_neighborhoods() -> Dict[str, List[str]]:
    """Get all available neighborhoods grouped by type"""
    return {
        "Sectors": list(SECTORS.keys()),
        "Areas": list(AREAS.keys()),
        "City": ["Bucharest"]
    }

