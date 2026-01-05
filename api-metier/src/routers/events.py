"""
Routes de gestion des événements - CRUD Events
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, schemas
from ..security import get_current_user, TokenPayload
from ..rights import can_view, can_edit, can_delete

router = APIRouter(
    prefix="/api/events",
    tags=["Événements"]
)


@router.get("", response_model=List[schemas.EventResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """
    Récupérer tous les événements accessibles à l'utilisateur
    
    Retourne les événements dont l'utilisateur est:
    - Propriétaire
    - Dans la liste des viewers
    - Dans la liste des editors
    """
    user_id = current_user.user_id
    
    # Récupérer tous les événements et filtrer
    all_events = db.query(models.Event).all()
    
    # Filtrer les événements accessibles
    visible_events = [
        event for event in all_events 
        if can_view(event, current_user)
    ]
    
    return visible_events


@router.get("/{event_id}", response_model=schemas.EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """
    Récupérer un événement par son ID
    
    - Vérifie que l'utilisateur a le droit de voir l'événement
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement introuvable"
        )
    
    if not can_view(event, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cet événement"
        )
    
    return event


@router.post("", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """
    Créer un nouvel événement
    
    - L'utilisateur connecté devient le propriétaire
    """
    # Validation des dates
    if event_data.end < event_data.start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de fin doit être après la date de début"
        )
    
    new_event = models.Event(
        title=event_data.title,
        description=event_data.description,
        start_date=event_data.start,
        end_date=event_data.end,
        owner_id=current_user.user_id,
        viewers=event_data.viewers or [],
        editors=event_data.editors or []
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return new_event


@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    event_data: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """
    Mettre à jour un événement
    
    - Vérifie que l'utilisateur a le droit de modifier l'événement
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement introuvable"
        )
    
    if not can_edit(event, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas le droit de modifier cet événement"
        )
    
    # Mise à jour des champs fournis
    if event_data.title is not None:
        event.title = event_data.title
    if event_data.description is not None:
        event.description = event_data.description
    if event_data.start is not None:
        event.start_date = event_data.start
    if event_data.end is not None:
        event.end_date = event_data.end
    if event_data.viewers is not None:
        event.viewers = event_data.viewers
    if event_data.editors is not None:
        event.editors = event_data.editors
    
    # Validation des dates
    if event.end_date < event.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de fin doit être après la date de début"
        )
    
    db.commit()
    db.refresh(event)
    
    return event


@router.delete("/{event_id}", response_model=schemas.MessageResponse)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """
    Supprimer un événement
    
    - Seul le propriétaire peut supprimer l'événement
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement introuvable"
        )
    
    if not can_delete(event, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut supprimer cet événement"
        )
    
    db.delete(event)
    db.commit()
    
    return {"message": f"Événement '{event.title}' supprimé avec succès"}
