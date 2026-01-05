from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class EventCreate(BaseModel):
    title: str
    description: str | None = None
    start: datetime
    end: datetime
    viewUserIds: list[UUID] = []
    editUserIds: list[UUID] = []

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    viewUserIds: Optional[List[UUID]] = None
    editUserIds: Optional[List[UUID]] = None

class EventResponse(EventCreate):
    id: UUID
    owner_id: UUID
