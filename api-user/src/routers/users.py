"""
Routes de gestion des utilisateurs - CRUD Users
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security import get_current_user, hash_password

router = APIRouter(
    prefix="/api/users",
    tags=["Utilisateurs"]
)


@router.get("", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupérer la liste de tous les utilisateurs
    
    - Route protégée (nécessite authentification)
    - Retourne la liste complète des utilisateurs
    """
    users = db.query(models.User).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupérer un utilisateur par son ID
    
    - Route publique
    - Retourne 404 si l'utilisateur n'existe pas
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mettre à jour un utilisateur
    
    - Route protégée (nécessite authentification)
    - Seul l'utilisateur lui-même peut modifier son profil
    """
    # Vérifier que l'utilisateur modifie son propre profil
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que votre propre profil"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    
    # Mettre à jour les champs fournis
    if user_data.name is not None:
        user.name = user_data.name
    
    if user_data.email is not None:
        # Vérifier que le nouvel email n'est pas déjà utilisé
        existing = db.query(models.User).filter(
            models.User.email == user_data.email,
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cet email est déjà utilisé"
            )
        user.email = user_data.email
    
    if user_data.password is not None:
        user.password = hash_password(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", response_model=schemas.MessageResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supprimer un utilisateur
    
    - Route protégée (nécessite authentification)
    - Seul l'utilisateur lui-même peut supprimer son compte
    """
    # Vérifier que l'utilisateur supprime son propre compte
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez supprimer que votre propre compte"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": f"Utilisateur {user.email} supprimé avec succès"}
