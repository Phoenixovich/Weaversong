"""
AI Analysis service to extract structured data from user text
"""
import re
import json
import httpx
from textwrap import dedent
from typing import Dict, Any, Optional
from app.models.citypulse_alert import AlertCategory, AlertPriority
from app.config import settings

# Category and priority keywords (same as root)
CATEGORY_KEYWORDS: Dict[AlertCategory, list] = {
    "Road": ["accident", "crash", "collision", "pothole", "road damage", "road hazard"],
    "Traffic": ["traffic", "jam", "congestion", "heavy traffic", "slow traffic", "standstill"],
    "Safety": ["suspicious", "danger", "unsafe", "threat", "warning", "caution", "hazard", "ice", "slippery", "dangerous"],
    "Emergency": ["emergency", "fire", "ambulance", "medical", "urgent", "911", "help needed", "rescue"],
    "Crime": ["crime", "theft", "robbery", "vandalism", "break-in", "stolen", "police", "arrest"],
    "Lost": ["lost", "missing", "found", "pet", "dog", "cat", "child", "person", "item", "belongings", "nametag", "name tag"],
    "Weather": ["rain", "storm", "snow", "ice", "flood", "wind", "weather", "temperature", "hail", "thunder", "lightning", "fog"],
    "Environment": ["smoke", "pollution", "air quality", "smell", "odor", "chemical", "toxic", "contamination"],
    "Infrastructure": ["power", "electricity", "outage", "blackout", "water", "internet", "wifi", "phone", "utility", "service down"],
    "PublicTransport": ["metro", "bus", "tram", "train", "station", "public transport", "transit", "delay", "cancelled"],
    "Construction": ["construction", "road work", "building work", "renovation", "demolition", "crane", "excavation"],
    "Event": ["event", "festival", "concert", "gathering", "celebration", "parade", "protest", "demonstration"],
    "General": []
}

PRIORITY_KEYWORDS: Dict[AlertPriority, list] = {
    "Critical": ["emergency", "urgent", "critical", "immediate", "now", "asap", "help", "911"],
    "High": ["serious", "important", "dangerous", "hazard", "warning", "caution"],
    "Medium": [],
    "Low": ["minor", "small", "info", "update", "notice"]
}

VALID_CATEGORIES = list(CATEGORY_KEYWORDS.keys())
VALID_PRIORITIES = list(PRIORITY_KEYWORDS.keys())

_CATEGORY_LOOKUP: Dict[str, AlertCategory] = {}
for cat in VALID_CATEGORIES:
    lower = cat.lower()
    _CATEGORY_LOOKUP[lower] = cat
    _CATEGORY_LOOKUP[lower.replace(" ", "")] = cat
    _CATEGORY_LOOKUP[lower.replace("-", "")] = cat
    _CATEGORY_LOOKUP[lower.replace("_", "")] = cat

_PRIORITY_LOOKUP: Dict[str, AlertPriority] = {}
for prio in VALID_PRIORITIES:
    lower = prio.lower()
    _PRIORITY_LOOKUP[lower] = prio
    _PRIORITY_LOOKUP[lower.replace(" ", "")] = prio

_NULL_LIKE_VALUES = {"", "null", "none", "n/a", "na", "unknown"}


def _sanitize_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        if cleaned.lower() in _NULL_LIKE_VALUES:
            return None
        return cleaned
    cleaned = str(value).strip()
    if not cleaned:
        return None
    if cleaned.lower() in _NULL_LIKE_VALUES:
        return None
    return cleaned


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_category_value(value: Any) -> Optional[AlertCategory]:
    text = _sanitize_text(value)
    if not text:
        return None
    key_variants = {
        text.lower(),
        text.lower().replace(" ", ""),
        text.lower().replace("-", ""),
        text.lower().replace("_", "")
    }
    for key in key_variants:
        if key in _CATEGORY_LOOKUP:
            return _CATEGORY_LOOKUP[key]
    return None


def _normalize_priority_value(value: Any) -> Optional[AlertPriority]:
    text = _sanitize_text(value)
    if not text:
        return None
    key_variants = {text.lower(), text.lower().replace(" ", "")}
    for key in key_variants:
        if key in _PRIORITY_LOOKUP:
            return _PRIORITY_LOOKUP[key]
    return None

def analyze_text_sync(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    location_mentions = []
    from app.services.location_library import find_location_in_text
    library_location = find_location_in_text(text)
    if library_location:
        location_name, _ = library_location
        location_mentions.append(location_name)
        return {"location_mentions": location_mentions}
    bucharest_patterns = [r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)', r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani|politehnica|polytehnica|gara|nord)\b', r'\b(afi\s+)?(?:cotroceni|controceni)\b', r'\b(near|at|by|close\s+to|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', r'\b(sector\s*\d+)\b']
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    if len(match) == 2 and match[0].lower() in ['near', 'at', 'by', 'close to', 'around']:
                        location_text = match[1]
                        lib_match = find_location_in_text(location_text)
                        if lib_match:
                            loc_name, _ = lib_match
                            if loc_name not in location_mentions:
                                location_mentions.append(loc_name)
                        else:
                            location_mentions.append(location_text)
                    else:
                        location_text = " ".join(match)
                        lib_match = find_location_in_text(location_text)
                        if lib_match:
                            loc_name, _ = lib_match
                            if loc_name not in location_mentions:
                                location_mentions.append(loc_name)
                        else:
                            location_mentions.append(location_text)
                else:
                    location = match.strip()
                    if location.lower().startswith('afi'):
                        location = location[3:].strip()
                    lib_match = find_location_in_text(location)
                    if lib_match:
                        loc_name, _ = lib_match
                        if loc_name not in location_mentions:
                            location_mentions.append(loc_name)
                    else:
                        location_mentions.append(location)
    words = text.split()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:').strip()
        if len(word_clean) > 3 and word_clean[0].isupper():
            if i + 1 < len(words):
                next_word = words[i + 1].strip('.,!?;:').strip()
                if next_word and next_word[0].isupper() and len(next_word) > 3:
                    combined = f"{word_clean} {next_word}"
                    lib_match = find_location_in_text(combined)
                    if lib_match:
                        loc_name, _ = lib_match
                        if loc_name not in location_mentions:
                            location_mentions.append(loc_name)
                    else:
                        from app.services.neighborhoods import AREAS
                        for area, keywords in AREAS.items():
                            if any(keyword in combined.lower() for keyword in keywords) or area.lower() in combined.lower():
                                if area not in location_mentions:
                                    location_mentions.append(area)
                                break
    return {"location_mentions": location_mentions}

async def analyze_text_with_ai(text: str, user_lat: Optional[float] = None, user_lng: Optional[float] = None, is_speech: bool = False) -> Dict[str, Any]:
    """
    Analyze text using AI with our prompt template.
    Always tries AI first (uses the prompt template in _analyze_with_google_gemini),
    falls back to local analysis only if AI is unavailable.
    """
    # Always try AI first (this uses our prompt template defined in _analyze_with_google_gemini)
    gemini_api_key = getattr(settings, "gemini_api_key", None)
    if gemini_api_key:
        result = await _analyze_with_google_gemini(text, user_lat, user_lng, gemini_api_key, is_speech=is_speech)
        if result:
            return result
    
    # Fallback to local analysis only if AI is not available
    from app.services.location_library import find_location_in_text
    library_location = find_location_in_text(text)
    location_name = None
    if library_location:
        location_name, _ = library_location
    return await analyze_text(text, location_name)

async def _analyze_with_google_gemini(text: str, user_lat: Optional[float], user_lng: Optional[float], api_key: str, is_speech: bool = False) -> Optional[Dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            speech_instruction = ""
            if is_speech:
                speech_instruction = """
IMPORTANT: This input is from speech recognition. The transcript may contain filler words, repetitions and noise. Please clean and extract the core meaning.
"""
            prompt = dedent(f"""
SYSTEM INSTRUCTIONS:
You are a careful JSON generator for the CityPulse incident reporting platform in Bucharest, Romania. ONLY return valid JSON that matches the schema below. NEVER include Markdown, explanations, code fences or additional text.

USER INPUT:
{speech_instruction}
{text}

USER CONTEXT:
User location (optional): {f'lat: {user_lat}, lng: {user_lng}' if user_lat and user_lng else 'Not provided'}

TASK OVERVIEW:
1. Decide if the text is a valid alert (incident/issue/event happening in Bucharest that community members should know about).
2. If it is valid, extract structured data following the JSON schema.
3. If it is not valid, explain briefly why it is invalid (inside the JSON).

STRICT JSON SCHEMA (keys in snake_case):
{{
    "is_valid_alert": true/false,
    "reason": string | null,
    "title": string | null,
    "description": string | null,
    "category": string | null,
    "priority": string | null,
    "location": {{
        "lat": float | null,
        "lng": float | null,
        "address": string | null
    }},
    "location_hierarchy": {{
        "point": string | null,
        "area": string | null,
        "sector": string | null,
        "city": string | null
    }},
    "location_mentions": [string, ...],
    "contacts": {{
        "phone": string | null,
        "email": string | null,
        "other": string | null
    }}
}}

FIELD REQUIREMENTS:
- "is_valid_alert": boolean ALWAYS present.
- If "is_valid_alert" is false: fill "reason" with a short explanation and set all other fields to null/empty (lists empty).
- If "is_valid_alert" is true:
    * "title": REQUIRED. Write a complete sentence (subject + verb) describing WHAT happened and WHERE. Example: "Fire reported in apartment building on Bulevardul Magheru". Do NOT produce fragments like "In at ...".
    * "category": choose exactly one from: Road, Traffic, Safety, Emergency, Crime, Lost, Weather, Environment, Infrastructure, PublicTransport, Construction, Event, General.
    * "priority": choose exactly one from: Low, Medium, High, Critical.
    * "location.lat" and "location.lng": best-effort floats. Use user location if provided, otherwise infer from text or leave null.
    * "location_hierarchy.area": ONLY neighborhood/area names (e.g., "Herastrau", "Cotroceni"). DO NOT place street names here. Street names belong in "location.address".
    * "location_hierarchy.sector": format "Sector X" when mentioned or inferred.
    * "location_hierarchy.city": should be "Bucharest" when in Bucharest.
    * "location_hierarchy.point": "lat,lng" string if coordinates available, otherwise null.
    * "location_mentions": include every location reference found in the text (strings).
    * "contacts": separate phone/email/other contact info as available (null if missing).
- Trim whitespace; use null (not empty strings) when information is missing.

VALIDATION SUMMARY:
- Produce JSON that strictly follows the schema (order of keys does not matter).
- No markdown/code fences.
- All booleans lower case, null literal for missing fields.
- Title MUST be a full descriptive sentence naming the incident and location.
""")
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.3, "maxOutputTokens": 500}},
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        parts = candidate["content"]["parts"]
                        if len(parts) > 0 and "text" in parts[0]:
                            result_text = parts[0]["text"].strip()
                            result_text = re.sub(r'```json\s*', '', result_text)
                            result_text = re.sub(r'```\s*', '', result_text)
                            result_text = result_text.strip()
                            try:
                                result = json.loads(result_text)
                                
                                return _normalize_ai_result(result)
                            except json.JSONDecodeError:
                                print(f"Failed to parse Gemini JSON: {result_text}")
                                return None
    except Exception as e:
        print(f"Google Gemini API error: {e}")
        return None
    return None

def _normalize_ai_result(raw: Dict[str, Any]) -> Dict[str, Any]:
    is_valid = raw.get("is_valid_alert")
    if isinstance(is_valid, str):
        is_valid = is_valid.strip().lower() in {"true", "1", "yes", "valid", "alert"}
    if is_valid is False:
        reason = _sanitize_text(raw.get("reason")) or "Input does not appear to describe a valid alert."
        return {"is_valid_alert": False, "reason": reason}

    title = _sanitize_text(raw.get("title"))
    if not title:
        return {"is_valid_alert": False, "reason": "AI response missing required title."}
    if len(title) > 60:
        title = title[:60].strip()

    description = _sanitize_text(raw.get("description"))
    if description == title:
        description = None

    category = _normalize_category_value(raw.get("category")) or "General"
    priority = _normalize_priority_value(raw.get("priority")) or "Medium"

    location_dict = raw.get("location") if isinstance(raw.get("location"), dict) else {}
    lat = _to_float(location_dict.get("lat"))
    lng = _to_float(location_dict.get("lng"))
    address = _sanitize_text(location_dict.get("address"))
    location = {"lat": lat, "lng": lng, "address": address}

    area = _sanitize_text(raw.get("area"))
    sector = _sanitize_text(raw.get("sector"))
    location_hierarchy = raw.get("location_hierarchy") if isinstance(raw.get("location_hierarchy"), dict) else {}
    if area and not location_hierarchy.get("area"):
        location_hierarchy["area"] = area
    if sector:
        if not sector.lower().startswith("sector"):
            sector = f"Sector {sector}".strip()
        if not location_hierarchy.get("sector"):
            location_hierarchy["sector"] = sector

    contacts_raw = raw.get("contacts") if isinstance(raw.get("contacts"), dict) else {}
    phone = _sanitize_text(contacts_raw.get("phone") or raw.get("phone"))
    email = _sanitize_text(contacts_raw.get("email") or raw.get("email"))
    other_contact = _sanitize_text(
        contacts_raw.get("other")
        or contacts_raw.get("other_contact")
        or raw.get("other_contact")
        or raw.get("other")
    )
    contacts = {"phone": phone, "email": email, "other": other_contact}

    raw_suggestions = raw.get("suggestions")
    suggestions: list[str] = []
    if isinstance(raw_suggestions, list):
        for item in raw_suggestions:
            text = _sanitize_text(item)
            if text:
                suggestions.append(text)
    elif isinstance(raw_suggestions, str):
        text = _sanitize_text(raw_suggestions)
        if text:
            suggestions.append(text)
    if not suggestions:
        suggestions = _generate_suggestions(category, priority)

    raw_mentions = raw.get("location_mentions")
    location_mentions: list[str] = []
    if isinstance(raw_mentions, list):
        for item in raw_mentions:
            text = _sanitize_text(item)
            if text:
                location_mentions.append(text)
    elif isinstance(raw_mentions, str):
        text = _sanitize_text(raw_mentions)
        if text:
            location_mentions.append(text)

    normalized: Dict[str, Any] = {
        "is_valid_alert": True,
        "reason": None,
        "title": title,
        "description": description,
        "category": category,
        "priority": priority,
        "location": location,
        "area": area,
        "sector": sector,
        "location_hierarchy": location_hierarchy,
        "location_mentions": location_mentions,
        "contacts": contacts,
        "phone": phone,
        "email": email,
        "other_contact": other_contact,
        "suggestions": suggestions,
        "neighborhood": area,
        "area_type": "area" if area else ("sector" if sector else None),
    }

    if lat is not None and lng is not None:
        location_hierarchy.setdefault("point", f"{lat},{lng}")
    if (area or sector) and not location_hierarchy.get("city"):
        location_hierarchy["city"] = "Bucharest"

    return normalized

async def analyze_text(text: str, location: Optional[str] = None) -> Dict[str, Any]:
    text_lower = text.lower()
    from app.services.location_library import find_location_in_text
    matched_location = None
    matched_location_data = None
    library_location = find_location_in_text(text)
    if library_location:
        matched_location, matched_location_data = library_location
    category = "General"
    max_matches = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > max_matches:
            max_matches = matches
            category = cat
    priority = "Medium"
    for prio, keywords in PRIORITY_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            priority = prio
            break
    title = None
    from app.services.title_extractor import extract_title_from_text
    title = extract_title_from_text(text, category)
    if not title:
        from app.services.ai_title_generator import generate_title
        title = await generate_title(text, category, priority, matched_location or location)
    description = text.strip() if text.strip() != title else None
    location_mentions = []
    if matched_location:
        location_mentions.append(matched_location)
    bucharest_patterns = [r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)', r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani|politehnica|polytehnica|gara|nord)\b', r'\b(afi\s+)?(?:cotroceni|controceni)\b', r'\b(near|at|by|close\s+to|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', r'\b(sector\s*\d+)\b']
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    if len(match) == 2 and match[0].lower() in ['near', 'at', 'by', 'close to', 'around']:
                        location_text = match[1]
                        lib_match = find_location_in_text(location_text)
                        if lib_match:
                            loc_name, _ = lib_match
                            if loc_name not in location_mentions:
                                location_mentions.append(loc_name)
                        else:
                            location_mentions.append(location_text)
                    else:
                        location_text = " ".join(match)
                        lib_match = find_location_in_text(location_text)
                        if lib_match:
                            loc_name, _ = lib_match
                            if loc_name not in location_mentions:
                                location_mentions.append(loc_name)
                        else:
                            location_mentions.append(location_text)
                else:
                    location = match.strip()
                    if location.lower().startswith('afi'):
                        location = location[3:].strip()
                    lib_match = find_location_in_text(location)
                    if lib_match:
                        loc_name, _ = lib_match
                        if loc_name not in location_mentions:
                            location_mentions.append(loc_name)
                    else:
                        location_mentions.append(location)
    words = text.split()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:').strip()
        if len(word_clean) > 3 and word_clean[0].isupper():
            if i + 1 < len(words):
                next_word = words[i + 1].strip('.,!?;:').strip()
                if next_word and next_word[0].isupper() and len(next_word) > 3:
                    combined = f"{word_clean} {next_word}"
                    lib_match = find_location_in_text(combined)
                    if lib_match:
                        loc_name, _ = lib_match
                        if loc_name not in location_mentions:
                            location_mentions.append(loc_name)
                    else:
                        from app.services.neighborhoods import AREAS
                        for area, keywords in AREAS.items():
                            if any(keyword in combined.lower() for keyword in keywords) or area.lower() in combined.lower():
                                if area not in location_mentions:
                                    location_mentions.append(area)
                                break
    phone = None
    email = None
    other_contact = None
    phone_patterns = [r'\b\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b', r'\b(?:\+40|0040|0)?[2-7]\d{8,9}\b', r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b']
    for pattern in phone_patterns:
        for phone_match in re.finditer(pattern, text):
            phone_candidate = phone_match.group().strip()
            digits_only = re.sub(r'\D', '', phone_candidate)
            if 7 <= len(digits_only) <= 15:
                phone = phone_candidate
                break
        if phone:
            break
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text, re.IGNORECASE)
    if email_match:
        email = email_match.group().strip()
    whatsapp_patterns = [r'\b(?:whatsapp|contact\s+me\s+on\s+whatsapp|reach\s+me\s+on\s+whatsapp)\s+(?:by|at|via)?\s*([+]?[\d\-\.\s]+)\b', r'\b(whatsapp|telegram|signal|viber|messenger|discord)\s*:?\s*([+]?[\d\-\.\s]+|[A-Za-z0-9@._+-]+)', r'\b(contact|reach|call|text|message)\s+(?:me\s+)?(?:at|on|by)?\s*([+]?[\d\-\.\s]+)\b']
    for pattern in whatsapp_patterns:
        other_match = re.search(pattern, text, re.IGNORECASE)
        if other_match:
            if len(other_match.groups()) > 0:
                contact_info = other_match.group(len(other_match.groups())).strip()
                if re.match(r'[+]?\d', contact_info):
                    other_contact = f"WhatsApp: {contact_info}"
                else:
                    other_contact = contact_info
                break
    if phone and not other_contact and 'whatsapp' in text_lower:
        other_contact = f"WhatsApp: {phone}"

    description = text.strip() if text.strip() != title else None

    raw_result: Dict[str, Any] = {
        "is_valid_alert": True,
        "title": title or text.strip()[:60],
        "description": description,
        "category": category,
        "priority": priority,
        "location": {
            "lat": matched_location_data.get("lat") if matched_location_data else None,
            "lng": matched_location_data.get("lng") if matched_location_data else None,
            "address": matched_location_data.get("address") if matched_location_data else None,
        },
        "area": matched_location_data.get("area") if matched_location_data and matched_location_data.get("area") else matched_location,
        "sector": matched_location_data.get("sector") if matched_location_data else None,
        "location_mentions": location_mentions,
        "contacts": {
            "phone": phone,
            "email": email,
            "other": other_contact,
        },
        "phone": phone,
        "email": email,
        "other_contact": other_contact,
        "suggestions": _generate_suggestions(category, priority),
    }

    return _normalize_ai_result(raw_result)

def _generate_suggestions(category: AlertCategory, priority: AlertPriority) -> list[str]:
    suggestions = []
    if category == "Road":
        suggestions.append("Consider alternative routes if possible")
        if priority in ["High", "Critical"]:
            suggestions.append("Avoid the area if not necessary")
    if category == "Traffic":
        suggestions.append("Plan extra time for your journey")
        suggestions.append("Check traffic apps for alternative routes")
    if category == "Safety":
        suggestions.append("Stay alert and report to authorities if needed")
        if priority == "Critical":
            suggestions.append("Contact emergency services immediately")
    if category == "Emergency":
        suggestions.append("Contact emergency services: 112")
        if priority == "Critical":
            suggestions.append("Evacuate if necessary and stay safe")
    if category == "Crime":
        suggestions.append("Report to police: 112")
        suggestions.append("Do not approach suspects")
    if category == "Lost":
        suggestions.append("Check with local authorities and community centers")
        suggestions.append("Share on social media for wider reach")
    if category == "Weather":
        suggestions.append("Check weather updates regularly")
        if priority in ["High", "Critical"]:
            suggestions.append("Stay indoors if possible")
        suggestions.append("Dress appropriately for conditions")
    if category == "Environment":
        suggestions.append("Avoid the area if possible")
        if "smoke" in category.lower():
            suggestions.append("Close windows and stay indoors")
    if category == "Infrastructure":
        suggestions.append("Check with utility companies for updates")
        suggestions.append("Have backup plans ready")
    if category == "PublicTransport":
        suggestions.append("Check transport authority updates")
        suggestions.append("Consider alternative routes or transport")
    if category == "Construction":
        suggestions.append("Expect delays in the area")
        suggestions.append("Follow detour signs")
    if category == "Event":
        suggestions.append("Expect increased traffic and crowds")
        suggestions.append("Plan parking in advance")
    return suggestions
