"""
Configuration de la base de données
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import settings

# Création du moteur SQLAlchemy
engine = create_engine(settings.DATABASE_URL)

# Session locale pour les requêtes
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()


def get_db():
    """
    Dépendance pour récupérer une session DB dans chaque route.
    Utilisé avec Depends() dans FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
