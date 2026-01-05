"""
Modèles SQLAlchemy - Définition des tables de la base de données
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

from src.database import Base


class Event(Base):
    """
    Modèle Event - Représente un événement dans le calendrier
    
    Attributs:
        id: Identifiant unique de l'événement
        title: Titre de l'événement
        description: Description détaillée
        start_date: Date et heure de début
        end_date: Date et heure de fin
        owner_id: ID de l'utilisateur propriétaire
        viewers: Liste des IDs des utilisateurs avec droit de lecture
        editors: Liste des IDs des utilisateurs avec droit d'édition
        created_at: Date de création
        updated_at: Date de dernière modification
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    viewers = Column(JSON, default=[])  # Liste des user_id avec accès lecture
    editors = Column(JSON, default=[])  # Liste des user_id avec accès édition
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Event(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"
    
    def to_dict(self):
        """Convertir l'événement en dictionnaire"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start": self.start_date.isoformat() if self.start_date else None,
            "end": self.end_date.isoformat() if self.end_date else None,
            "owner_id": self.owner_id,
            "viewers": self.viewers or [],
            "editors": self.editors or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
