"""
Geocoding service using Nominatim (OpenStreetMap) and Google Maps Platform for geocoding
"""
import httpx
from typing import Dict, Any, Optional
from app.config import settings

async def geocode_address(address: str, use_correction: bool = True) -> Dict[str, Any] | None:
    if not address:
        return None
    result = await _geocode_address_internal(address)
    if result:
        result["corrected"] = False
        return result
    if use_correction:
        from app.services.address_correction import correct_address
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
    try:
        async with httpx.AsyncClient() as client:
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": f"{address}, Bucharest, Romania", "format": "json", "limit": 1}
            headers = {"User-Agent": "CityPulse/1.0"}
            response = await client.get(url, params=params, headers=headers, timeout=3.0)
            response.raise_for_status()
            data = response.json()
            if data and len(data) > 0:
                result = data[0]
                return {"lat": float(result["lat"]), "lng": float(result["lon"]), "address": result.get("display_name", address)}
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None
    return None

async def reverse_geocode(lat: float, lng: float) -> str | None:
    google_result = await _reverse_geocode_google(lat, lng)
    if google_result:
        return google_result
    try:
        async with httpx.AsyncClient() as client:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {"lat": str(lat), "lon": str(lng), "format": "json"}
            headers = {"User-Agent": "CityPulse/1.0"}
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
    google_result = await _reverse_geocode_google_with_sector(lat, lng)
    if google_result:
        return google_result
    address = await reverse_geocode(lat, lng)
    if address:
        return {"address": address, "sector": None, "area": None}
    return None

async def _reverse_geocode_google(lat: float, lng: float) -> str | None:
    google_api_key = getattr(settings, "google_api_key", None)
    if not google_api_key:
        return None
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"latlng": f"{lat},{lng}", "key": google_api_key, "language": "ro"}
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == "OK" and data.get("results"):
                return data["results"][0].get("formatted_address")
    except Exception as e:
        print(f"Google reverse geocoding error: {e}")
        return None
    return None

async def _reverse_geocode_google_with_sector(lat: float, lng: float) -> Dict[str, Any] | None:
    google_api_key = getattr(settings, "google_api_key", None)
    if not google_api_key:
        return None
    try:
        async with httpx.AsyncClient() as client:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"latlng": f"{lat},{lng}", "key": google_api_key, "language": "ro"}
            response = await client.get(url, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == "OK" and data.get("results"):
                result = data["results"][0]
                formatted_address = result.get("formatted_address", "")
                sector = None
                area = None
                for component in result.get("address_components", []):
                    types = component.get("types", [])
                    long_name = component.get("long_name", "")
                    short_name = component.get("short_name", "")
                    if "administrative_area_level_2" in types:
                        if "sector" in long_name.lower() or "sector" in short_name.lower():
                            sector = long_name
                        else:
                            area = long_name
                    if "sublocality_level_1" in types and not area:
                        area = long_name
                    if "sublocality" in types and not area:
                        area = long_name
                    if "neighborhood" in types and not area:
                        area = long_name
                if not sector:
                    import re
                    sector_match = re.search(r'sector\s*(\d+)', formatted_address, re.IGNORECASE)
                    if sector_match:
                        sector = f"Sector {sector_match.group(1)}"
                return {"address": formatted_address, "sector": sector, "area": area}
    except Exception as e:
        print(f"Google reverse geocoding with sector error: {e}")
        return None
    return None
