from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db: str = "CommunityHelp"
    gemini_api_key: str  # Required for AI analysis
    cors_origin: str = "http://localhost:5173"

    # Use pydantic v2 ConfigDict to set env_file and ignore extra env vars
    model_config = ConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()


