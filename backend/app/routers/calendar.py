from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.utils.activity import log_activity

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.post("/", response_model=schemas.CalendarEventResponse)
def create_event(data: schemas.CalendarEventCreate, db: Session = Depends(get_db)):
    event = models.CalendarEvent(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    log_activity(
        db,
        action="create",
        entity_type="calendar",
        entity_id=event.id,
        parcelle_id=event.parcelle_id,
        details=f"Événement '{event.title}' ({event.event_type}) créé le {event.event_date.isoformat()}",
    )
    return event


@router.get("/", response_model=List[schemas.CalendarEventResponse])
def list_events(
    parcelle_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.CalendarEvent).order_by(models.CalendarEvent.event_date.asc())
    if parcelle_id:
        q = q.filter(models.CalendarEvent.parcelle_id == parcelle_id)
    if status:
        q = q.filter(models.CalendarEvent.status == status)
    return q.all()


@router.put("/{event_id}", response_model=schemas.CalendarEventResponse)
def update_event(event_id: int, data: schemas.CalendarEventCreate, db: Session = Depends(get_db)):
    event = db.query(models.CalendarEvent).get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    for key, value in data.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    log_activity(
        db,
        action="update",
        entity_type="calendar",
        entity_id=event.id,
        parcelle_id=event.parcelle_id,
        details=f"Événement '{event.title}' mis à jour",
    )
    return event


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.CalendarEvent).get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    db.delete(event)
    db.commit()
    log_activity(
        db,
        action="delete",
        entity_type="calendar",
        entity_id=event_id,
        parcelle_id=event.parcelle_id,
        details=f"Événement '{event.title}' supprimé",
    )
    return {"ok": True}


@router.get("/upcoming/", response_model=List[schemas.CalendarEventResponse])
def upcoming_events(limit: int = 5, db: Session = Depends(get_db)):
    return (
        db.query(models.CalendarEvent)
        .filter(models.CalendarEvent.event_date >= datetime.utcnow())
        .order_by(models.CalendarEvent.event_date.asc())
        .limit(limit)
        .all()
    )
