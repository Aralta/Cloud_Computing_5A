"""
Utilitaires de sécurité - Validation des tokens JWT
"""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from .config import settings

# Schéma HTTP Bearer pour récupérer le token
security = HTTPBearer()


class TokenPayload:
    """Représente les données extraites du token JWT"""
    def __init__(self, user_id: int, email: str):
        self.user_id = user_id
        self.email = email


def verify_token(token: str) -> Optional[TokenPayload]:
    """
    Vérifier et décoder un token JWT
    
    Args:
        token: Token JWT à vérifier
    
    Returns:
        TokenPayload si valide, None sinon
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("id")
        email = payload.get("sub")
        
        if user_id is None or email is None:
            return None
        
        return TokenPayload(user_id=user_id, email=email)
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenPayload:
    """
    Dépendance FastAPI pour récupérer l'utilisateur courant depuis le token JWT.
    
    Args:
        credentials: Token extrait du header Authorization
    
    Returns:
        TokenPayload avec les infos de l'utilisateur
    
    Raises:
        HTTPException: Si le token est invalide
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    return token_data


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[TokenPayload]:
    """
    Dépendance optionnelle pour récupérer l'utilisateur courant.
    Retourne None si non authentifié au lieu de lever une exception.
    """
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
