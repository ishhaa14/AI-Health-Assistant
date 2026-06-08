import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Health Document Assistant"
    API_V1_STR: str = "/api/v1"
    
    # Security
    # In production, change this to a random 32-byte secret key!
    SECRET_KEY: str = Field(default="SUPER_SECRET_SECURITY_KEY_DO_NOT_USE_IN_PRODUCTION_1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/health_assistant")
    
    # LLM (OpenAI-compatible)
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_API_BASE: str = Field(default="https://api.openai.com/v1")
    LLM_MODEL: str = Field(default="gpt-4o-mini")
    
    # File Storage
    UPLOAD_DIR: str = Field(default="uploads")
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_MIME_TYPES: List[str] = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    
    # Initial Admin Creation (Optional seeding)
    FIRST_SUPERUSER_EMAIL: str = Field(default="admin@healthassistant.com")
    FIRST_SUPERUSER_PASSWORD: str = Field(default="AdminPass123!")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
