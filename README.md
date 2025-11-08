# CityPulse

A hyper-local community incident reporting platform for Bucharest, Romania. Users can report and view community alerts including traffic incidents, lost items, events, safety concerns, and more.

## Features

- **Text & Voice Input**: Submit alerts via text or voice recognition
- **Smart Location Detection**: Automatic location extraction from text using a comprehensive Bucharest location library
- **AI-Powered Analysis**: Uses Google Gemini API to extract structured data from user input (category, priority, title, location, etc.)
- **Interactive Map**: View alerts on an interactive map with sector boundaries
- **List View**: Browse alerts with filtering by category and neighborhood/sector
- **Location Clustering**: Multiple events at the same location are automatically clustered to prevent map overlap
- **Sector Visualization**: Visual representation of Bucharest's 6 sectors on the map

## Tech Stack

### Frontend
- **React** + **Vite** + **TypeScript**
- **TailwindCSS** for styling
- **react-leaflet** for map visualization
- **Web Speech API** for voice input

### Backend
- **FastAPI** (Python) - REST API framework
- **Motor** - Async MongoDB driver
- **Google Gemini API** - AI text analysis
- **Google Maps Geocoding API** - Location geocoding and reverse geocoding

### Database
- **MongoDB** - Document database for alerts and sector data

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB (local or Atlas)
- Google API Key (for Gemini AI and Geocoding)

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Create `.env` file in the `backend` folder:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=CommunityHelp
GOOGLE_API_KEY=your_google_api_key_here
```

Replace:
- `<username>` and `<password>` with your MongoDB credentials
- `your_google_api_key_here` with your Google API key (enable Gemini API and Geocoding API)

3. **Run the server:**
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start dev server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Environment Variables

### Backend (`.env` file)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB` | Database name (default: `CommunityHelp`) | No |
| `GOOGLE_API_KEY` | Google API key for Gemini AI and Geocoding | No (but recommended) |

## Project Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── db.py                   # Database connection and settings
│   ├── models/                 # Pydantic models
│   │   └── alert.py           # Alert data models
│   ├── routes/                 # API routes
│   │   ├── alerts.py          # Alert CRUD and analysis endpoints
│   │   └── sectors.py         # Sector polygon data endpoint
│   ├── services/               # Business logic services
│   │   ├── ai_analysis.py     # AI-powered text analysis (Google Gemini)
│   │   ├── ai_title_generator.py  # AI title generation
│   │   ├── geocoding.py       # Address geocoding and reverse geocoding
│   │   ├── location_library.py    # Bucharest location library
│   │   ├── location_hierarchy.py  # Location hierarchy (point/area/sector/city)
│   │   ├── location_clustering.py # Location clustering for map
│   │   ├── title_extractor.py     # Pattern-based title extraction
│   │   └── neighborhoods.py       # Neighborhood/sector detection
│   ├── data/                   # Static data
│   │   └── bucharest_locations.py # Bucharest location coordinates
│   └── scripts/                # Utility scripts
│       └── export_sectors_to_mongodb.py  # KML to MongoDB export
│
└── frontend/
    └── src/
        ├── App.tsx             # Main application component
        ├── components/          # React components
        │   ├── AlertInput.tsx  # Alert input form (text/voice)
        │   ├── AlertList.tsx   # Alert list and filtering
        │   └── AlertMap.tsx    # Map visualization
        ├── services/           # API service layer
        │   └── api.ts          # Backend API client
        └── types/              # TypeScript type definitions
            └── index.ts
```

## API Endpoints

### Alerts

- `GET /api/alerts` - Get all alerts (with optional filtering by neighborhood and category)
- `POST /api/alerts` - Create a new alert
- `POST /api/alerts/analyze` - Analyze user text and extract structured data
  - Request body: `{ text: string, user_lat?: number, user_lng?: number, is_speech?: boolean }`
  - Returns: Analysis with category, priority, title, location, etc.

### Sectors

- `GET /api/sectors` - Get all sector polygon boundaries for map visualization

## How It Works

### Alert Analysis Flow

1. **Library-Based Extraction** (Fast, No AI)
   - Checks if location is in the Bucharest location library
   - Extracts title using pattern matching
   - If both found, uses library-based analysis (no AI call)

2. **AI Analysis** (Google Gemini)
   - If library extraction fails, uses Google Gemini API
   - Extracts: category, priority, title, description, location, area, sector, contacts
   - For speech input, always uses AI to clean and structure the transcript

3. **Fallback** (Keyword-Based)
   - If AI is unavailable, falls back to keyword-based category/priority detection

### Location Processing

1. **Location Detection**: Extracts location mentions from text
2. **Geocoding**: Converts location names to coordinates (uses library first, then Google Geocoding API)
3. **Clustering**: Applies small offsets to coordinates if multiple events exist at the same location
4. **Hierarchy**: Determines location hierarchy (point → area → sector → city)
5. **Sector Mapping**: Maps areas to Bucharest sectors (1-6)

## Development

### Backend Logs

Backend logs appear in the terminal where `uvicorn` is running. Errors include full tracebacks for debugging.

### Adding New Locations

Edit `backend/services/location_library.py` to add new Bucharest locations with their coordinates and sectors.

### Adding Test Data

Use `backend/test_data.json` as a reference for alert structure. Import into MongoDB using MongoDB Compass or `mongoimport`.

## License

[Add your license here]
