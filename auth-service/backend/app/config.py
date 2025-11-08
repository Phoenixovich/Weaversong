from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db: str = "CommunityHelp"  # Default to CommunityHelp
    jwt_secret: str
    jwt_expires_min: int = 30
    cors_origin: str
    gemini_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

