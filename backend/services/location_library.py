"""
Location Library for Bucharest
Contains common locations with their coordinates, sectors, and keywords for matching
This library is used to avoid AI calls when locations can be matched directly
"""
from typing import Dict, List, Optional, Tuple
from data.bucharest_locations import AREA_COORDINATES

# Extended location library with more common Bucharest locations
# Format: {location_name: {keywords: [...], lat: float, lng: float, sector: str, aliases: [...]}}
LOCATION_LIBRARY: Dict[str, Dict] = {
    # Universities and Educational Institutions
    "Politehnica": {
        "keywords": ["politehnica", "polytehnica", "upb", "university", "polytechnic", "upb library", "politehnica library", "polytehnica library"],
        "lat": 44.4390,
        "lng": 26.0530,
        "sector": "Sector 1",
        "aliases": ["UPB", "University Politehnica", "Politehnica University", "Polytehnica"]
    },
    
    # Shopping Centers and Malls
    "AFI Cotroceni": {
        "keywords": ["afi", "afi cotroceni", "cotroceni", "afi mall", "cotroceni mall"],
        "lat": 44.4280,
        "lng": 26.0600,
        "sector": "Sector 5",
        "aliases": ["AFI", "Cotroceni"]
    },
    "Carturesti Carusel": {
        "keywords": ["carturesti", "carusel", "carturesti carusel", "carusel bookstore", "carturesti bookstore"],
        "lat": 44.4319,
        "lng": 26.1028,
        "sector": "Sector 3",
        "aliases": ["Carusel", "Carturesti"]
    },
    "Baneasa Shopping City": {
        "keywords": ["baneasa", "baneasa shopping", "baneasa mall", "shopping city"],
        "lat": 44.5100,
        "lng": 26.0800,
        "sector": "Sector 1",
        "aliases": ["Baneasa Mall"]
    },
    "Mega Mall": {
        "keywords": ["mega mall", "megamall"],
        "lat": 44.4200,
        "lng": 26.0200,
        "sector": "Sector 6",
        "aliases": []
    },
    "ParkLake": {
        "keywords": ["parklake", "park lake", "parklake mall"],
        "lat": 44.4100,
        "lng": 26.0300,
        "sector": "Sector 6",
        "aliases": []
    },
    
    # Parks and Recreation
    "Herastrau": {
        "keywords": ["herastrau", "parc herastrau", "herastrau park", "parcul herastrau"],
        "lat": 44.4750,
        "lng": 26.0800,
        "sector": "Sector 1",
        "aliases": ["Parcul Herastrau"]
    },
    "Cismigiu": {
        "keywords": ["cismigiu", "parc cismigiu", "cismigiu park", "parcul cismigiu"],
        "lat": 44.4400,
        "lng": 26.0950,
        "sector": "Sector 1",
        "aliases": ["Parcul Cismigiu"]
    },
    "Carol Park": {
        "keywords": ["carol", "parc carol", "carol park", "parcul carol"],
        "lat": 44.4200,
        "lng": 26.1000,
        "sector": "Sector 3",
        "aliases": ["Parcul Carol"]
    },
    
    # Squares and Major Streets
    "Piata Unirii": {
        "keywords": ["piata unirii", "unirii", "unirii square", "piata unirii"],
        "lat": 44.4250,
        "lng": 26.1050,
        "sector": "Sector 3",
        "aliases": ["Unirii"]
    },
    "Piata Victoriei": {
        "keywords": ["piata victoriei", "victoriei", "victoriei square", "piata victoriei"],
        "lat": 44.4500,
        "lng": 26.0900,
        "sector": "Sector 1",
        "aliases": ["Victoriei"]
    },
    "Calea Victoriei": {
        "keywords": ["calea victoriei", "victoriei street", "victoriei"],
        "lat": 44.4475,
        "lng": 26.0975,
        "sector": "Sector 1",
        "aliases": ["Victoriei Street"]
    },
    "Bulevardul Magheru": {
        "keywords": ["magheru", "bulevardul magheru", "magheru boulevard", "magheru"],
        "lat": 44.4450,
        "lng": 26.1000,
        "sector": "Sector 1",
        "aliases": ["Magheru"]
    },
    "Lipscani": {
        "keywords": ["lipscani", "strada lipscani", "old town", "lipscani street"],
        "lat": 44.4319,
        "lng": 26.1028,
        "sector": "Sector 3",
        "aliases": ["Old Town"]
    },
    
    # Transportation Hubs
    "Gara de Nord": {
        "keywords": ["gara de nord", "gara nord", "nord station", "train station", "gara"],
        "lat": 44.4475,
        "lng": 26.0750,
        "sector": "Sector 1",
        "aliases": ["Gara Nord", "North Station"]
    },
    "Otopeni Airport": {
        "keywords": ["otopeni", "otopeni airport", "henri coanda", "airport"],
        "lat": 44.5500,
        "lng": 26.0800,
        "sector": "Sector 1",
        "aliases": ["Henri Coanda Airport"]
    },
    
    # Neighborhoods
    "Drumul Taberei": {
        "keywords": ["drumul taberei", "taberei"],
        "lat": 44.4100,
        "lng": 26.0300,
        "sector": "Sector 6",
        "aliases": ["Taberei"]
    },
    "Militari": {
        "keywords": ["militari", "militari residence"],
        "lat": 44.4200,
        "lng": 26.0200,
        "sector": "Sector 6",
        "aliases": []
    },
    "Berceni": {
        "keywords": ["berceni"],
        "lat": 44.3800,
        "lng": 26.1200,
        "sector": "Sector 4",
        "aliases": []
    },
    "Pantelimon": {
        "keywords": ["pantelimon"],
        "lat": 44.4000,
        "lng": 26.1300,
        "sector": "Sector 2",
        "aliases": []
    },
    "Titan": {
        "keywords": ["titan"],
        "lat": 44.4200,
        "lng": 26.1400,
        "sector": "Sector 3",
        "aliases": []
    },
    "Vitan": {
        "keywords": ["vitan"],
        "lat": 44.4100,
        "lng": 26.1300,
        "sector": "Sector 3",
        "aliases": []
    },
    "Rahova": {
        "keywords": ["rahova"],
        "lat": 44.4300,
        "lng": 26.0500,
        "sector": "Sector 5",
        "aliases": []
    },
    "Crangasi": {
        "keywords": ["crangasi"],
        "lat": 44.4400,
        "lng": 26.0400,
        "sector": "Sector 6",
        "aliases": []
    },
    "Giulesti": {
        "keywords": ["giulesti"],
        "lat": 44.4500,
        "lng": 26.0300,
        "sector": "Sector 6",
        "aliases": []
    },
}

def find_location_in_text(text: str) -> Optional[Tuple[str, Dict]]:
    """
    Find a location from the library in the given text
    Returns: (location_name, location_data) or None
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Check each location in the library
    for location_name, location_data in LOCATION_LIBRARY.items():
        # Check keywords
        for keyword in location_data.get("keywords", []):
            if keyword.lower() in text_lower:
                return (location_name, location_data)
        
        # Check aliases
        for alias in location_data.get("aliases", []):
            if alias.lower() in text_lower:
                return (location_name, location_data)
        
        # Check location name itself
        if location_name.lower() in text_lower:
            return (location_name, location_data)
    
    return None

def get_location_coordinates(location_name: str) -> Optional[Dict]:
    """
    Get coordinates and sector for a location name
    Returns: {lat: float, lng: float, sector: str} or None
    """
    location_data = LOCATION_LIBRARY.get(location_name)
    if location_data:
        return {
            "lat": location_data["lat"],
            "lng": location_data["lng"],
            "sector": location_data["sector"]
        }
    return None

def get_all_locations() -> Dict[str, Dict]:
    """Get all locations in the library"""
    return LOCATION_LIBRARY

