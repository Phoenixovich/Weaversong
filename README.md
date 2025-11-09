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
Weaversong/
├── auth-service/
│   ├── backend/          # FastAPI backend
│   └── frontend/         # React frontend
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB connection string
- Google Gemini API key

### Backend Setup
```bash
cd auth-service/backend
pip install -r requirements.txt
# Create .env file with required variables
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd auth-service/frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=CommunityHelp
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get access token
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### ClarifAI
- `POST /clarify/simplify` - Simplify medical documents
- `POST /clarify/legal` - Simplify legal documents

### Public Data
- `GET /public-data/datasets` - List/search datasets
- `GET /public-data/datasets/{id}` - Get dataset details
- `GET /public-data/datasets/{id}/aggregated` - Get AI analysis of dataset
- `POST /public-data/explain-alert` - Explain RO-ALERT messages
- `POST /public-data/explain-social-aid` - Answer social aid questions

### Reminders
- `POST /reminders` - Create reminder
- `GET /reminders` - Get user reminders
- `DELETE /reminders/{id}` - Delete reminder

## License

MIT
