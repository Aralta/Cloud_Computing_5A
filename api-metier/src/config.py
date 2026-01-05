"""
Configuration de l'application API Métier
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Configuration centralisée de l'application"""
    
    # Base de données
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/events_db")
    
    # Sécurité JWT (doit correspondre à api-user)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # Application
    APP_NAME: str = "API Métier"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "0") == "1"
    
    # URL de l'API User pour validation des tokens (optionnel)
    API_USER_URL: str = os.getenv("API_USER_URL", "http://api-user:3000")


settings = Settings()
