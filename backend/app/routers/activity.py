from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/", response_model=List[schemas.ActivityLogItem])
def list_logs(
    entity_type: Optional[str] = None,
    parcelle_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc())
    if entity_type:
        q = q.filter(models.ActivityLog.entity_type == entity_type)
    if parcelle_id:
        q = q.filter(models.ActivityLog.parcelle_id == parcelle_id)
    return q.limit(limit).all()
