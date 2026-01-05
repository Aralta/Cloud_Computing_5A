"""
Modèles SQLAlchemy - Définition des tables de la base de données
"""
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from src.database import Base


class User(Base):
    """
    Modèle User - Représente un utilisateur dans la base de données
    
    Attributs:
        id: Identifiant unique de l'utilisateur
        name: Nom de l'utilisateur
        email: Email unique de l'utilisateur
        password: Mot de passe hashé
        created_at: Date de création du compte
        updated_at: Date de dernière modification
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"
