import random
from datetime import datetime
from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Coordonnées approximatives autour de Ndjamena (12.13, 15.06)
parcels = [
    ('Parcelle Nord P1', 'P1', 12.1548, 15.0457, 3.5, 'Mil', 'ok', 'Sol équilibré, bonne humidité'),
    ('Parcelle Est P2', 'P2', 12.1248, 15.0757, 2.8, 'Sorgho', 'dry', 'Besoin d\'irrigation urgente'),
    ('Parcelle Sud P3', 'P3', 12.1148, 15.0357, 4.2, 'Niébé', 'disease', 'Cercosporiose détectée'),
    ('Parcelle Ouest P4', 'P4', 12.1448, 15.0157, 5.0, 'Arachide', 'acid', 'pH acide, chaulage recommandé'),
]

for name, pid, lat, lng, area, crop, status, notes in parcels:
    existing = db.query(models.Parcel).filter(models.Parcel.parcelle_id == pid).first()
    if not existing:
        db.add(models.Parcel(
            name=name,
            parcelle_id=pid,
            lat=lat,
            lng=lng,
            area_ha=area,
            crop=crop,
            soil_status=status,
            notes=notes,
        ))

db.commit()
db.close()
print("✅ Parcelles de démo insérées sur la carte.")
