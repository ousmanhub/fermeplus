from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["iot"])


@router.post("/", response_model=schemas.IoTSensorResponse)
def ingest(data: schemas.IoTSensorCreate, db: Session = Depends(get_db)):
    sensor = models.IoTSensor(**data.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@router.get("/history/{parcelle_id}", response_model=List[schemas.IoTSensorResponse])
def history(parcelle_id: str, hours: int = 24, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(models.IoTSensor)
        .filter(models.IoTSensor.parcelle_id == parcelle_id)
        .filter(models.IoTSensor.timestamp >= since)
        .order_by(models.IoTSensor.timestamp.desc())
        .all()
    )


@router.get("/latest/{parcelle_id}")
def latest(parcelle_id: str, db: Session = Depends(get_db)):
    subq = (
        db.query(
            models.IoTSensor.sensor_type,
            func.max(models.IoTSensor.timestamp).label("latest_ts"),
        )
        .filter(models.IoTSensor.parcelle_id == parcelle_id)
        .group_by(models.IoTSensor.sensor_type)
        .subquery()
    )
    results = (
        db.query(models.IoTSensor)
        .join(subq, models.IoTSensor.sensor_type == subq.c.sensor_type)
        .filter(models.IoTSensor.timestamp == subq.c.latest_ts)
        .all()
    )
    return results
