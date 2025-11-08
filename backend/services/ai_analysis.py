"""
AI Analysis service to extract structured data from user text
Uses AI (OpenAI/Gemini) to extract structured alert data matching MongoDB schema
"""
import re
import json
import httpx
from typing import Dict, Any, Optional
from models.alert import AlertCategory, AlertPriority
from db import settings

# Category keywords
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

# Priority keywords
PRIORITY_KEYWORDS: Dict[AlertPriority, list] = {
    "Critical": ["emergency", "urgent", "critical", "immediate", "now", "asap", "help", "911"],
    "High": ["serious", "important", "dangerous", "hazard", "warning", "caution"],
    "Medium": [],
    "Low": ["minor", "small", "info", "update", "notice"]
}

def analyze_text_sync(text: str) -> Dict[str, Any]:
    """
    Synchronous version for quick location extraction
    Extracts only location mentions without AI title generation
    Uses the same improved patterns as analyze_text
    """
    text_lower = text.lower()
    
    # Extract location mentions (improved pattern matching - same as analyze_text)
    location_mentions = []
    # Common Bucharest location patterns - expanded to catch more locations
    bucharest_patterns = [
        r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)',  # Street names
        r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani|politehnica|gara|nord)\b',  # Common places
        r'\b(afi\s+)?(?:cotroceni|controceni)\b',  # AFI Cotroceni (case-insensitive, handles typos like "controceni")
        r'\b(near|at|by|close\s+to|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # "near X" or "at X" patterns
        r'\b(sector\s*\d+)\b',  # Sector numbers
    ]
    
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Convert tuples to strings
            for match in matches:
                if isinstance(match, tuple):
                    # For "near X" patterns, extract the location part
                    if len(match) == 2 and match[0].lower() in ['near', 'at', 'by', 'close to', 'around']:
                        location_mentions.append(match[1])
                    else:
                        location_mentions.append(" ".join(match))
                else:
                    # Clean up common prefixes
                    location = match.strip()
                    # Remove "afi" prefix if present (for AFI Cotroceni)
                    if location.lower().startswith('afi'):
                        location = location[3:].strip()
                    location_mentions.append(location)
    
    # Also check for capitalized words that might be locations (like "Afi", "Controceni")
    words = text.split()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:').strip()
        # Check if it's a known location (capitalized, longer than 3 chars)
        if len(word_clean) > 3 and word_clean[0].isupper():
            # Check if next word is also capitalized (like "Afi Controceni")
            if i + 1 < len(words):
                next_word = words[i + 1].strip('.,!?;:').strip()
                if next_word[0].isupper() and len(next_word) > 3:
                    combined = f"{word_clean} {next_word}"
                    # Check against known locations
                    from services.neighborhoods import AREAS
                    for area, keywords in AREAS.items():
                        if any(keyword in combined.lower() for keyword in keywords) or area.lower() in combined.lower():
                            location_mentions.append(area)
                            break
    
    return {
        "location_mentions": location_mentions
    }

async def analyze_text_with_ai(text: str, user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> Dict[str, Any]:
    """
    Use AI (OpenAI/Gemini) to extract structured alert data from user text
    Returns structured data matching MongoDB schema
    """
    # Try Google Gemini API first (preferred)
    google_api_key = getattr(settings, "google_api_key", None)
    if google_api_key:
        result = await _analyze_with_google_gemini(text, user_lat, user_lng, google_api_key)
        if result:
            return result
    
    # Try OpenAI API as fallback
    openai_api_key = getattr(settings, "openai_api_key", None)
    if openai_api_key:
        result = await _analyze_with_openai(text, user_lat, user_lng, openai_api_key)
        if result:
            return result
    
    # Fallback to keyword-based analysis
    return await analyze_text(text, None)

async def _analyze_with_google_gemini(
    text: str,
    user_lat: Optional[float],
    user_lng: Optional[float],
    api_key: str
) -> Optional[Dict[str, Any]]:
    """Extract structured alert data using Google Gemini API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            prompt = f"""Analyze this user alert text and extract structured data in JSON format. The alert is from Bucharest, Romania.

User text: "{text}"
User location (optional): {f"lat: {user_lat}, lng: {user_lng}" if user_lat and user_lng else "Not provided"}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
{{
    "title": "A concise, informative title (max 60 chars)",
    "description": "Full description or null if same as title",
    "category": "One of: Road, Safety, Lost, Weather, Emergency, Event, Infrastructure, Environment, Traffic, Crime, PublicTransport, Construction, General",
    "priority": "One of: Low, Medium, High, Critical",
    "location_mentions": ["List of location names mentioned in text"],
    "phone": "Phone number if mentioned, else null",
    "email": "Email if mentioned, else null",
    "other_contact": "Other contact info (WhatsApp, Telegram, etc.) if mentioned, else null"
}}

Guidelines:
- Extract category based on content (e.g., "accident" -> Road, "lost dog" -> Lost, "fire" -> Emergency)
- Determine priority from urgency indicators (e.g., "urgent", "emergency" -> Critical)
- Extract all location mentions (streets, areas, neighborhoods, sectors)
- Extract contact information if present
- Title should be concise and informative
- Description should be the full text if different from title, else null
- Return ONLY the JSON object, nothing else"""

            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 500,
                        "topP": 0.8,
                        "topK": 40
                    }
                },
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
                            # Remove markdown code blocks if present
                            result_text = re.sub(r'```json\s*', '', result_text)
                            result_text = re.sub(r'```\s*', '', result_text)
                            result_text = result_text.strip()
                            
                            try:
                                result = json.loads(result_text)
                                # Validate and normalize
                                return _normalize_ai_result(result)
                            except json.JSONDecodeError:
                                print(f"Failed to parse Gemini JSON: {result_text}")
                                return None
    except Exception as e:
        print(f"Google Gemini API error: {e}")
        return None
    
    return None

async def _analyze_with_openai(
    text: str,
    user_lat: Optional[float],
    user_lng: Optional[float],
    api_key: str
) -> Optional[Dict[str, Any]]:
    """Extract structured alert data using OpenAI API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            prompt = f"""Analyze this user alert text and extract structured data in JSON format. The alert is from Bucharest, Romania.

User text: "{text}"
User location (optional): {f"lat: {user_lat}, lng: {user_lng}" if user_lat and user_lng else "Not provided"}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
{{
    "title": "A concise, informative title (max 60 chars)",
    "description": "Full description or null if same as title",
    "category": "One of: Road, Safety, Lost, Weather, Emergency, Event, Infrastructure, Environment, Traffic, Crime, PublicTransport, Construction, General",
    "priority": "One of: Low, Medium, High, Critical",
    "location_mentions": ["List of location names mentioned in text"],
    "phone": "Phone number if mentioned, else null",
    "email": "Email if mentioned, else null",
    "other_contact": "Other contact info (WhatsApp, Telegram, etc.) if mentioned, else null"
}}

Guidelines:
- Extract category based on content (e.g., "accident" -> Road, "lost dog" -> Lost, "fire" -> Emergency)
- Determine priority from urgency indicators (e.g., "urgent", "emergency" -> Critical)
- Extract all location mentions (streets, areas, neighborhoods, sectors)
- Extract contact information if present
- Title should be concise and informative
- Description should be the full text if different from title, else null
- Return ONLY the JSON object, nothing else"""

            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that extracts structured data from user alerts. Always return valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    result_text = data["choices"][0]["message"]["content"].strip()
                    # Remove markdown code blocks if present
                    result_text = re.sub(r'```json\s*', '', result_text)
                    result_text = re.sub(r'```\s*', '', result_text)
                    result_text = result_text.strip()
                    
                    try:
                        result = json.loads(result_text)
                        # Validate and normalize
                        return _normalize_ai_result(result)
                    except json.JSONDecodeError:
                        print(f"Failed to parse OpenAI JSON: {result_text}")
                        return None
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None
    
    return None

def _normalize_ai_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and validate AI extraction result"""
    # Validate category
    valid_categories = ["Road", "Safety", "Lost", "Weather", "Emergency", "Event", "Infrastructure", "Environment", "Traffic", "Crime", "PublicTransport", "Construction", "General"]
    category = result.get("category", "General")
    if category not in valid_categories:
        category = "General"
    
    # Validate priority
    valid_priorities = ["Low", "Medium", "High", "Critical"]
    priority = result.get("priority", "Medium")
    if priority not in valid_priorities:
        priority = "Medium"
    
    # Normalize title
    title = result.get("title", "").strip()
    if len(title) > 60:
        title = title[:57] + "..."
    
    # Normalize description
    description = result.get("description")
    if description:
        description = description.strip()
        if description == title or not description:
            description = None
    
    # Normalize location_mentions
    location_mentions = result.get("location_mentions", [])
    if not isinstance(location_mentions, list):
        location_mentions = []
    
    # Normalize contact info
    phone = result.get("phone")
    if phone and phone.lower() in ["null", "none", ""]:
        phone = None
    
    email = result.get("email")
    if email and email.lower() in ["null", "none", ""]:
        email = None
    
    other_contact = result.get("other_contact")
    if other_contact and other_contact.lower() in ["null", "none", ""]:
        other_contact = None
    
    # Generate suggestions based on category and priority
    suggestions = _generate_suggestions(category, priority)
    
    return {
        "category": category,
        "priority": priority,
        "title": title,
        "description": description,
        "location_mentions": location_mentions,
        "suggestions": suggestions,
        "phone": phone,
        "email": email,
        "other_contact": other_contact
    }

async def analyze_text(text: str, location: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze user text to extract:
    - Category
    - Priority
    - Title (using AI if available)
    - Description
    - Location mentions
    """
    text_lower = text.lower()
    
    # Extract category
    category = "General"
    max_matches = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > max_matches:
            max_matches = matches
            category = cat
    
    # Weather stays in Weather category
    
    # Extract priority
    priority = "Medium"
    for prio, keywords in PRIORITY_KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            priority = prio
            break
    
    # Generate title using AI (with fallback to smart keyword-based)
    from services.ai_title_generator import generate_title
    title = await generate_title(text, category, priority, location)
    
    # Description is the full text
    description = text.strip() if text.strip() != title else None
    
    # Extract location mentions (improved pattern matching - same as analyze_text_sync)
    location_mentions = []
    # Common Bucharest location patterns - expanded to catch more locations
    bucharest_patterns = [
        r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)',  # Street names
        r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani|politehnica|gara|nord)\b',  # Common places
        r'\b(afi\s+)?(?:cotroceni|controceni)\b',  # AFI Cotroceni (case-insensitive, handles typos like "controceni")
        r'\b(near|at|by|close\s+to|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # "near X" or "at X" patterns
        r'\b(sector\s*\d+)\b',  # Sector numbers
    ]
    
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Convert tuples to strings
            for match in matches:
                if isinstance(match, tuple):
                    # For "near X" patterns, extract the location part
                    if len(match) == 2 and match[0].lower() in ['near', 'at', 'by', 'close to', 'around']:
                        location_mentions.append(match[1])
                    else:
                        location_mentions.append(" ".join(match))
                else:
                    # Clean up common prefixes
                    location = match.strip()
                    # Remove "afi" prefix if present (for AFI Cotroceni)
                    if location.lower().startswith('afi'):
                        location = location[3:].strip()
                    location_mentions.append(location)
    
    # Also check for capitalized words that might be locations (like "Afi", "Controceni")
    words = text.split()
    for i, word in enumerate(words):
        word_clean = word.strip('.,!?;:').strip()
        # Check if it's a known location (capitalized, longer than 3 chars)
        if len(word_clean) > 3 and word_clean[0].isupper():
            # Check if next word is also capitalized (like "Afi Controceni")
            if i + 1 < len(words):
                next_word = words[i + 1].strip('.,!?;:').strip()
                if next_word[0].isupper() and len(next_word) > 3:
                    combined = f"{word_clean} {next_word}"
                    # Check against known locations
                    from services.neighborhoods import AREAS
                    for area, keywords in AREAS.items():
                        if any(keyword in combined.lower() for keyword in keywords) or area.lower() in combined.lower():
                            location_mentions.append(area)
                            break
    
    # Extract contact information
    phone = None
    email = None
    other_contact = None
    
    # Phone number patterns (Romanian and international formats) - improved
    phone_patterns = [
        r'\b\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b',  # International format (catches +380645455454)
        r'\b(?:\+40|0040|0)?[2-7]\d{8,9}\b',  # Romanian phone numbers
        r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',  # International format
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # US format
    ]
    
    for pattern in phone_patterns:
        phone_matches = re.finditer(pattern, text)
        for phone_match in phone_matches:
            phone_candidate = phone_match.group().strip()
            # Filter out numbers that are too short or too long (likely not phone numbers)
            digits_only = re.sub(r'\D', '', phone_candidate)
            if 7 <= len(digits_only) <= 15:  # Valid phone number length
                phone = phone_candidate
                break
        if phone:
            break
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text, re.IGNORECASE)
    if email_match:
        email = email_match.group().strip()
    
    # Other contact information (WhatsApp, Telegram, etc.) - improved
    # Check for "whatsapp by +380645455454" or "contact me on whatsapp by +380645455454"
    whatsapp_patterns = [
        r'\b(?:whatsapp|contact\s+me\s+on\s+whatsapp|reach\s+me\s+on\s+whatsapp)\s+(?:by|at|via)?\s*([+]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})\b',
        r'\b(whatsapp|telegram|signal|viber|messenger|discord)\s*:?\s*([+]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}|[A-Za-z0-9@._+-]+)',
        r'\b(contact|reach|call|text|message)\s+(?:me\s+)?(?:at|on|by)?\s*([+]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})\b',
    ]
    
    for pattern in whatsapp_patterns:
        other_match = re.search(pattern, text, re.IGNORECASE)
        if other_match:
            # Extract the contact info part
            if len(other_match.groups()) > 0:
                contact_info = other_match.group(len(other_match.groups())).strip()
                # If it's a phone number, use it as other_contact (WhatsApp)
                if re.match(r'[+]?\d', contact_info):
                    other_contact = f"WhatsApp: {contact_info}"
                else:
                    other_contact = contact_info
                break
    
    # If we found a phone but no other_contact, and text mentions WhatsApp, set it
    if phone and not other_contact and 'whatsapp' in text_lower:
        other_contact = f"WhatsApp: {phone}"
    
    # Generate title using AI (with fallback to smart keyword-based)
    from services.ai_title_generator import generate_title
    title = await generate_title(text, category, priority, location)
    
    # Description is the full text if different from title
    description = text.strip() if text.strip() != title else None
    
    return {
        "category": category,
        "priority": priority,
        "title": title,
        "description": description,
        "location_mentions": location_mentions,
        "suggestions": _generate_suggestions(category, priority),
        "phone": phone,
        "email": email,
        "other_contact": other_contact
    }

def _generate_suggestions(category: AlertCategory, priority: AlertPriority) -> list[str]:
    """Generate helpful suggestions based on category and priority"""
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

