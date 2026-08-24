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


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    event_type = Column(String, index=True)  # semis, fertilisation, irrigation, recolte, traitement, autre
    parcelle_id = Column(String, index=True)
    event_date = Column(DateTime(timezone=True))
    status = Column(String, default="planifié")  # planifié, en_cours, terminé, reporté
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)  # engrais, semence, pesticide, outil, autre
    quantity = Column(Float)
    unit = Column(String)
    parcelle_id = Column(String, index=True, nullable=True)
    cost_per_unit = Column(Float, nullable=True)
    supplier = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, index=True)
    entity_type = Column(String, index=True)  # soil, disease, weather, iot, calendar, stock, etc.
    entity_id = Column(Integer, nullable=True)
    parcelle_id = Column(String, index=True, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)  # user, assistant
    content = Column(Text)
    session_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parcelle_id = Column(String, unique=True, index=True)
    lat = Column(Float)  # centre
    lng = Column(Float)
    area_ha = Column(Float, nullable=True)
    crop = Column(String, nullable=True)
    soil_status = Column(String, default="ok")  # ok, dry, acid, disease
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Meshtastic (off-grid mesh) ──────────────────────────────────────────────

class MeshtasticNode(Base):
    __tablename__ = "meshtastic_nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True)  # ex: !a1b2c3d4
    name = Column(String, nullable=True)
    role = Column(String, default="client")  # client, router, sensor
    parcelle_id = Column(String, index=True, nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    battery_pct = Column(Float, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    hops_away = Column(Integer, default=0)
    snr = Column(Float, nullable=True)
    rssi = Column(Float, nullable=True)


class MeshtasticMessage(Base):
    __tablename__ = "meshtastic_messages"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, index=True)
    channel = Column(String, default="primary")
    portnum = Column(String, default="text")  # text, telemetry, position
    payload = Column(Text)  # JSON brut
    from_hop_limit = Column(Integer, nullable=True)
    rssi = Column(Float, nullable=True)
    snr = Column(Float, nullable=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())


class MeshtasticSensorReading(Base):
    __tablename__ = "meshtastic_sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True)
    node_id = Column(String, index=True)
    parcelle_id = Column(String, index=True, nullable=True)
    metric = Column(String, index=True)  # temperature, humidity, soil_moisture, battery...
    value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime(timezone=True), index=True)
