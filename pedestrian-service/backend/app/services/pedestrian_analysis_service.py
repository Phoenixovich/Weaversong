import google.generativeai as genai
from app.config import settings
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict
import statistics


# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


async def analyze_pedestrian_data(
    locations: List[Dict],
    analysis_type: str = "comprehensive"
) -> Dict:
    """
    Analyze pedestrian geolocation data using AI to identify:
    - Best spots for businesses
    - Areas of interest
    - Dead areas (low foot traffic)
    - Dangerous areas (based on patterns)
    """
    
    # Aggregate location data
    aggregated_data = _aggregate_location_data(locations)
    
    # Prepare data summary for AI
    data_summary = _prepare_data_summary(locations, aggregated_data)
    
    # Generate AI analysis based on type
    if analysis_type == "business_spots":
        ai_insights = await _analyze_business_opportunities(data_summary, aggregated_data)
    elif analysis_type == "dead_areas":
        ai_insights = await _analyze_dead_areas(data_summary, aggregated_data)
    elif analysis_type == "dangerous_areas":
        ai_insights = await _analyze_dangerous_areas(data_summary, aggregated_data)
    else:  # comprehensive
        ai_insights = await _comprehensive_analysis(data_summary, aggregated_data)
    
    return {
        "insights": ai_insights,
        "aggregated_data": aggregated_data,
        "statistics": _calculate_statistics(locations, aggregated_data)
    }


def _aggregate_location_data(locations: List[Dict]) -> Dict:
    """Aggregate location data into grid cells for analysis"""
    # Group locations by grid cells (0.001 degree ≈ 111m)
    grid_size = 0.001
    grid_counts = defaultdict(int)
    grid_times = defaultdict(list)
    grid_speeds = defaultdict(list)
    
    for loc in locations:
        lat = round(loc['latitude'] / grid_size) * grid_size
        lng = round(loc['longitude'] / grid_size) * grid_size
        key = f"{lat:.4f},{lng:.4f}"
        
        grid_counts[key] += 1
        if 'timestamp' in loc:
            grid_times[key].append(loc['timestamp'])
        if 'speed' in loc and loc['speed']:
            grid_speeds[key].append(loc['speed'])
    
    # Calculate statistics per grid cell
    aggregated = {}
    for key, count in grid_counts.items():
        lat, lng = map(float, key.split(','))
        aggregated[key] = {
            "latitude": lat,
            "longitude": lng,
            "visit_count": count,
            "avg_speed": statistics.mean(grid_speeds[key]) if grid_speeds[key] else None,
            "time_distribution": _analyze_time_distribution(grid_times[key])
        }
    
    return aggregated


def _analyze_time_distribution(timestamps: List) -> Dict:
    """Analyze time distribution of visits"""
    if not timestamps:
        return {}
    
    hours = []
    days = []
    
    for ts in timestamps:
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            except:
                continue
        else:
            dt = ts
        
        hours.append(dt.hour)
        days.append(dt.weekday())
    
    if not hours:
        return {}
    
    # Find peak hours
    hour_counts = defaultdict(int)
    for h in hours:
        hour_counts[h] += 1
    
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    return {
        "peak_hours": [f"{h:02d}:00" for h, _ in peak_hours],
        "total_visits": len(hours),
        "day_distribution": _count_days(days)
    }


def _count_days(days: List[int]) -> Dict[str, int]:
    """Count visits by day of week"""
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_counts = defaultdict(int)
    for d in days:
        day_counts[day_names[d]] += 1
    return dict(day_counts)


def _prepare_data_summary(locations: List[Dict], aggregated: Dict) -> str:
    """Prepare a text summary of the data for AI analysis"""
    total_locations = len(locations)
    unique_sessions = len(set(loc.get('session_id', '') for loc in locations))
    
    # Top visited areas
    sorted_areas = sorted(aggregated.items(), key=lambda x: x[1]['visit_count'], reverse=True)[:10]
    
    summary = f"""
Pedestrian Geolocation Data Analysis Summary:

Total Location Points: {total_locations}
Unique Sessions: {unique_sessions}
Time Period: {min(loc.get('timestamp', datetime.utcnow()) for loc in locations) if locations else 'N/A'} to {max(loc.get('timestamp', datetime.utcnow()) for loc in locations) if locations else 'N/A'}

Top 10 Most Visited Areas:
"""
    
    for i, (key, data) in enumerate(sorted_areas, 1):
        summary += f"{i}. Coordinates: ({data['latitude']:.4f}, {data['longitude']:.4f}) - {data['visit_count']} visits\n"
        if data.get('time_distribution'):
            td = data['time_distribution']
            summary += f"   Peak hours: {', '.join(td.get('peak_hours', []))}\n"
        if data.get('avg_speed'):
            summary += f"   Average speed: {data['avg_speed']:.2f} m/s\n"
    
    return summary


async def _comprehensive_analysis(data_summary: str, aggregated: Dict) -> Dict:
    """Comprehensive AI analysis of pedestrian data"""
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""You are an urban planning and business intelligence analyst. Analyze the following pedestrian geolocation data and provide comprehensive insights.

{data_summary}

Based on this data, provide a detailed analysis in the following format (use markdown):

## Overall Insights
- Key patterns and trends
- Peak activity times
- Movement patterns

## Business Opportunities
Identify the best spots for businesses (restaurants, cafes, shops, etc.) based on:
- High foot traffic areas
- Time patterns (lunch spots, evening spots, etc.)
- Movement speed (people stopping vs passing through)
For each spot, provide: coordinates, recommended business type, reasoning

## Areas of Interest
Identify areas with:
- High pedestrian activity
- Consistent visits
- Potential for community spaces or amenities
For each area, provide: coordinates, characteristics, potential uses

## Dead Areas
Identify areas with:
- Low or no foot traffic
- Potential reasons (accessibility, safety, lack of attractions)
- Opportunities for improvement
For each area, provide: coordinates, characteristics, improvement suggestions

## Dangerous Areas (if applicable)
Identify areas that might be dangerous based on:
- Unusual movement patterns (sudden stops, erratic paths)
- Low activity in otherwise busy times
- Speed anomalies
- Other safety indicators
For each area, provide: coordinates, concerns, recommendations

Be specific with coordinates and provide actionable insights."""
    
    try:
        response = model.generate_content(prompt)
        return {
            "analysis": response.text,
            "type": "comprehensive"
        }
    except Exception as e:
        return {
            "analysis": f"Error generating analysis: {str(e)}",
            "type": "comprehensive"
        }


async def _analyze_business_opportunities(data_summary: str, aggregated: Dict) -> Dict:
    """AI analysis focused on business opportunities"""
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""You are a business location consultant. Analyze pedestrian geolocation data to identify the best spots for businesses.

{data_summary}

Identify the top 5-10 best locations for businesses based on:
1. High foot traffic
2. Time patterns (when people visit)
3. Movement patterns (people stopping vs passing through)
4. Consistency of visits

For each location, provide:
- Coordinates (latitude, longitude)
- Recommended business types (restaurant, cafe, retail, etc.)
- Reasoning based on the data
- Peak hours for that location
- Expected customer flow

Format your response in markdown with clear sections."""
    
    try:
        response = model.generate_content(prompt)
        return {
            "analysis": response.text,
            "type": "business_opportunities"
        }
    except Exception as e:
        return {
            "analysis": f"Error generating analysis: {str(e)}",
            "type": "business_opportunities"
        }


async def _analyze_dead_areas(data_summary: str, aggregated: Dict) -> Dict:
    """AI analysis focused on dead areas (low foot traffic)"""
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Find areas with low traffic
    low_traffic_areas = [(k, v) for k, v in aggregated.items() if v['visit_count'] < statistics.median([a['visit_count'] for a in aggregated.values()])]
    
    prompt = f"""You are an urban planning analyst. Analyze pedestrian geolocation data to identify "dead areas" - locations with low or no foot traffic.

{data_summary}

Low Traffic Areas Identified: {len(low_traffic_areas)}

For each dead area, analyze:
1. Why it might have low foot traffic (accessibility, safety, lack of attractions)
2. Potential improvements (better lighting, amenities, connectivity)
3. Opportunities for development

Provide specific recommendations for each area with coordinates.

Format your response in markdown."""
    
    try:
        response = model.generate_content(prompt)
        return {
            "analysis": response.text,
            "type": "dead_areas"
        }
    except Exception as e:
        return {
            "analysis": f"Error generating analysis: {str(e)}",
            "type": "dead_areas"
        }


async def _analyze_dangerous_areas(data_summary: str, aggregated: Dict) -> Dict:
    """AI analysis focused on potentially dangerous areas"""
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""You are a public safety analyst. Analyze pedestrian geolocation data to identify potentially dangerous areas based on movement patterns.

{data_summary}

Look for indicators of potential danger:
1. Unusual movement patterns (sudden stops, erratic paths)
2. Low activity in otherwise busy times (suggesting people avoid the area)
3. Speed anomalies (people moving very fast through an area might indicate avoidance)
4. Inconsistent visit patterns

For each potentially dangerous area, provide:
- Coordinates
- Specific concerns identified
- Safety recommendations
- Suggested improvements

Be cautious and evidence-based. Only flag areas with clear indicators.

Format your response in markdown."""
    
    try:
        response = model.generate_content(prompt)
        return {
            "analysis": response.text,
            "type": "dangerous_areas"
        }
    except Exception as e:
        return {
            "analysis": f"Error generating analysis: {str(e)}",
            "type": "dangerous_areas"
        }


def _calculate_statistics(locations: List[Dict], aggregated: Dict) -> Dict:
    """Calculate statistical summaries"""
    if not locations:
        return {}
    
    speeds = [loc.get('speed', 0) for loc in locations if loc.get('speed')]
    accuracies = [loc.get('accuracy', 0) for loc in locations if loc.get('accuracy')]
    
    visit_counts = [area['visit_count'] for area in aggregated.values()]
    
    stats = {
        "total_locations": len(locations),
        "unique_areas": len(aggregated),
        "max_visits_per_area": max(visit_counts) if visit_counts else 0,
        "avg_visits_per_area": statistics.mean(visit_counts) if visit_counts else 0,
    }
    
    if speeds:
        stats["avg_speed"] = statistics.mean(speeds)
        stats["max_speed"] = max(speeds)
    
    if accuracies:
        stats["avg_accuracy"] = statistics.mean(accuracies)
    
    return stats


