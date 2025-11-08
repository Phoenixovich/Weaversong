"""
AI Title Generator service
Uses Google Gemini API or falls back to smart keyword-based generation
"""
import httpx
import re
from typing import Optional
from db import settings

async def generate_title(text: str, category: str, priority: str, location: Optional[str] = None) -> str:
    """
    Generate a relevant, concise title from the input text
    Uses library-based extraction first, then AI if available, otherwise uses smart keyword-based generation
    
    Args:
        text: The full input text
        category: Detected category
        priority: Detected priority
        location: Detected location (optional)
    
    Returns:
        A concise, relevant title (max 60 characters)
    """
    # FIRST: Try library-based title extraction (no AI needed)
    from services.title_extractor import extract_title_from_text
    library_title = extract_title_from_text(text, category)
    if library_title:
        return library_title
    
    # SECOND: Try AI if available (Google Gemini)
    google_api_key = getattr(settings, "google_api_key", None)
    if google_api_key:
        ai_title = await _generate_title_with_google_gemini(text, category, priority, location, google_api_key)
        if ai_title:
            return ai_title
    
    # Fallback to smart keyword-based generation
    return _generate_title_smart(text, category, priority, location)

async def _generate_title_with_google_gemini(
    text: str, 
    category: str, 
    priority: str, 
    location: Optional[str],
    api_key: str
) -> Optional[str]:
    """
    Generate title using Google Gemini API
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Build prompt
            prompt = f"""Generate a concise, informative title (max 60 characters) for this community alert in Bucharest, Romania.

Category: {category}
Priority: {priority}
Location: {location if location else "Not specified"}
Alert text: {text}

Requirements:
- Be concise and informative (max 60 characters)
- Include the most important information (what happened, where if relevant)
- Use clear, direct language with proper grammar
- Don't include "Alert:" or "Warning:" prefix unless it's critical
- Focus on the key event or issue
- Rephrase and improve the wording naturally - don't just copy the user's text
- Reorder words for better readability (e.g., "Ongoing hackathon in UPB library" instead of "politehnica library hackathon ongoing")
- Expand common abbreviations: "politehnica" -> "UPB", "UPB library" -> "UPB Library"
- Use proper capitalization for locations and institutions (e.g., "UPB Library", "Afi Controceni", "Herastrau Park")
- Make it sound professional and clear
- Examples:
  * "politehnica library hackathon ongoing" -> "Ongoing Hackathon at UPB Library"
  * "cat found near afi controceni" -> "Cat Found Near AFI Cotroceni"
  * "traffic jam calea victoriei" -> "Traffic Jam on Calea Victoriei"

Return only the title, nothing else."""

            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 40,
                        "topP": 0.8,
                        "topK": 40
                    }
                },
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        parts = candidate["content"]["parts"]
                        if len(parts) > 0 and "text" in parts[0]:
                            title = parts[0]["text"].strip()
                            # Remove quotes if present
                            title = title.strip('"').strip("'")
                            # Remove any prefix like "Title:" or "Title -"
                            if ":" in title:
                                title = title.split(":", 1)[-1].strip()
                            # Limit to 60 characters
                            if len(title) > 60:
                                title = title[:57] + "..."
                            return title
    except Exception as e:
        print(f"Google Gemini API error: {e}")
        return None
    
    return None


def _generate_title_smart(text: str, category: str, priority: str, location: Optional[str] = None) -> str:
    """
    Smart keyword-based title generation (fallback when AI is not available)
    """
    text_lower = text.lower()
    
    # Priority indicators
    priority_prefix = ""
    if priority == "Critical":
        priority_prefix = "URGENT: "
    elif priority == "High":
        priority_prefix = "⚠️ "
    
    # Extract key information based on category
    title_parts = []
    
    # Extract location if mentioned
    if location:
        # Shorten location if too long
        location_short = location
        if len(location) > 20:
            # Try to extract just the area name
            location_parts = location.split(",")
            if len(location_parts) > 0:
                location_short = location_parts[0].strip()
                if len(location_short) > 20:
                    location_short = location_short[:17] + "..."
        title_parts.append(location_short)
    
    # Extract key event/issue based on category
    if category == "Road":
        keywords = ["accident", "crash", "collision", "pothole", "road damage"]
        for keyword in keywords:
            if keyword in text_lower:
                title_parts.append(keyword.title())
                break
        if not any(kw in text_lower for kw in keywords):
            title_parts.append("Road Issue")
    
    elif category == "Traffic":
        if "jam" in text_lower or "congestion" in text_lower:
            title_parts.append("Traffic Jam")
        elif "standstill" in text_lower:
            title_parts.append("Traffic Standstill")
        else:
            title_parts.append("Traffic Issue")
    
    elif category == "Emergency":
        if "fire" in text_lower:
            title_parts.append("Fire")
        elif "ambulance" in text_lower or "medical" in text_lower:
            title_parts.append("Medical Emergency")
        else:
            title_parts.append("Emergency")
    
    elif category == "Crime":
        if "theft" in text_lower:
            title_parts.append("Theft")
        elif "robbery" in text_lower:
            title_parts.append("Robbery")
        elif "vandalism" in text_lower:
            title_parts.append("Vandalism")
        else:
            title_parts.append("Crime")
    
    elif category == "Lost":
        # Check if it's a "found" item (not lost)
        if "found" in text_lower:
            if "pet" in text_lower or "dog" in text_lower or "cat" in text_lower:
                # Try to extract details like nametag
                if "nametag" in text_lower or "name tag" in text_lower:
                    # Try to extract the name from nametag
                    nametag_match = re.search(r'(?:nametag|name\s+tag).*?(\b[A-Z][a-z]+\b)', text, re.IGNORECASE)
                    if nametag_match:
                        name = nametag_match.group(1)
                        if "cat" in text_lower:
                            title_parts.append(f"Found cat with nametag {name}")
                        elif "dog" in text_lower:
                            title_parts.append(f"Found dog with nametag {name}")
                        else:
                            title_parts.append(f"Found pet with nametag {name}")
                    else:
                        if "cat" in text_lower:
                            title_parts.append("Found cat with nametag")
                        elif "dog" in text_lower:
                            title_parts.append("Found dog with nametag")
                        else:
                            title_parts.append("Found pet with nametag")
                else:
                    if "cat" in text_lower:
                        title_parts.append("Found cat")
                    elif "dog" in text_lower:
                        title_parts.append("Found dog")
                    else:
                        title_parts.append("Found pet")
            elif "child" in text_lower:
                title_parts.append("Found child")
            else:
                title_parts.append("Found item")
        elif "pet" in text_lower or "dog" in text_lower or "cat" in text_lower:
            title_parts.append("Lost Pet")
        elif "child" in text_lower:
            title_parts.append("Missing Child")
        else:
            title_parts.append("Lost Item")
    
    elif category == "Weather":
        if "rain" in text_lower:
            title_parts.append("Heavy Rain")
        elif "storm" in text_lower:
            title_parts.append("Storm")
        elif "snow" in text_lower:
            title_parts.append("Snow")
        elif "flood" in text_lower:
            title_parts.append("Flooding")
        else:
            title_parts.append("Weather Alert")
    
    elif category == "Safety":
        if "suspicious" in text_lower:
            title_parts.append("Suspicious Activity")
        elif "ice" in text_lower or "slippery" in text_lower:
            title_parts.append("Slippery Conditions")
        else:
            title_parts.append("Safety Concern")
    
    elif category == "Infrastructure":
        if "power" in text_lower or "electricity" in text_lower or "outage" in text_lower:
            title_parts.append("Power Outage")
        elif "water" in text_lower:
            title_parts.append("Water Issue")
        else:
            title_parts.append("Infrastructure Issue")
    
    elif category == "PublicTransport":
        if "metro" in text_lower:
            title_parts.append("Metro Issue")
        elif "bus" in text_lower:
            title_parts.append("Bus Issue")
        else:
            title_parts.append("Public Transport Issue")
    
    elif category == "Construction":
        title_parts.append("Construction Work")
    
    elif category == "Event":
        title_parts.append("Event")
    
    else:
        # General category - try to extract first meaningful sentence
        sentences = text.split(".")
        if sentences and len(sentences[0].strip()) > 0:
            first_sentence = sentences[0].strip()
            if len(first_sentence) <= 60:
                title_parts.append(first_sentence)
            else:
                # Take first 57 chars
                title_parts.append(first_sentence[:57] + "...")
        else:
            title_parts.append("Community Alert")
    
    # Combine parts
    if title_parts:
        title = " - ".join(title_parts)
    else:
        # Fallback: use first sentence or first 50 chars
        lines = text.strip().split('\n')
        first_line = lines[0].strip() if lines else ""
        if first_line:
            title = first_line[:60] if len(first_line) > 60 else first_line
        else:
            title = "Community Alert"
    
    # Add priority prefix
    if priority_prefix:
        title = priority_prefix + title
    
    # Final length check
    if len(title) > 60:
        title = title[:57] + "..."
    
    return title

