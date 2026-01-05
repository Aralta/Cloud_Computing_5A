"""
Utilitaires de sécurité - Gestion des mots de passe et tokens JWT
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src import models

# Configuration du hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schéma OAuth2 pour récupérer le token depuis le header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ============================================
# Gestion des mots de passe
# ============================================

def hash_password(password: str) -> str:
    """Hasher un mot de passe en clair"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe contre son hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================
# Gestion des tokens JWT
# ============================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Créer un token JWT
    
    Args:
        data: Données à encoder dans le token
        expires_delta: Durée de validité du token
    
    Returns:
        Token JWT encodé
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """
    Vérifier et décoder un token JWT
    
    Args:
        token: Token JWT à vérifier
    
    Returns:
        Payload du token si valide, None sinon
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# ============================================
# Dépendance d'authentification
# ============================================

def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dépendance FastAPI pour récupérer l'utilisateur courant depuis le token JWT.
    Utilisé avec Depends() pour protéger les routes.
    
    Args:
        token: Token JWT extrait du header Authorization
        db: Session de base de données
    
    Returns:
        Utilisateur authentifié
    
    Raises:
        HTTPException: Si le token est invalide ou l'utilisateur n'existe pas
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_optional_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Dépendance optionnelle pour récupérer l'utilisateur courant.
    Retourne None si non authentifié au lieu de lever une exception.
    """
    try:
        return get_current_user(token, db)
    except HTTPException:
        return None
