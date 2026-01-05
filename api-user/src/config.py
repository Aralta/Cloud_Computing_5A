"""
Configuration de l'application
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Configuration centralisée de l'application"""
    
    # Base de données
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/client_db")
    
    # Sécurité JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    
    # Application
    APP_NAME: str = "API User"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "0") == "1"


settings = Settings()
