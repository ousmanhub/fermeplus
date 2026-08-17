from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class SoilAnalysis(Base):
    __tablename__ = "soil_analyses"

    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(String, index=True)
    ph = Column(Float)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    humidity = Column(Float)
    texture = Column(String)
    recommendation = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DiseaseDetection(Base):
    __tablename__ = "disease_detections"

    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(String, index=True)
    image_path = Column(String)
    predicted_disease = Column(String)
    confidence = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    wind_speed = Column(Float)
    rainfall = Column(Float)
    forecast_date = Column(DateTime(timezone=True))
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())


class IoTSensor(Base):
    __tablename__ = "iot_sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True)
    parcelle_id = Column(String, index=True)
    sensor_type = Column(String)
    value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
