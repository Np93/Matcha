from pydantic_settings import BaseSettings
from datetime import timedelta

class Settings(BaseSettings):
    api_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60  # Durée de validité du token (en minutes)

    google_client_id: str
    google_client_secret: str
    google_auth_url: str
    google_token_url: str
    google_api_base: str
    google_scope: str

    email_password_google: str
    email_server: str
    email: str

    # frontend_url: str
    frontend_origin: str

    class Config:
        env_file = ".env"

settings = Settings()