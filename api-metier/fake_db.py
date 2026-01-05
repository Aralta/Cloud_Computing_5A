from uuid import UUID, uuid4
from typing import Dict


db = []

def create_event(event, owner_id):
    from uuid import uuid4
    new_event = {
        "id": uuid4(),  # créé une seule fois
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "owner_id": owner_id,
        "shared_with_edit": event.shared_with_edit,
        "shared_with_view": event.shared_with_view
    }
    db.append(new_event)
    return new_event

def get_event(event_id):
    for event in db:
        if str(event["id"]) == str(event_id):  # attention au format UUID/string
            return event
    return None

def update_event(event_id, update_data):
    event = get_event(event_id)
    if event:
        for k, v in update_data.items():
            event[k] = v
    return event


def get_all_events():
    return db

def delete_event(event_id: UUID):
    global db
    db = [event for event in db if str(event["id"]) != str(event_id)]

