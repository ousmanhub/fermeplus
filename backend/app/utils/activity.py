from app.database import SessionLocal
from app import models


def log_activity(db, action: str, entity_type: str, entity_id=None, parcelle_id=None, details=None):
    """Log an activity in the database. Accepts a session or creates one."""
    session_owned = False
    if db is None:
        db = SessionLocal()
        session_owned = True
    try:
        log = models.ActivityLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            parcelle_id=parcelle_id,
            details=details,
        )
        db.add(log)
        db.commit()
    finally:
        if session_owned:
            db.close()
