"""
AI Analysis service to extract structured data from user text
"""
import re
import json
import httpx
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
    if is_speech:
        gemini_api_key = getattr(settings, "gemini_api_key", None)
        if gemini_api_key:
            result = await _analyze_with_google_gemini(text, user_lat, user_lng, gemini_api_key, is_speech=True)
            if result:
                return result
        from app.services.location_library import find_location_in_text
        library_location = find_location_in_text(text)
        location_name = None
        if library_location:
            location_name, _ = library_location
        return await analyze_text(text, location_name)
    from app.services.location_library import find_location_in_text
    from app.services.title_extractor import extract_title_from_text
    library_location = find_location_in_text(text)
    library_title = extract_title_from_text(text)
    if library_location and library_title:
        location_name, _ = library_location
        return await analyze_text(text, location_name)
    gemini_api_key = getattr(settings, "gemini_api_key", None)
    if gemini_api_key:
        result = await _analyze_with_google_gemini(text, user_lat, user_lng, gemini_api_key, is_speech=False)
        if result:
            return result
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
            prompt = f"""Analyze this user alert text and extract structured data in JSON format. The alert is from Bucharest, Romania.\n{speech_instruction}\nUser text: \"{text}\"\nUser location (optional): {f'lat: {user_lat}, lng: {user_lng}' if user_lat and user_lng else 'Not provided'}\n\nExtract the following information and return ONLY valid JSON (no markdown, no code blocks):\n{{\n    \"title\": \"A concise, informative title (max 60 chars) - IMPROVE WORDING\",\n    \"description\": \"Full description or null if same as title\",\n    \"category\": \"One of: Road, Safety, Lost, Weather, Emergency, Event, Infrastructure, Environment, Traffic, Crime, PublicTransport, Construction, General\",\n    \"priority\": \"One of: Low, Medium, High, Critical\",\n    \"location_mentions\": [\"List of location names mentioned in text\"],\n    \"area\": \"Specific area/neighborhood name if mentioned\",\n    \"sector\": \"Sector number if mentioned or inferred\",\n    \"phone\": \"Phone number if mentioned, else null\",\n    \"email\": \"Email if mentioned, else null\",\n    \"other_contact\": \"Other contact info if mentioned, else null\"\n}}\n\nReturn only the JSON object, nothing else"""
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

def _normalize_ai_result(result: Dict[str, Any]) -> Dict[str, Any]:
    valid_categories = ["Road", "Safety", "Lost", "Weather", "Emergency", "Event", "Infrastructure", "Environment", "Traffic", "Crime", "PublicTransport", "Construction", "General"]
    category = result.get("category", "General")
    if category not in valid_categories:
        category = "General"
    valid_priorities = ["Low", "Medium", "High", "Critical"]
    priority = result.get("priority", "Medium")
    if priority not in valid_priorities:
        priority = "Medium"
    title = result.get("title", "").strip()
    if len(title) > 60:
        title = title[:57] + "..."
    description = result.get("description")
    if description:
        description = description.strip()
        if description == title or not description:
            description = None
    location_mentions = result.get("location_mentions", [])
    if not isinstance(location_mentions, list):
        location_mentions = []
    area = result.get("area")
    if area and isinstance(area, str) and area.lower() in ["null", "none", ""]:
        area = None
    sector = result.get("sector")
    if sector and isinstance(sector, str) and sector.lower() in ["null", "none", ""]:
        sector = None
    phone = result.get("phone")
    if phone and isinstance(phone, str) and phone.lower() in ["null", "none", ""]:
        phone = None
    email = result.get("email")
    if email and isinstance(email, str) and email.lower() in ["null", "none", ""]:
        email = None
    other_contact = result.get("other_contact")
    if other_contact and isinstance(other_contact, str) and other_contact.lower() in ["null", "none", ""]:
        other_contact = None
    suggestions = _generate_suggestions(category, priority)
    return {"category": category, "priority": priority, "title": title, "description": description, "location_mentions": location_mentions, "area": area, "sector": sector, "suggestions": suggestions, "phone": phone, "email": email, "other_contact": other_contact}

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
    return {"category": category, "priority": priority, "title": title, "description": description, "location_mentions": location_mentions, "suggestions": _generate_suggestions(category, priority), "phone": phone, "email": email, "other_contact": other_contact}

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
