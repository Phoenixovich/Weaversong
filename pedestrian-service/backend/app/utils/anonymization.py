"""
Anonymization utilities for pedestrian location data.
Ensures no personally identifiable information is stored in the database.
"""
import hashlib
import secrets
from typing import Dict, Optional
from datetime import datetime


def hash_identifier(identifier: Optional[str], salt: Optional[str] = None) -> Optional[str]:
    """
    Hash an identifier (user_id, session_id) to anonymize it.
    Uses SHA-256 with a salt for one-way hashing.
    """
    if not identifier:
        return None
    
    # Use a consistent salt or generate one
    if salt is None:
        # Use a fixed salt for consistent hashing (in production, use a secret salt from config)
        salt = "pedestrian_location_salt"
    
    # Hash the identifier
    hashed = hashlib.sha256((identifier + salt).encode()).hexdigest()
    
    # Return first 16 characters for shorter IDs (still unique enough)
    return f"anon_{hashed[:16]}"


def anonymize_user_id(user_id: Optional[str]) -> Optional[str]:
    """Anonymize user ID by hashing it."""
    return hash_identifier(user_id, salt="user_id_salt")


def anonymize_session_id(session_id: Optional[str]) -> Optional[str]:
    """Anonymize session ID by hashing it."""
    return hash_identifier(session_id, salt="session_id_salt")


def sanitize_device_info(device_info: Optional[Dict]) -> Optional[Dict]:
    """
    Sanitize device information to remove identifying details.
    Only keeps generic information: device type and OS family.
    Removes specific browser versions, device models, etc.
    """
    if not device_info:
        return None
    
    sanitized = {}
    
    # Only keep generic device type
    if "type" in device_info:
        device_type = device_info.get("type", "").lower()
        # Normalize to generic types
        if device_type in ["mobile", "smartphone", "phone"]:
            sanitized["type"] = "mobile"
        elif device_type in ["tablet", "ipad"]:
            sanitized["type"] = "tablet"
        elif device_type in ["desktop", "laptop", "computer"]:
            sanitized["type"] = "desktop"
        else:
            sanitized["type"] = "unknown"
    
    # Only keep OS family, not version
    if "os" in device_info:
        os_name = device_info.get("os", "").lower()
        # Normalize to OS families
        if "android" in os_name:
            sanitized["os"] = "Android"
        elif "ios" in os_name or "iphone" in os_name or "ipad" in os_name:
            sanitized["os"] = "iOS"
        elif "windows" in os_name:
            sanitized["os"] = "Windows"
        elif "mac" in os_name or "darwin" in os_name:
            sanitized["os"] = "macOS"
        elif "linux" in os_name:
            sanitized["os"] = "Linux"
        else:
            sanitized["os"] = "Unknown"
    
    # Remove browser, browser version, device model, and any other identifying info
    # We don't store these to prevent fingerprinting
    
    return sanitized if sanitized else None


def round_coordinates(latitude: float, longitude: float, precision: int = 4) -> tuple:
    """
    Round coordinates to reduce precision and prevent exact location tracking.
    Default precision of 4 decimal places ≈ 11 meters accuracy.
    This is still accurate enough for analysis but prevents exact user tracking.
    """
    return (
        round(latitude, precision),
        round(longitude, precision)
    )


def anonymize_location_data(location_data: Dict) -> Dict:
    """
    Anonymize a location data dictionary before storing in database.
    This ensures no personally identifiable information is stored.
    """
    anonymized = location_data.copy()
    
    # Anonymize user_id if present
    if "user_id" in anonymized and anonymized["user_id"]:
        anonymized["user_id"] = anonymize_user_id(anonymized["user_id"])
    
    # Anonymize session_id if present
    if "session_id" in anonymized and anonymized["session_id"]:
        anonymized["session_id"] = anonymize_session_id(anonymized["session_id"])
    
    # Sanitize device_info
    if "device_info" in anonymized:
        anonymized["device_info"] = sanitize_device_info(anonymized["device_info"])
    
    # Round coordinates slightly to prevent exact tracking
    # (Optional - comment out if you need exact coordinates for analysis)
    if "latitude" in anonymized and "longitude" in anonymized:
        lat, lng = round_coordinates(
            anonymized["latitude"],
            anonymized["longitude"],
            precision=4  # ~11 meters accuracy
        )
        anonymized["latitude"] = lat
        anonymized["longitude"] = lng
    
    # Remove any other potentially identifying fields
    # Keep only: latitude, longitude, accuracy, timestamp, speed, heading, is_active
    allowed_fields = {
        "latitude", "longitude", "accuracy", "timestamp", 
        "speed", "heading", "is_active", "user_id", "session_id", "device_info"
    }
    
    # Remove any fields not in allowed list
    fields_to_remove = [key for key in anonymized.keys() if key not in allowed_fields and key != "_id"]
    for field in fields_to_remove:
        anonymized.pop(field, None)
    
    return anonymized


def generate_anonymous_session_id() -> str:
    """
    Generate a new anonymous session ID.
    This is used when no session_id is provided.
    """
    random_id = secrets.token_hex(16)
    return f"anon_session_{random_id}"


def is_data_anonymized(location_data: Dict) -> bool:
    """
    Check if location data appears to be already anonymized.
    Useful for validation.
    """
    user_id = location_data.get("user_id")
    session_id = location_data.get("session_id")
    
    # Check if IDs are anonymized (start with "anon_")
    user_anon = user_id is None or (isinstance(user_id, str) and user_id.startswith("anon_"))
    session_anon = session_id is None or (isinstance(session_id, str) and session_id.startswith("anon_session_"))
    
    # Check if device_info is sanitized (no browser, model, etc.)
    device_info = location_data.get("device_info", {})
    device_anon = not device_info or (
        "browser" not in device_info and
        "model" not in device_info and
        "version" not in device_info
    )
    
    return user_anon and session_anon and device_anon

