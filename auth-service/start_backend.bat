@echo off
REM Start script for backend
REM This script starts the FastAPI backend server

cd /d "%~dp0backend"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8000

