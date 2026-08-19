from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from collections import defaultdict
from app.database import get_db
from app import models, schemas
import httpx
import os

router = APIRouter(tags=["irrigation"])


def get_latest_sensor(db: Session, parcelle_id: str, sensor_type: str):
    return (
        db.query(models.IoTSensor)
        .filter(models.IoTSensor.parcelle_id == parcelle_id)
        .filter(models.IoTSensor.sensor_type == sensor_type)
        .order_by(models.IoTSensor.timestamp.desc())
        .first()
    )


def get_forecast_rain(location: str, days: int = 3):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return None
    try:
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {"q": location, "appid": api_key, "units": "metric"}
        response = httpx.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        day_rain = defaultdict(float)
        for item in data["list"]:
            date = item["dt_txt"].split(" ")[0]
            day_rain[date] += item.get("rain", {}).get("3h", 0)
        return sum(sorted(day_rain.values())[:days])
    except Exception:
        return None


@router.get("/plan/{location}", response_model=List[schemas.IrrigationPlan])
def irrigation_plan(location: str, db: Session = Depends(get_db)):
    parcelles = (
        db.query(models.IoTSensor.parcelle_id)
        .filter(models.IoTSensor.sensor_type == 'soil_moisture')
        .distinct()
        .all()
    )
    parcelles = [p[0] for p in parcelles]

    rain = get_forecast_rain(location, days=3)

    plans = []
    for parcelle in parcelles:
        soil = get_latest_sensor(db, parcelle, 'soil_moisture')
        humidity = soil.value if soil else 0

        if humidity < 20:
            rec = "Irrigation urgente nécessaire. Sol très sec."
            priority = "critical"
            duration = 60
        elif humidity < 30:
            if rain is not None and rain > 5:
                rec = f"Humidité faible mais {rain:.1f} mm de pluie prévus : reporter l'irrigation."
                priority = "low"
                duration = 0
            else:
                rec = "Irrigation recommandée dans les 24h."
                priority = "medium"
                duration = 30
        else:
            if rain is not None and rain > 10:
                rec = f"Sol correct et {rain:.1f} mm de pluie prévus : arrêter l'irrigation."
                priority = "low"
                duration = 0
            else:
                rec = "Humidité satisfaisante : maintenir la surveillance."
                priority = "low"
                duration = 0

        plans.append(schemas.IrrigationPlan(
            parcelle_id=parcelle,
            soil_humidity=round(humidity, 1),
            rain_next_3_days=round(rain or 0, 1),
            recommendation=rec,
            priority=priority,
            suggested_duration_minutes=duration,
        ))

    return sorted(plans, key=lambda x: ['critical', 'medium', 'low'].index(x.priority))
