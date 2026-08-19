from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["alerts"])


@router.get("/", response_model=List[schemas.AlertItem])
def list_alerts(db: Session = Depends(get_db)):
    alerts = []

    # Alertes sol
    latest_soils = (
        db.query(models.SoilAnalysis)
        .distinct(models.SoilAnalysis.parcelle_id)
        .order_by(models.SoilAnalysis.parcelle_id, models.SoilAnalysis.created_at.desc())
        .all()
    )
    # distinct doesn't guarantee latest per parcelle easily with SQLite; use subquery instead
    subq = (
        db.query(
            models.SoilAnalysis.parcelle_id,
            func.max(models.SoilAnalysis.created_at).label("latest")
        )
        .group_by(models.SoilAnalysis.parcelle_id)
        .subquery()
    )
    latest_soils = (
        db.query(models.SoilAnalysis)
        .join(subq, models.SoilAnalysis.parcelle_id == subq.c.parcelle_id)
        .filter(models.SoilAnalysis.created_at == subq.c.latest)
        .all()
    )

    for soil in latest_soils:
        if soil.ph < 5.5:
            alerts.append(schemas.AlertItem(
                level="warning",
                category="sol",
                parcelle_id=soil.parcelle_id,
                message=f"pH très acide ({soil.ph}) sur {soil.parcelle_id} : chaulage recommandé.",
                created_at=soil.created_at,
            ))
        elif soil.ph > 8.5:
            alerts.append(schemas.AlertItem(
                level="warning",
                category="sol",
                parcelle_id=soil.parcelle_id,
                message=f"pH alcalin ({soil.ph}) sur {soil.parcelle_id} : soufre agricole envisageable.",
                created_at=soil.created_at,
            ))
        if soil.humidity < 20:
            alerts.append(schemas.AlertItem(
                level="critical",
                category="sol",
                parcelle_id=soil.parcelle_id,
                message=f"Humidité du sol critique ({soil.humidity}%) sur {soil.parcelle_id}.",
                created_at=soil.created_at,
            ))
        elif soil.humidity < 30:
            alerts.append(schemas.AlertItem(
                level="warning",
                category="sol",
                parcelle_id=soil.parcelle_id,
                message=f"Humidité faible ({soil.humidity}%) sur {soil.parcelle_id} : surveiller l'irrigation.",
                created_at=soil.created_at,
            ))

    # Alertes maladies
    recent_diseases = (
        db.query(models.DiseaseDetection)
        .filter(models.DiseaseDetection.created_at >= datetime.utcnow() - timedelta(days=7))
        .order_by(models.DiseaseDetection.created_at.desc())
        .all()
    )
    for d in recent_diseases:
        if d.predicted_disease:
            alerts.append(schemas.AlertItem(
                level="critical",
                category="maladie",
                parcelle_id=d.parcelle_id,
                message=f"{d.predicted_disease} détectée sur {d.parcelle_id} ({(d.confidence or 0)*100:.0f}% de confiance).",
                created_at=d.created_at,
            ))
        else:
            alerts.append(schemas.AlertItem(
                level="warning",
                category="maladie",
                parcelle_id=d.parcelle_id,
                message=f"Suspicion de maladie sur {d.parcelle_id} : analyse en attente.",
                created_at=d.created_at,
            ))

    # Capteurs hors ligne (>2h sans donnée)
    since = datetime.utcnow() - timedelta(hours=2)
    # dernier timestamp par capteur
    subq_iot = (
        db.query(
            models.IoTSensor.sensor_id,
            func.max(models.IoTSensor.timestamp).label("latest")
        )
        .group_by(models.IoTSensor.sensor_id)
        .subquery()
    )
    offline = (
        db.query(models.IoTSensor)
        .join(subq_iot, models.IoTSensor.sensor_id == subq_iot.c.sensor_id)
        .filter(models.IoTSensor.timestamp == subq_iot.c.latest)
        .filter(models.IoTSensor.timestamp < since)
        .all()
    )
    for sensor in offline:
        alerts.append(schemas.AlertItem(
            level="warning",
            category="iot",
            parcelle_id=sensor.parcelle_id,
            message=f"Capteur {sensor.sensor_id} ({sensor.sensor_type}) hors ligne depuis {sensor.timestamp.strftime('%H:%M')}",
            created_at=sensor.timestamp,
        ))

    alerts.sort(key=lambda x: x.created_at, reverse=True)
    return alerts
