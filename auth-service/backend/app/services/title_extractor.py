"""
Title Extractor - Pattern-based title generation without AI
"""
import re
from typing import Optional, Dict
from app.services.location_library import find_location_in_text

EVENT_PATTERNS = {
    "hackathon": ["hackathon", "hack", "coding competition"],
    "fair": ["fair", "book fair", "book sale", "exhibition"],
    "concert": ["concert", "live music", "performance"],
    "festival": ["festival", "celebration"],
    "workshop": ["workshop", "seminar", "training"],
    "meetup": ["meetup", "meeting", "gathering"],
    "sale": ["sale", "discount", "promotion"],
    "event": ["event", "happening", "activity"],
}

LOCATION_PATTERNS = {
    "politehnica": "UPB",
    "polytehnica": "UPB",
    "upb": "UPB",
    "afi": "AFI",
    "cotroceni": "Cotroceni",
    "carturesti": "Carturesti",
    "carusel": "Carusel",
    "herastrau": "Herastrau",
    "cismigiu": "Cismigiu",
    "unirii": "Unirii",
    "victoriei": "Victoriei",
    "magheru": "Magheru",
    "lipscani": "Lipscani",
    "gara": "Gara",
    "nord": "Nord",
}

def extract_title_from_text(text: str, category: str = "General") -> Optional[str]:
    if not text or len(text.strip()) == 0:
        return None
    text_lower = text.lower()
    text_original = text.strip()
    event_type = None
    for event_name, keywords in EVENT_PATTERNS.items():
        for keyword in keywords:
            if keyword in text_lower:
                event_type = event_name.title()
                break
        if event_type:
            break
    location = None
    location_match = find_location_in_text(text)
    if location_match:
        location_name, _ = location_match
        location = location_name
    if event_type and location:
        if location == "Politehnica":
            location_display = "UPB"
        else:
            location_display = location
        if event_type.lower() in ["hackathon", "workshop", "meetup", "seminar"]:
            title = f"{event_type} at {location_display}"
        else:
            title = f"{event_type} at {location_display}"
        for pattern, replacement in LOCATION_PATTERNS.items():
            title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
        if title:
            title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
        if len(title) <= 60:
            return title
    if event_type:
        words = text_original.split()
        event_index = -1
        for i, word in enumerate(words):
            if any(keyword in word.lower() for keyword in EVENT_PATTERNS.get(event_type.lower(), [])):
                event_index = i
                break
        if event_index >= 0:
            start = max(0, event_index - 2)
            end = min(len(words), event_index + 4)
            title_parts = words[start:end]
            title = " ".join(title_parts)
            for pattern, replacement in LOCATION_PATTERNS.items():
                title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
            if title:
                title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
            if len(title) <= 60:
                return title
    if location:
        action_patterns = [r'(ongoing|happening|taking place|at|in)\s+', r'(holds?|hosts?|organizes?)\s+', r'(with|featuring|including)\s+']
        simple_pattern = re.search(r'(\w+(?:\s+\w+){0,3})\s+(?:in|at|near)\s+' + re.escape(location.lower()), text_lower)
        if simple_pattern:
            event_text = simple_pattern.group(1).strip()
            if event_text and len(event_text) > 2:
                event_words = event_text.split()
                event_capitalized = ' '.join(word.capitalize() for word in event_words)
                title = f"{event_capitalized} at {location}"
                for pattern, replacement in LOCATION_PATTERNS.items():
                    title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
                if len(title) <= 60:
                    return title
        for pattern in action_patterns:
            match = re.search(pattern + r'(.{0,40})', text_lower)
            if match:
                context = match.group(1).strip()
                if context:
                    context = re.sub(r'[^\w\s]', '', context)
                    words = context.split()[:5]
                    if words:
                        title = f"{' '.join(words).title()} at {location}"
                        for pattern, replacement in LOCATION_PATTERNS.items():
                            title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
                        if len(title) <= 60:
                            return title
    if category == "Event":
        sentences = text_original.split('.')
        if sentences:
            first_sentence = sentences[0].strip()
            if len(first_sentence) <= 60:
                for pattern, replacement in LOCATION_PATTERNS.items():
                    first_sentence = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, first_sentence, flags=re.IGNORECASE)
                return first_sentence
    return None

def improve_title_capitalization(title: str) -> str:
    if not title:
        return title
    for pattern, replacement in LOCATION_PATTERNS.items():
        title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
    return title
