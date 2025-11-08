"""
Geocoding service using Nominatim (OpenStreetMap) for reverse geocoding
"""
import httpx
from typing import Dict, Any

async def geocode_address(address: str) -> Dict[str, Any] | None:
    """
    Geocode an address to get coordinates
    Returns: {lat: float, lng: float, address: str} or None
    """
    if not address:
        return None
    
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
                "User-Agent": "LocalVoice/1.0"
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
    Returns: address string or None
    """
    try:
        async with httpx.AsyncClient() as client:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": str(lat),
                "lon": str(lng),
                "format": "json",
            }
            headers = {
                "User-Agent": "LocalVoice/1.0"
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

