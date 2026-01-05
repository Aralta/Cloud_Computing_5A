from uuid import UUID

def can_edit(event: dict, user_id: UUID) -> bool:
    return (
        user_id == event["owner_id"]
        or user_id in event.get("shared_with_edit", [])
    )

def can_view (event: dict, user_id: UUID) -> bool:
    return (user_id == event["owner_id"] 
    or user_id in event.get("shared_with_edit", [])
    or user_id in event.get("shared_with_view", [])
    )

def can_delete(event: dict, user_id: UUID) -> bool:
    return user_id == event["owner_id"]
