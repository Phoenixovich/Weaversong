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

# Major areas and neighborhoods - Organized by Sector according to official Bucharest distribution
# Sector 1: Dorobanți, Băneasa, Aviației, Pipera, Aviatorilor, Primăverii, Romană, Victoriei, Herăstrău, Bucureștii Noi, Dămăroaia, Străulești, Chitila, Grivița, 1 Mai, Pajura, Domenii, and a small part of Giulești – the part with Giulești Stadium
# Sector 2: Pantelimon, Colentina, Iancului, Tei, Floreasca, Moșilor, Obor, Vatra Luminoasă, Fundeni, Ștefan cel Mare
# Sector 3: Vitan, Dudești, Titan, Centrul Civic, Balta Albă, Dristor, Lipscani, Muncii, Unirii
# Sector 4: Berceni, Olteniței, Văcărești, Timpuri Noi, Tineretului, Progresul
# Sector 5: Rahova, Ferentari, Giurgiului, Cotroceni, 13 Septembrie, Dealul Spirii, Odăi
# Sector 6: Giulești, Crângași, Drumul Taberei, Militari, Regie (also known as Grozăvești), Ghencea

AREAS: Dict[str, List[str]] = {
    # Sector 1 areas
    "Dorobanți": ["dorobanti", "dorobanti", "dorobanți"],
    "Băneasa": ["baneasa", "băneasa", "baneasa airport", "baneasa shopping"],
    "Aviației": ["aviatiei", "aviației", "aviatiei street"],
    "Pipera": ["pipera"],
    "Aviatorilor": ["aviatorilor", "aviatorilor street", "aviatorilor boulevard"],
    "Primăverii": ["primaverii", "primăverii", "primăverii street"],
    "Romană": ["romana", "romană", "piata romana", "piata romană"],
    "Victoriei": ["victoriei", "piata victoriei", "victoriei square", "calea victoriei", "victoriei street"],
    "Herăstrău": ["herastrau", "herăstrău", "parc herastrau", "herastrau park", "parcul herastrau"],
    "Bucureștii Noi": ["bucurestii noi", "bucureștii noi", "bucuresti noi"],
    "Dămăroaia": ["damaroaia", "dămăroaia"],
    "Străulești": ["straulesti", "străulești"],
    "Chitila": ["chitila"],
    "Grivița": ["grivita", "grivița", "grivita station"],
    "1 Mai": ["1 mai", "1 mai", "primul mai"],
    "Pajura": ["pajura"],
    "Domenii": ["domenii"],
    "Giulești Stadium": ["giulesti stadium", "giulești stadium", "stadionul giulesti", "stadionul giulești"],
    "Cismigiu": ["cismigiu", "parc cismigiu", "cismigiu park", "parcul cismigiu"],
    "Gara de Nord": ["gara de nord", "gara nord", "nord station", "train station"],
    "Politehnica": ["politehnica", "polytehnica", "university", "upb", "polytechnic"],
    
    # Sector 2 areas
    "Pantelimon": ["pantelimon"],
    "Colentina": ["colentina", "colentina street"],
    "Iancului": ["iancului", "iancului street"],
    "Tei": ["tei", "parc tei", "tei park"],
    "Floreasca": ["floreasca", "floreasca lake", "lacul floreasca"],
    "Moșilor": ["mosilor", "moșilor", "mosilor street"],
    "Obor": ["obor", "piata obor", "obor square", "obor market"],
    "Vatra Luminoasă": ["vatra luminoasa", "vatra luminoasă"],
    "Fundeni": ["fundeni", "fundeni hospital"],
    "Ștefan cel Mare": ["stefan cel mare", "ștefan cel mare", "stefan cel mare street"],
    
    # Sector 3 areas
    "Vitan": ["vitan"],
    "Dudești": ["dudesti", "dudești"],
    "Titan": ["titan", "parc titan", "titan park"],
    "Centrul Civic": ["centrul civic", "civic center", "centru civic"],
    "Balta Albă": ["balta alba", "balta albă"],
    "Dristor": ["dristor", "piata dristor", "dristor square"],
    "Lipscani": ["lipscani", "strada lipscani", "old town", "lipscani street"],
    "Muncii": ["muncii", "piata muncii", "muncii square"],
    "Unirii": ["unirii", "piata unirii", "unirii square"],
    "Carol Park": ["carol", "parc carol", "carol park", "parcul carol"],
    "Carturesti Carusel": ["carturesti", "carusel", "carturesti carusel", "carusel bookstore"],
    
    # Sector 4 areas
    "Berceni": ["berceni"],
    "Olteniței": ["oltenitei", "olteniței", "oltenitei street"],
    "Văcărești": ["vacaresti", "văcărești", "vacaresti lake", "lacul vacaresti"],
    "Timpuri Noi": ["timpuri noi", "timpuri noi"],
    "Tineretului": ["tineretului", "parc tineretului", "tineretului park"],
    "Progresul": ["progresul"],
    
    # Sector 5 areas
    "Rahova": ["rahova"],
    "Ferentari": ["ferentari"],
    "Giurgiului": ["giurgiului", "giurgiului street"],
    "Cotroceni": ["cotroceni", "afi cotroceni", "cotroceni palace", "palatul cotroceni"],
    "13 Septembrie": ["13 septembrie", "13 septembrie street"],
    "Dealul Spirii": ["dealul spirii", "spirii hill"],
    "Odăi": ["odai", "odăi"],
    
    # Sector 6 areas
    "Giulești": ["giulesti", "giulești"],
    "Crângași": ["crangasi", "crângași"],
    "Drumul Taberei": ["drumul taberei", "taberei"],
    "Militari": ["militari", "militari residence"],
    "Regie": ["regie", "grozavesti", "grozăvești"],
    "Grozăvești": ["grozavesti", "grozăvești", "regie"],
    "Ghencea": ["ghencea", "stadionul ghencea", "ghencea stadium"],
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

