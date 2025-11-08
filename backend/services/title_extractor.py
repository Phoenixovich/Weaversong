"""
Title Extractor - Pattern-based title generation without AI
Extracts titles from user input using keyword patterns and common phrases
"""
import re
from typing import Optional, Dict

# Common event/activity patterns
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

# Common location patterns that should be capitalized properly
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
    """
    Extract a title from user input using pattern matching
    Returns a concise title (max 60 chars) or None if patterns don't match
    """
    if not text or len(text.strip()) == 0:
        return None
    
    text_lower = text.lower()
    text_original = text.strip()
    
    # Try to extract event type
    event_type = None
    for event_name, keywords in EVENT_PATTERNS.items():
        for keyword in keywords:
            if keyword in text_lower:
                event_type = event_name.title()
                break
        if event_type:
            break
    
    # Try to extract location
    location = None
    from services.location_library import find_location_in_text
    location_match = find_location_in_text(text)
    if location_match:
        location_name, _ = location_match
        location = location_name
    
    # If we found both event and location, create a structured title
    if event_type and location:
        # Format: "EventType at Location" or "EventType in Location"
        # Special handling for Politehnica -> UPB
        if location == "Politehnica":
            location_display = "UPB"
        else:
            location_display = location
        
        # For hackathon/workshop, use "at" preposition
        if event_type.lower() in ["hackathon", "workshop", "meetup", "seminar"]:
            title = f"{event_type} at {location_display}"
        elif event_type.lower() in ["fair", "sale", "exhibition"]:
            title = f"{event_type} at {location_display}"
        else:
            title = f"{event_type} at {location_display}"
        
        # Apply location capitalization fixes
        for pattern, replacement in LOCATION_PATTERNS.items():
            title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
        
        # Capitalize first letter
        if title:
            title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
        
        if len(title) <= 60:
            return title
    
    # If we found just event type, try to create title with context
    if event_type:
        # Try to extract a short phrase around the event
        words = text_original.split()
        event_index = -1
        for i, word in enumerate(words):
            if any(keyword in word.lower() for keyword in EVENT_PATTERNS.get(event_type.lower(), [])):
                event_index = i
                break
        
        if event_index >= 0:
            # Take 3-5 words around the event
            start = max(0, event_index - 2)
            end = min(len(words), event_index + 4)
            title_parts = words[start:end]
            title = " ".join(title_parts)
            
            # Apply location capitalization
            for pattern, replacement in LOCATION_PATTERNS.items():
                title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
            
            # Capitalize first letter
            if title:
                title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
            
            if len(title) <= 60:
                return title
    
    # If we found just location, try to extract what's happening
    if location:
        # Look for action verbs or common phrases
        action_patterns = [
            r'(ongoing|happening|taking place|at|in)\s+',
            r'(holds?|hosts?|organizes?)\s+',
            r'(with|featuring|including)\s+',
        ]
        
        # Also check for simple patterns like "X in Y" or "X at Y"
        simple_pattern = re.search(r'(\w+(?:\s+\w+){0,3})\s+(?:in|at|near)\s+' + re.escape(location.lower()), text_lower)
        if simple_pattern:
            event_text = simple_pattern.group(1).strip()
            if event_text and len(event_text) > 2:
                # Capitalize properly
                event_words = event_text.split()
                event_capitalized = ' '.join(word.capitalize() for word in event_words)
                title = f"{event_capitalized} at {location}"
                
                # Apply location capitalization
                for pattern, replacement in LOCATION_PATTERNS.items():
                    title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
                
                if len(title) <= 60:
                    return title
        
        for pattern in action_patterns:
            match = re.search(pattern + r'(.{0,40})', text_lower)
            if match:
                context = match.group(1).strip()
                if context:
                    # Clean up context
                    context = re.sub(r'[^\w\s]', '', context)
                    words = context.split()[:5]  # Max 5 words
                    if words:
                        title = f"{' '.join(words).title()} at {location}"
                        
                        # Apply location capitalization
                        for pattern, replacement in LOCATION_PATTERNS.items():
                            title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
                        
                        if len(title) <= 60:
                            return title
    
    # Category-based title extraction
    if category == "Event":
        # Try to extract first meaningful phrase
        sentences = text_original.split('.')
        if sentences:
            first_sentence = sentences[0].strip()
            if len(first_sentence) <= 60:
                # Apply location capitalization
                for pattern, replacement in LOCATION_PATTERNS.items():
                    first_sentence = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, first_sentence, flags=re.IGNORECASE)
                return first_sentence
    
    # If nothing matches, return None (will fall back to AI or smart generation)
    return None

def improve_title_capitalization(title: str) -> str:
    """
    Improve capitalization of a title
    """
    if not title:
        return title
    
    # Apply location capitalization fixes
    for pattern, replacement in LOCATION_PATTERNS.items():
        title = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, title, flags=re.IGNORECASE)
    
    return title

