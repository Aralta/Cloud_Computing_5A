"""
Gestion des droits d'accès aux événements
"""
from . import models
from .security import TokenPayload


def can_view(event: models.Event, user: TokenPayload) -> bool:
    """
    Vérifie si l'utilisateur peut voir l'événement
    
    Peut voir si:
    - Est le propriétaire
    - Est dans la liste des viewers
    - Est dans la liste des editors
    """
    return (
        event.owner_id == user.user_id
        or user.user_id in (event.viewers or [])
        or user.user_id in (event.editors or [])
    )


def can_edit(event: models.Event, user: TokenPayload) -> bool:
    """
    Vérifie si l'utilisateur peut modifier l'événement
    
    Peut modifier si:
    - Est le propriétaire
    - Est dans la liste des editors
    """
    return (
        event.owner_id == user.user_id
        or user.user_id in (event.editors or [])
    )


def can_delete(event: models.Event, user: TokenPayload) -> bool:
    """
    Vérifie si l'utilisateur peut supprimer l'événement
    
    Peut supprimer uniquement si:
    - Est le propriétaire
    """
    return event.owner_id == user.user_id
