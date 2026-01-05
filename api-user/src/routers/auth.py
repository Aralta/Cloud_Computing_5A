"""
Routes d'authentification - Login, Register, Logout
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import settings
from .. import models, schemas
from ..security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentification"]
)


@router.get("/health", response_model=schemas.HealthResponse)
def health_check():
    """
    Health check - Vérifier que l'API est opérationnelle
    """
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow()
    }


@router.post("/register", response_model=schemas.LoginResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Inscription d'un nouvel utilisateur
    
    - Vérifie que l'email n'est pas déjà utilisé
    - Hash le mot de passe
    - Crée l'utilisateur en base
    - Retourne un token JWT
    """
    # Vérifier si l'email existe déjà
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà utilisé"
        )
    
    # Créer le nouvel utilisateur
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Générer le token
    token = create_access_token(data={"sub": new_user.email, "id": new_user.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": new_user
    }


@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Connexion d'un utilisateur existant
    
    - Vérifie les identifiants
    - Retourne un token JWT si valide
    """
    # Rechercher l'utilisateur par email
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Générer le token
    token = create_access_token(data={"sub": user.email, "id": user.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }


@router.post("/logout", response_model=schemas.MessageResponse)
def logout(current_user: models.User = Depends(get_current_user)):
    """
    Déconnexion de l'utilisateur
    
    Note: Avec les JWT stateless, la déconnexion est gérée côté client
    en supprimant le token. Cette route sert principalement de confirmation.
    """
    return {"message": f"Utilisateur {current_user.email} déconnecté avec succès"}


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """
    Récupérer les informations de l'utilisateur connecté
    
    - Nécessite un token JWT valide
    - Retourne les infos de l'utilisateur
    """
    return current_user


@router.get("/verify", response_model=schemas.MessageResponse)
def verify_token_route(current_user: models.User = Depends(get_current_user)):
    """
    Vérifier la validité du token JWT
    
    - Retourne un message de succès si le token est valide
    - Utilisé par les autres services pour valider les tokens
    """
    return {"message": "Token valide"}
