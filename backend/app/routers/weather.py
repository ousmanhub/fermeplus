from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
import httpx
import os
import random

router = APIRouter(prefix="/weather", tags=["weather"])


@router.post("/", response_model=schemas.WeatherDataResponse)
def create_weather(data: schemas.WeatherDataBase, db: Session = Depends(get_db)):
    weather = models.WeatherData(**data.model_dump())
    db.add(weather)
    db.commit()
    db.refresh(weather)
    return weather


@router.get("/{location}", response_model=schemas.WeatherDataResponse)
def fetch_weather(location: str, db: Session = Depends(get_db)):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Clé OpenWeather non configurée")
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": location, "appid": api_key, "units": "metric"}
    response = httpx.get(url, params=params, timeout=20)
    response.raise_for_status()
    data = response.json()
    weather = models.WeatherData(
        location=location,
        temperature=data["main"]["temp"],
        humidity=data["main"]["humidity"],
        wind_speed=data["wind"]["speed"],
        rainfall=data.get("rain", {}).get("1h", 0),
    )
    db.add(weather)
    db.commit()
    db.refresh(weather)
    return weather


@router.get("/forecast/{location}", response_model=List[schemas.WeatherForecast])
def get_forecast(location: str):
    api_key = os.getenv("OPENWEATHER_API_KEY")

    # Fallback démo si pas de clé ou clé invalide
    def demo_forecast():
        from datetime import datetime, timedelta
        base = datetime.utcnow()
        descriptions = [
            ("ciel dégagé", "01d"),
            ("quelques nuages", "02d"),
            ("nuages dispersés", "03d"),
            ("pluie légère", "10d"),
            ("orage", "11d"),
        ]
        result = []
        for i in range(5):
            day = base + timedelta(days=i)
            desc, icon = descriptions[i % len(descriptions)]
            temp_min = round(25 + i * 0.5 + (5 if i < 2 else -3), 1)
            temp_max = round(temp_min + random.uniform(8, 14), 1)
            result.append(schemas.WeatherForecast(
                date=day.strftime("%Y-%m-%d"),
                temp_min=temp_min,
                temp_max=temp_max,
                humidity=round(random.uniform(35, 75), 1),
                rainfall=round(random.uniform(0, 12), 1),
                description=desc,
                icon=icon,
            ))
        return result

    if not api_key:
        return demo_forecast()

    try:
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {"q": location, "appid": api_key, "units": "metric"}
        response = httpx.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()

        # Regrouper les prévisions par jour
        from collections import defaultdict
        days = defaultdict(lambda: {"temps": [], "humidity": [], "rain": [], "desc": None, "icon": None})
        for item in data["list"]:
            date = item["dt_txt"].split(" ")[0]
            days[date]["temps"].append(item["main"]["temp"])
            days[date]["humidity"].append(item["main"]["humidity"])
            days[date]["rain"].append(item.get("rain", {}).get("3h", 0))
            # Prendre la description du milieu de journée
            if "12:00" in item["dt_txt"] or days[date]["desc"] is None:
                days[date]["desc"] = item["weather"][0]["description"]
                days[date]["icon"] = item["weather"][0]["icon"]

        result = []
        for date in sorted(days.keys())[:5]:
            d = days[date]
            result.append(schemas.WeatherForecast(
                date=date,
                temp_min=round(min(d["temps"]), 1),
                temp_max=round(max(d["temps"]), 1),
                humidity=round(sum(d["humidity"]) / len(d["humidity"]), 1),
                rainfall=round(sum(d["rain"]), 1),
                description=d["desc"],
                icon=d["icon"],
            ))
        return result
    except Exception:
        return demo_forecast()


@router.get("/", response_model=List[schemas.WeatherDataResponse])
def list_weather(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.WeatherData).order_by(models.WeatherData.fetched_at.desc()).offset(skip).limit(limit).all()
