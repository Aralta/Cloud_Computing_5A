from fastapi import FastAPI, Depends, HTTPException
from uuid import UUID
from schemas import EventCreate, EventUpdate
from security import get_current_user
from rights import can_view, can_edit, can_delete
import fake_db


app = FastAPI(title="Agenda Microservice")

@app.get("/events")
def get_events(
    user_id: UUID = Depends(get_current_user)
):
    events = fake_db.get_all_events()

    visible_events = [event for event in events if can_view(event, user_id)]

    return visible_events


@app.post("/events")
def create_event(
    event: EventCreate,
    user_id: UUID = Depends(get_current_user)
):
    return fake_db.create_event(event, user_id)

@app.patch("/events/{event_id}")
def update_event(
    event_id: UUID,
    event_update: EventUpdate,
    user_id: UUID = Depends(get_current_user)
):
    event = fake_db.get_event(event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    
    if not can_edit(event, user_id):
        raise HTTPException(403, "Not allowed to edit")

    update_data = event_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        event[key] = value

    return event 

@app.delete("/events/{event_id}")
def delete_event(
    event_id: UUID,
    user_id: UUID = Depends(get_current_user)
):
    event = fake_db.get_event(event_id)
    if not event:
        raise HTTPException(404, "Event not found")

    if not can_delete(event, user_id):
        raise HTTPException(403, "Not allowed to delete")

    fake_db.delete_event(event_id)
    return {"message": "Event deleted"}
