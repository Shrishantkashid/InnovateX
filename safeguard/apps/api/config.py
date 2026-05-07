from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # SUPABASE
    SUPABASE_URL: str = "https://xxxx.supabase.co"
    SUPABASE_ANON_KEY: str = "your-anon-key"
    SUPABASE_SERVICE_KEY: Optional[str] = None

    # TWILIO
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_WHATSAPP_NUMBER: Optional[str] = None

    # OPENAI
    OPENAI_API_KEY: Optional[str] = None

    # GOOGLE
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    # NEXTDNS
    NEXTDNS_API_KEY: Optional[str] = None
    NEXTDNS_PROFILE_ID: Optional[str] = None

    # APP CONFIG
    API_BASE_URL: str = "http://localhost:8000"
    JWT_SECRET: str = "your-256-bit-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # ALERT THRESHOLDS
    M1_AUDIO_THRESHOLD: float = 0.70
    M2_AUDIO_THRESHOLD: float = 0.55
    M1_CONFIRM_WINDOW_SEC: int = 10
    M2_CONFIRM_WINDOW_SEC: int = 5
    M1_MOTION_G_THRESHOLD: float = 2.5
    M2_MOTION_G_THRESHOLD: float = 2.0

    # GUARDIAN NETWORK
    GUARDIAN_RADIUS_M: int = 500
    GUARDIAN_COOLDOWN_MIN: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
