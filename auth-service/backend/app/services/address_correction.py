"""
Address correction service using fuzzy matching against known Bucharest locations
"""
from typing import Dict, List, Tuple, Optional
from app.services.neighborhoods import SECTORS, AREAS

def calculate_similarity(s1: str, s2: str) -> float:
    """
    Calculate similarity between two strings using Levenshtein distance
    Returns a value between 0 and 1, where 1 is identical
    """
    s1_lower = s1.lower().strip()
    s2_lower = s2.lower().strip()
    
    if s1_lower == s2_lower:
        return 1.0
    
    # Simple Levenshtein distance calculation
    if len(s1_lower) == 0:
        return 0.0 if len(s2_lower) > 0 else 1.0
    if len(s2_lower) == 0:
        return 0.0
    
    # Create a matrix for dynamic programming
    matrix = [[0] * (len(s2_lower) + 1) for _ in range(len(s1_lower) + 1)]
    
    # Initialize first row and column
    for i in range(len(s1_lower) + 1):
        matrix[i][0] = i
    for j in range(len(s2_lower) + 1):
        matrix[0][j] = j
    
    # Fill the matrix
    for i in range(1, len(s1_lower) + 1):
        for j in range(1, len(s2_lower) + 1):
            cost = 0 if s1_lower[i-1] == s2_lower[j-1] else 1
            matrix[i][j] = min(
                matrix[i-1][j] + 1,      # deletion
                matrix[i][j-1] + 1,        # insertion
                matrix[i-1][j-1] + cost    # substitution
            )
    
    # Calculate similarity (1 - normalized distance)
    max_len = max(len(s1_lower), len(s2_lower))
    distance = matrix[len(s1_lower)][len(s2_lower)]
    similarity = 1.0 - (distance / max_len) if max_len > 0 else 1.0
    
    return similarity

def find_best_match(location_text: str, threshold: float = 0.6) -> Optional[Tuple[str, str, float]]:
    """
    Find the best matching location from known Bucharest locations
    Returns: (corrected_location, location_type, similarity_score) or None
    location_type can be 'sector', 'area', or None
    """
    if not location_text or not location_text.strip():
        return None
    
    location_lower = location_text.lower().strip()
    best_match = None
    best_score = 0.0
    best_type = None
    
    # Check against sectors
    for sector, keywords in SECTORS.items():
        # Check direct match against sector name
        score = calculate_similarity(location_text, sector)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = sector
            best_type = "sector"
        
        # Check against keywords
        for keyword in keywords:
            score = calculate_similarity(location_text, keyword)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = sector
                best_type = "sector"
    
    # Check against areas
    for area, keywords in AREAS.items():
        # Check direct match against area name
        score = calculate_similarity(location_text, area)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = area
            best_type = "area"
        
        # Check against keywords
        for keyword in keywords:
            score = calculate_similarity(location_text, keyword)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = area
                best_type = "area"
    
    # Also check if location_text contains parts of known locations
    # This helps with typos like "Victorie" instead of "Victoriei"
    for area, keywords in AREAS.items():
        area_words = set(area.lower().split())
        location_words = set(location_lower.split())
        
        # If there's significant word overlap, consider it a match
        if len(area_words) > 0 and len(location_words) > 0:
            common_words = area_words.intersection(location_words)
            if len(common_words) > 0:
                word_overlap = len(common_words) / max(len(area_words), len(location_words))
                if word_overlap >= 0.5:  # At least 50% word overlap
                    score = word_overlap * 0.8  # Slightly lower score for partial matches
                    if score > best_score and score >= threshold:
                        best_score = score
                        best_match = area
                        best_type = "area"
    
    if best_match and best_score >= threshold:
        return (best_match, best_type, best_score)
    
    return None

def correct_address(address: str) -> Dict[str, any]:
    """
    Correct and validate an address using fuzzy matching
    Returns: {
        "original": str,
        "corrected": str | None,
        "confidence": float,
        "suggestions": List[str],
        "location_type": str | None  # 'sector', 'area', or None
    }
    """
    if not address or not address.strip():
        return {
            "original": address or "",
            "corrected": None,
            "confidence": 0.0,
            "suggestions": [],
            "location_type": None
        }
    
    original = address.strip()
    
    # Try to find best match
    match_result = find_best_match(original, threshold=0.6)
    
    if match_result:
        corrected, location_type, confidence = match_result
        # Generate suggestions (top 3 similar locations)
        suggestions = _generate_suggestions(original, limit=3)
        
        return {
            "original": original,
            "corrected": corrected,
            "confidence": confidence,
            "suggestions": suggestions,
            "location_type": location_type
        }
    else:
        # No good match found, but still generate suggestions
        suggestions = _generate_suggestions(original, limit=5)
        return {
            "original": original,
            "corrected": None,
            "confidence": 0.0,
            "suggestions": suggestions,
            "location_type": None
        }

def _generate_suggestions(location_text: str, limit: int = 5) -> List[str]:
    """
    Generate location suggestions based on similarity
    """
    if not location_text or not location_text.strip():
        return []
    
    suggestions_with_scores = []
    
    # Check all sectors
    for sector, keywords in SECTORS.items():
        score = calculate_similarity(location_text, sector)
        if score > 0.3:  # Lower threshold for suggestions
            suggestions_with_scores.append((sector, score, "sector"))
        for keyword in keywords:
            score = calculate_similarity(location_text, keyword)
            if score > 0.3:
                suggestions_with_scores.append((sector, score, "sector"))
    
    # Check all areas
    for area, keywords in AREAS.items():
        score = calculate_similarity(location_text, area)
        if score > 0.3:
            suggestions_with_scores.append((area, score, "area"))
        for keyword in keywords:
            score = calculate_similarity(location_text, keyword)
            if score > 0.3:
                suggestions_with_scores.append((area, score, "area"))
    
    # Sort by score and remove duplicates
    suggestions_with_scores.sort(key=lambda x: x[1], reverse=True)
    seen = set()
    unique_suggestions = []
    for location, score, loc_type in suggestions_with_scores:
        if location not in seen:
            seen.add(location)
            unique_suggestions.append(location)
            if len(unique_suggestions) >= limit:
                break
    
    return unique_suggestions

def extract_and_correct_locations(text: str) -> List[Dict[str, any]]:
    """
    Extract location mentions from text and correct them
    Returns list of corrected location objects
    """
    import re
    
    # Extract location mentions (similar to ai_analysis.py)
    location_mentions = []
    bucharest_patterns = [
        r'\b(calea|strada|bulevardul|piata|parcul)\s+([A-Za-z\s]+)',
        r'\b(herastrau|cismigiu|carol|victoriei|magheru|unirii|lipscani|politehnica|gara|nord|sector\s*\d+)\b',
    ]
    
    for pattern in bucharest_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    location_text = " ".join(match)
                else:
                    location_text = match
                
                # Correct the location
                corrected = correct_address(location_text)
                location_mentions.append(corrected)
    
    # If no patterns matched, try to find location-like words
    if not location_mentions:
        words = text.split()
        for i, word in enumerate(words):
            # Check if word might be a location (capitalized or common location words)
            if word and word[0].isupper() and len(word) > 3:
                # Check if it's similar to known locations
                match_result = find_best_match(word, threshold=0.5)
                if match_result:
                    corrected, loc_type, confidence = match_result
                    location_mentions.append({
                        "original": word,
                        "corrected": corrected,
                        "confidence": confidence,
                        "suggestions": _generate_suggestions(word, limit=3),
                        "location_type": loc_type
                    })
    
    return location_mentions
