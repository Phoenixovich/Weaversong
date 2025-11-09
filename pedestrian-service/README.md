# Pedestrian Control Service

A comprehensive service for collecting and analyzing pedestrian geolocation data to identify:
- **Best spots for businesses** - High foot traffic areas ideal for retail, restaurants, cafes
- **Areas of interest** - Popular locations with consistent visits
- **Dead areas** - Low foot traffic zones that could benefit from improvements
- **Dangerous areas** - Locations with unusual movement patterns indicating potential safety concerns

## Features

### Backend
- **Geolocation Collection**: RESTful API for collecting pedestrian location data
- **Batch Collection**: Support for collecting multiple locations at once
- **AI-Powered Analysis**: Uses Google Gemini AI to analyze location patterns and generate insights
- **Privacy Compliant**: Support for deleting location data (GDPR compliance)
- **Statistics**: Real-time statistics about collected data

### Frontend
- **Real-time Tracking**: Track user location with browser geolocation API
- **Interactive Dashboard**: View statistics and analysis results
- **AI Analysis**: Run different types of analysis (comprehensive, business spots, dead areas, dangerous areas)
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
pedestrian-service/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── pedestrian_location.py
│   │   ├── services/
│   │   │   └── pedestrian_analysis_service.py
│   │   ├── routers/
│   │   │   └── pedestrian.py
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PedestrianTracker.tsx
    │   │   └── PedestrianTracker.css
    │   ├── pages/
    │   │   ├── PedestrianControl.tsx
    │   │   └── PedestrianControl.css
    │   └── services/
    │       ├── pedestrianApi.ts
    │       └── api.ts
    └── README.md
```

## Setup

### Backend

1. Install dependencies:
```bash
cd pedestrian-service/backend
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

### Frontend

1. Install dependencies:
```bash
cd pedestrian-service/frontend
npm install
```

2. Set environment variables in `.env`:
```
VITE_API_URL=http://localhost:8001
```

3. Run the frontend:
```bash
npm run dev
```

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

## Usage Examples

### Collect Location (JavaScript/TypeScript)

```typescript
import { collectLocation, GeolocationTracker } from './services/pedestrianApi';

// Manual collection
const location = {
  latitude: 44.4268,
  longitude: 26.1025,
  accuracy: 10.5,
  speed: 1.2,
  heading: 45.0,
  device_info: { type: 'mobile', os: 'Android' },
  session_id: 'session_123'
};

await collectLocation(location);

// Automatic tracking
const tracker = new GeolocationTracker();
await tracker.startTracking({
  interval: 30000, // Collect every 30 seconds
  onLocationUpdate: async (location) => {
    await collectLocation(location);
  }
});
```

### Analyze Locations

```typescript
import { analyzeLocations } from './services/pedestrianApi';

const result = await analyzeLocations({
  analysis_type: 'comprehensive', // or 'business_spots', 'dead_areas', 'dangerous_areas'
  start_date: '2024-01-01T00:00:00Z',
  end_date: '2024-01-31T23:59:59Z'
});

console.log(result.insights.ai_analysis);
```

## Integration with Main Service

To integrate this service into the main auth-service:

1. Copy the pedestrian router to the main service:
```python
# In auth-service/backend/app/main.py
from pedestrian_service.backend.app.routers import pedestrian
app.include_router(pedestrian.router)
```

2. Or copy the files directly into the main service structure.

## Privacy & Legal Considerations

- **Automatic Anonymization**: All location data is automatically anonymized before storage:
  - User IDs and session IDs are hashed using SHA-256 (one-way hashing)
  - Device information is sanitized (only generic device type and OS family)
  - Coordinates are rounded to ~11 meters accuracy
  - No personally identifiable information (PII) is stored in the database

- **User Consent**: Always obtain explicit user consent before collecting geolocation data
- **Data Retention**: Implement data retention policies
- **GDPR Compliance**: Support for data deletion and user rights
- **Transparency**: Clearly communicate how location data is used and anonymized
- **No Tracking**: The anonymization ensures users cannot be individually tracked or identified

## License

MIT

