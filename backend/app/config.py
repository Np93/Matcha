from pydantic_settings import BaseSettings
from datetime import timedelta

class Settings(BaseSettings):
    api_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60  # Durée de validité du token (en minutes)

    class Config:
        env_file = ".env"

settings = Settings()