from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SoilAnalysisBase(BaseModel):
    parcelle_id: str
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    humidity: float
    texture: Optional[str] = None


class SoilAnalysisCreate(SoilAnalysisBase):
    pass


class SoilAnalysisResponse(SoilAnalysisBase):
    id: int
    recommendation: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DiseaseDetectionBase(BaseModel):
    parcelle_id: str
    predicted_disease: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None


class DiseaseDetectionCreate(BaseModel):
    parcelle_id: str
    notes: Optional[str] = None


class DiseaseDetectionResponse(DiseaseDetectionBase):
    id: int
    image_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class WeatherDataBase(BaseModel):
    location: str
    temperature: float
    humidity: float
    wind_speed: float
    rainfall: float
    forecast_date: Optional[datetime] = None


class WeatherDataResponse(WeatherDataBase):
    id: int
    fetched_at: datetime

    class Config:
        from_attributes = True


class WeatherForecast(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    humidity: float
    rainfall: float
    description: str
    icon: str


class AlertItem(BaseModel):
    level: str
    category: str
    parcelle_id: str
    message: str
    created_at: datetime


class IrrigationPlan(BaseModel):
    parcelle_id: str
    soil_humidity: float
    rain_next_3_days: float
    recommendation: str
    priority: str
    suggested_duration_minutes: int


class CalendarEventBase(BaseModel):
    title: str
    event_type: str
    parcelle_id: str
    event_date: datetime
    status: str = "planifié"
    notes: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventResponse(CalendarEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StockItemBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    parcelle_id: Optional[str] = None
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None


class StockItemCreate(StockItemBase):
    pass


class StockItemResponse(StockItemBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityLogItem(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    parcelle_id: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    reply: str


class ParcelBase(BaseModel):
    name: str
    parcelle_id: str
    lat: float
    lng: float
    area_ha: Optional[float] = None
    crop: Optional[str] = None
    soil_status: str = "ok"
    notes: Optional[str] = None


class ParcelCreate(ParcelBase):
    pass


class ParcelResponse(ParcelBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IoTSensorBase(BaseModel):
    sensor_id: str
    parcelle_id: str
    sensor_type: str
    value: float
    unit: str


class IoTSensorCreate(IoTSensorBase):
    pass


class IoTSensorResponse(IoTSensorBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
