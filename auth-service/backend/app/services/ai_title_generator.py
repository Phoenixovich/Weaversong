"""
AI Title Generator service
"""
import httpx
import re
from typing import Optional
from app.config import settings

async def generate_title(text: str, category: str, priority: str, location: Optional[str] = None) -> str:
    from app.services.title_extractor import extract_title_from_text
    library_title = extract_title_from_text(text, category)
    if library_title:
        return library_title
    google_api_key = getattr(settings, "google_api_key", None)
    if google_api_key:
        ai_title = await _generate_title_with_google_gemini(text, category, priority, location, google_api_key)
        if ai_title:
            return ai_title
    return _generate_title_smart(text, category, priority, location)

async def _generate_title_with_google_gemini(text: str, category: str, priority: str, location: Optional[str], api_key: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            prompt = f"""Generate a concise, informative title (max 60 characters) for this community alert in Bucharest, Romania.

Category: {category}
Priority: {priority}
Location: {location if location else 'Not specified'}
Alert text: {text}

Return only the title, nothing else."""
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7, "maxOutputTokens": 40}},
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
                            title = title.strip('"').strip("'")
                            if ":" in title:
                                title = title.split(":", 1)[-1].strip()
                            if len(title) > 60:
                                title = title[:57] + "..."
                            return title
    except Exception as e:
        print(f"Google Gemini API error: {e}")
        return None
    return None

def _generate_title_smart(text: str, category: str, priority: str, location: Optional[str] = None) -> str:
    text_lower = text.lower()
    priority_prefix = ""
    if priority == "Critical":
        priority_prefix = "URGENT: "
    elif priority == "High":
        priority_prefix = "⚠️ "
    title_parts = []
    if location:
        location_short = location
        if len(location) > 20:
            location_parts = location.split(",")
            if len(location_parts) > 0:
                location_short = location_parts[0].strip()
                if len(location_short) > 20:
                    location_short = location_short[:17] + "..."
        title_parts.append(location_short)
    # Category-based heuristics (simplified)
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
        else:
            title_parts.append("Traffic Issue")
    else:
        sentences = text.split(".")
        if sentences and len(sentences[0].strip()) > 0:
            first_sentence = sentences[0].strip()
            if len(first_sentence) <= 60:
                title_parts.append(first_sentence)
            else:
                title_parts.append(first_sentence[:57] + "...")
    title = " - ".join(title_parts) if title_parts else (text.strip()[:60] if text else "Community Alert")
    if priority_prefix:
        title = priority_prefix + title
    if len(title) > 60:
        title = title[:57] + "..."
    return title
