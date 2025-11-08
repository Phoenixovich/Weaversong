"""
AI Analysis service to extract structured data from user text
Currently uses keyword-based analysis - can be replaced with actual AI service
"""
import re
from typing import Dict, Any
from models.alert import AlertCategory, AlertPriority

# Category keywords
CATEGORY_KEYWORDS: Dict[AlertCategory, list] = {
    "Road": ["accident", "crash", "collision", "pothole", "road damage", "road hazard"],
    "Traffic": ["traffic", "jam", "congestion", "heavy traffic", "slow traffic", "standstill"],
    "Safety": ["suspicious", "danger", "unsafe", "threat", "warning", "caution", "hazard", "ice", "slippery", "dangerous"],
    "Emergency": ["emergency", "fire", "ambulance", "medical", "urgent", "911", "help needed", "rescue"],
    "Crime": ["crime", "theft", "robbery", "vandalism", "break-in", "stolen", "police", "arrest"],
    "Lost": ["lost", "missing", "found", "pet", "dog", "cat", "child", "person", "item", "belongings"],
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

def analyze_text(text: str) -> Dict[str, Any]:
    """
    Analyze user text to extract:
    - Category
    - Priority
    - Title
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
    
    # Extract title (first sentence or first 50 chars)
    lines = text.strip().split('\n')
    first_line = lines[0].strip()
    title = first_line[:50] if len(first_line) > 50 else first_line
    if not title:
        title = "Community Alert"
    
    # Description is the full text
    description = text.strip() if text.strip() != title else None
    
    # Extract location mentions (simple pattern matching)
    location_mentions = []
    # Common Bucharest location patterns
    bucharest_patterns = [
        r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)',
        r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani)\b',
    ]
    
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Convert tuples to strings
            for match in matches:
                if isinstance(match, tuple):
                    location_mentions.append(" ".join(match))
                else:
                    location_mentions.append(match)
    
    # Extract contact information
    phone = None
    email = None
    other_contact = None
    
    # Phone number patterns (Romanian and international formats)
    phone_patterns = [
        r'\b(?:\+40|0040|0)?[2-7]\d{8,9}\b',  # Romanian phone numbers
        r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',  # International format
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # US format
    ]
    
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            phone = phone_match.group().strip()
            break
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text, re.IGNORECASE)
    if email_match:
        email = email_match.group().strip()
    
    # Other contact information (WhatsApp, Telegram, etc.)
    other_patterns = [
        r'\b(whatsapp|telegram|signal|viber|messenger|discord)\s*:?\s*([A-Za-z0-9@._+-]+)',
        r'\b(contact|reach|call|text|message)\s+(?:me\s+at\s+)?([A-Za-z0-9@._+\s-]+)',
    ]
    
    for pattern in other_patterns:
        other_match = re.search(pattern, text, re.IGNORECASE)
        if other_match:
            # Extract the contact info part
            if len(other_match.groups()) > 1:
                other_contact = other_match.group(2).strip()
            else:
                other_contact = other_match.group().strip()
            break
    
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

