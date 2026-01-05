"""
Schémas Pydantic - Validation et sérialisation des données
"""
from pydantic import BaseModel, Field, computed_field
from datetime import datetime
from typing import Optional, List


# ============================================
# Schémas de réception (requêtes entrantes)
# ============================================

class EventCreate(BaseModel):
    """Schéma pour la création d'un événement"""
    title: str
    description: Optional[str] = None
    start: datetime
    end: datetime
    viewers: Optional[List[int]] = []
    editors: Optional[List[int]] = []


class EventUpdate(BaseModel):
    """Schéma pour la mise à jour d'un événement"""
    title: Optional[str] = None
    description: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    viewers: Optional[List[int]] = None
    editors: Optional[List[int]] = None


# ============================================
# Schémas de réponse (données sortantes)
# ============================================

class EventResponse(BaseModel):
    """Schéma de réponse pour un événement"""
    id: int
    title: str
    description: Optional[str] = None
    start: datetime = Field(validation_alias="start_date")
    end: datetime = Field(validation_alias="end_date")
    owner_id: int
    viewers: List[int] = []
    editors: List[int] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True


class MessageResponse(BaseModel):
    """Schéma de réponse pour les messages simples"""
    message: str


class HealthResponse(BaseModel):
    """Schéma de réponse pour le health check"""
    status: str
    service: str
    version: str
    timestamp: datetime
