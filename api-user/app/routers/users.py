from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, database

from .auth import get_current_user 

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# 1. LISTE DES UTILISATEURS (Protégée)
@router.get("", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.User).all()

# 2. INFO USER PAR ID
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user