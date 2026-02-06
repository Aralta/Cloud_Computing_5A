from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.config import settings
from src import models

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


class PurgeRequest(BaseModel):
    password: str


@router.post("/purge")
def purge_db(req: PurgeRequest, db: Session = Depends(get_db)):
    """Purge la table des événements si le mot de passe est correct.

    Utiliser avec précaution. Mot de passe stocké dans l'env `PURGE_PASSWORD`.
    """
    if not settings.PURGE_PASSWORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Purge disabled")

    if req.password != settings.PURGE_PASSWORD:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mot de passe incorrect")

    # Supprimer tous les events
    deleted = db.query(models.Event).delete()
    db.commit()
    return {"message": "Events purgées", "deleted": deleted}
