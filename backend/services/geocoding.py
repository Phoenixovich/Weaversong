"""
Geocoding service using Nominatim (OpenStreetMap) and Google Maps Platform for geocoding
"""
import httpx
from typing import Dict, Any, Optional
import db

async def geocode_address(address: str, use_correction: bool = True) -> Dict[str, Any] | None:
    """
    Geocode an address to get coordinates
    If geocoding fails and use_correction is True, tries to correct the address first
    Returns: {lat: float, lng: float, address: str, corrected: bool} or None
    """
    if not address:
        return None
    
    # First try: geocode the original address
    result = await _geocode_address_internal(address)
    if result:
        result["corrected"] = False
        return result
    
    # Second try: if geocoding failed and correction is enabled, try correcting the address
    if use_correction:
        from services.address_correction import correct_address
        
        correction = correct_address(address)
        if correction.get("corrected") and correction["confidence"] >= 0.6:
            corrected_address = correction["corrected"]
            result = await _geocode_address_internal(corrected_address)
            if result:
                result["corrected"] = True
                result["original_address"] = address
                result["corrected_address"] = corrected_address
                return result
    
    return None

async def _geocode_address_internal(address: str) -> Dict[str, Any] | None:
    """
    Internal geocoding function (without correction)
    """
    try:
        async with httpx.AsyncClient() as client:
            # Nominatim API for geocoding
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": f"{address}, Bucharest, Romania",
                "format": "json",
                "limit": 1,
            }
            headers = {
                "User-Agent": "CityPulse/1.0"
            }
            
            response = await client.get(url, params=params, headers=headers, timeout=3.0)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                return {
                    "lat": float(result["lat"]),
                    "lng": float(result["lon"]),
                    "address": result.get("display_name", address)
                }
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None
    
    return None

async def reverse_geocode(lat: float, lng: float) -> str | None:
    """
    Reverse geocode coordinates to get address
    Tries Google Maps API first (if available), then falls back to Nominatim
    Returns: address string or None
    """
    # Try Google Maps API first (if API key is available)
    google_result = await _reverse_geocode_google(lat, lng)
    if google_result:
        return google_result
    
    # Fallback to Nominatim
    try:
        async with httpx.AsyncClient() as client:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": str(lat),
                "lon": str(lng),
                "format": "json",
            }
            headers = {
                "User-Agent": "CityPulse/1.0"
            }
            
            response = await client.get(url, params=params, headers=headers, timeout=3.0)
            response.raise_for_status()
            data = response.json()
            
            if data and "display_name" in data:
                return data["display_name"]
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
        return None
    
    return None

async def reverse_geocode_with_sector(lat: float, lng: float) -> Dict[str, Any] | None:
    """
    Reverse geocode coordinates to get address and sector information
    Uses Google Maps Platform Geocoding API to extract sector from address_components
    Returns: {address: str, sector: str | None, area: str | None} or None
    """
    # Try Google Maps API first (if API key is available)
    google_result = await _reverse_geocode_google_with_sector(lat, lng)
    if google_result:
        return google_result
    
    # Fallback to Nominatim (no sector extraction)
    address = await reverse_geocode(lat, lng)
    if address:
        return {
            "address": address,
            "sector": None,
            "area": None
        }
    
    return None

async def _reverse_geocode_google(lat: float, lng: float) -> str | None:
    """
    Reverse geocode using Google Maps Platform Geocoding API
    Returns: address string or None
    """
    if not db.settings.google_api_key:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "latlng": f"{lat},{lng}",
                "key": db.settings.google_api_key,
                "language": "ro",  # Romanian language for better results
            }
            
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                # Return formatted address from first result
                return data["results"][0].get("formatted_address")
    except Exception as e:
        print(f"Google reverse geocoding error: {e}")
        return None
    
    return None

async def _reverse_geocode_google_with_sector(lat: float, lng: float) -> Dict[str, Any] | None:
    """
    Reverse geocode using Google Maps Platform Geocoding API
    Extracts sector information from address_components
    Returns: {address: str, sector: str | None, area: str | None} or None
    """
    if not db.settings.google_api_key:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "latlng": f"{lat},{lng}",
                "key": db.settings.google_api_key,
                "language": "ro",  # Romanian language for better results
            }
            
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                result = data["results"][0]
                formatted_address = result.get("formatted_address", "")
                
                # Extract sector and area from address_components
                sector = None
                area = None
                
                for component in result.get("address_components", []):
                    types = component.get("types", [])
                    long_name = component.get("long_name", "")
                    short_name = component.get("short_name", "")
                    
                    # Look for administrative_area_level_2 (often contains sector)
                    if "administrative_area_level_2" in types:
                        # Check if it contains "Sector" in the name
                        if "sector" in long_name.lower() or "sector" in short_name.lower():
                            sector = long_name
                        else:
                            # Might be a district/area name
                            area = long_name
                    
                    # Also check for sublocality_level_1 (neighborhood/area)
                    if "sublocality_level_1" in types and not area:
                        area = long_name
                    
                    # Check for sublocality (neighborhood)
                    if "sublocality" in types and not area:
                        area = long_name
                    
                    # Check for neighborhood
                    if "neighborhood" in types and not area:
                        area = long_name
                
                # If we found a sector in the address components, use it
                # Otherwise, try to extract from formatted address
                if not sector:
                    # Try to find "Sector X" pattern in formatted address
                    import re
                    sector_match = re.search(r'sector\s*(\d+)', formatted_address, re.IGNORECASE)
                    if sector_match:
                        sector = f"Sector {sector_match.group(1)}"
                
                return {
                    "address": formatted_address,
                    "sector": sector,
                    "area": area
                }
    except Exception as e:
        print(f"Google reverse geocoding with sector error: {e}")
        return None
    
    return None

