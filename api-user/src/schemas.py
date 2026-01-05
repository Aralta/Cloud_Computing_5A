"""
Schémas Pydantic - Validation et sérialisation des données
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ============================================
# Schémas de réception (requêtes entrantes)
# ============================================

class UserCreate(BaseModel):
    """Schéma pour la création d'un utilisateur (inscription)"""
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Schéma pour la connexion d'un utilisateur"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schéma pour la mise à jour d'un utilisateur"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


# ============================================
# Schémas de réponse (données sortantes)
# ============================================

class UserResponse(BaseModel):
    """Schéma de réponse pour un utilisateur"""
    id: int
    name: str
    email: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Schéma de réponse pour la connexion (token + infos user)"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    """Schéma de réponse pour les messages simples"""
    message: str


class HealthResponse(BaseModel):
    """Schéma de réponse pour le health check"""
    status: str
    service: str
    version: str
    timestamp: datetime
