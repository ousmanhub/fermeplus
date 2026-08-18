from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import soil, diseases, weather, iot, reports, alerts, irrigation, calendar, stock, activity, chat, parcels
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ferme+",
    description="Plateforme agriculture connectée",
    version="0.1.0",
)

allowed_origins = os.getenv("FERMEPLUS_CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(soil.router)
app.include_router(diseases.router)
app.include_router(weather.router)
app.include_router(iot.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(irrigation.router)
app.include_router(calendar.router)
app.include_router(stock.router)
app.include_router(activity.router)
app.include_router(chat.router)
app.include_router(parcels.router)


@app.get("/")
def root():
    return {"message": "Ferme+ API", "version": "0.1.0"}
