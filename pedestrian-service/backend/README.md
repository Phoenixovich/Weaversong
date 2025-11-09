# Pedestrian Control Service

A service for collecting and analyzing pedestrian geolocation data to identify:
- Best spots for businesses
- Areas of interest
- Dead areas (low foot traffic)
- Dangerous areas

## Features

- **Geolocation Collection**: Collect pedestrian location data from users (with or without authentication)
- **Batch Collection**: Support for collecting multiple locations at once
- **AI-Powered Analysis**: Uses Google Gemini AI to analyze location patterns
- **Automatic Anonymization**: All location data is automatically anonymized before storage:
  - User IDs and session IDs are hashed using SHA-256 (one-way hashing)
  - Device information is sanitized (only generic device type and OS family, no browser versions or device models)
  - Coordinates are rounded to ~11 meters accuracy to prevent exact tracking
  - No personally identifiable information (PII) is stored
- **Privacy Compliant**: Support for deleting location data (GDPR compliance)

## API Endpoints

### Collect Location
- `POST /pedestrian/location` - Collect a single location point
- `POST /pedestrian/locations/batch` - Collect multiple locations

### Retrieve Data
- `GET /pedestrian/locations` - Get location data with filters
- `GET /pedestrian/stats` - Get basic statistics

### Analysis
- `POST /pedestrian/analyze` - Analyze location data using AI

### Privacy
- `DELETE /pedestrian/locations/{location_id}` - Delete a specific location record

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables in `.env`:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=CommunityHelp
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:5173
```

3. Run the service:
```bash
uvicorn app.main:app --reload --port 8001
```

## Usage Examples

### Collect Location
```python
POST /pedestrian/location
{
  "latitude": 44.4268,
  "longitude": 26.1025,
  "accuracy": 10.5,
  "speed": 1.2,
  "heading": 45.0,
  "device_info": {"type": "mobile", "os": "Android"},
  "session_id": "session_123"
}
```

### Analyze Locations
```python
POST /pedestrian/analyze
{
  "analysis_type": "comprehensive",  # or "business_spots", "dead_areas", "dangerous_areas"
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z"
}
```

## Integration

This service can be integrated into the main auth-service by adding the router:

```python
from pedestrian_service.backend.app.routers import pedestrian
app.include_router(pedestrian.router)
```

