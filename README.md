# LocalVoice / KidSafe Alerts

A hyper-local community incident reporting platform for the Bucharest area.

## Tech Stack

- **Frontend**: React + Vite + TypeScript, TailwindCSS, react-leaflet
- **Backend**: FastAPI (Python), Motor (MongoDB async driver)
- **Database**: MongoDB

## Setup

### Backend

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Create `.env` file in the `backend` folder:
```
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.l4aer7e.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=KidSafe
```

Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
/frontend
  /src
    /components
    /pages
    /hooks
    /types
    /services

/backend
  main.py
  db.py
  /models
  /routes
```
