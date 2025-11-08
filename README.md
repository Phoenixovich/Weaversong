# Community Service Hub

A unified platform providing accessible public services for Romanian citizens, built with React, FastAPI, and MongoDB.

## Services

### 🔐 Authentication Service
- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Protected routes and user session management

### 📄 ClarifAI Service
Transform complex documents into clear, plain-language steps:
- **Medical Documents**: Simplify doctor instructions, discharge notes, and medical terminology
- **Legal Documents**: Break down contracts, government forms, and legal jargon into understandable steps
- **Features**:
  - Support for text input, PDF files, and images (with OCR)
  - Multiple Gemini AI models (gemini-2.5-pro, gemini-2.5-flash-lite, gemini-2.5-flash)
  - Output styles: default, shorter, or "explain like I'm 5"
  - Reminder system to save important information
  - Markdown-formatted output

### 📊 Public Data Hub
Access and understand Romanian government data:
- **RO-ALERT Explainer**: Translate technical emergency alerts into clear, actionable safety instructions
- **Social Aid Helper**: Get answers about social benefits (VMI, eligibility, application process)
- **Data Explorer**: Browse and analyze datasets from data.gov.ro
  - Automatic extraction and analysis of ZIP files containing Excel/CSV data
  - AI-powered aggregated summaries with key insights and statistics
  - Support for CSV, JSON, Excel (XLSX/XLS), and ZIP formats

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Python + FastAPI
- **Database**: MongoDB
- **AI**: Google Gemini API
- **Authentication**: JWT (JSON Web Tokens)

## Features

- 🔒 Secure authentication with JWT tokens
- 🤖 AI-powered document simplification using Gemini
- 📁 File processing (PDF, images, Excel, ZIP)
- 📊 Data analysis and visualization
- 🌐 Romanian language support
- 📱 Responsive UI design
- 🔄 Real-time data fetching from data.gov.ro API

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
