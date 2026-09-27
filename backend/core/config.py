"""
MediMitra — Core Configuration
Reads environment variables with sensible defaults for demo mode.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # JWT
    SECRET_KEY: str = "medimitra-demo-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./medimitra.db"

    # App
    APP_ENV: str = "development"
    DEMO_MODE: bool = True
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Optional: Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    TWILIO_VOICE_NUMBER: str = ""
    TWILIO_WEBHOOK_BASE_URL: str = ""

    # Optional: Google Sheets
    GOOGLE_SHEETS_CREDENTIALS_JSON: str = ""
    GOOGLE_SHEETS_SPREADSHEET_ID: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def twilio_enabled(self) -> bool:
        return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN)

    @property
    def sheets_enabled(self) -> bool:
        return bool(self.GOOGLE_SHEETS_CREDENTIALS_JSON and self.GOOGLE_SHEETS_SPREADSHEET_ID)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
