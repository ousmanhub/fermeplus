from app.database import SessionLocal, engine, Base
from app import models
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Nettoyer anciennes données si besoin
# db.query(models.IoTSensor).delete()
# db.query(models.WeatherData).delete()
# db.query(models.DiseaseDetection).delete()
# db.query(models.SoilAnalysis).delete()

def add_soil():
    parcelles = ['P1', 'P2', 'P3', 'P4']
    textures = ['sableux', 'argileux', 'limoneux', 'sableux']
    for p, t in zip(parcelles, textures):
        ph = round(random.uniform(5.0, 8.0), 1)
        n = round(random.uniform(5, 40), 1)
        p = round(random.uniform(3, 25), 1)
        k = round(random.uniform(8, 35), 1)
        hum = round(random.uniform(10, 60), 1)

        tips = []
        if ph < 6.0:
            tips.append("pH acide : envisager du chaulage.")
        elif ph > 7.5:
            tips.append("pH alcalin : envisager du soufre agricole.")
        if n < 20:
            tips.append("Azote faible : apport d'engrais azoté.")
        if p < 10:
            tips.append("Phosphore faible : apport de superphosphate.")
        if k < 15:
            tips.append("Potassium faible : apport de sulfate de potassium.")
        if hum < 20:
            tips.append("Humidité faible : irrigation recommandée.")
        rec = " ".join(tips) if tips else "Sol équilibré."

        db.add(models.SoilAnalysis(
            parcelle_id=p,
            ph=ph,
            nitrogen=n,
            phosphorus=p,
            potassium=k,
            humidity=hum,
            texture=t,
            recommendation=rec,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
        ))


def add_diseases():
    diseases = [
        ('P1', 'Mildiou', 0.87, 'Taches jaunes sur les feuilles basses'),
        ('P2', None, None, 'Suspicion de rouille, photo floue'),
        ('P3', 'Cercosporiose', 0.72, 'Nécroses circulaires sur feuilles'),
    ]
    for parcelle, disease, conf, notes in diseases:
        db.add(models.DiseaseDetection(
            parcelle_id=parcelle,
            predicted_disease=disease,
            confidence=conf,
            notes=notes,
            image_path=None,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
        ))


def add_weather():
    for i in range(7):
        db.add(models.WeatherData(
            location='Ndjamena',
            temperature=round(random.uniform(28, 38), 1),
            humidity=round(random.uniform(30, 70), 1),
            wind_speed=round(random.uniform(1, 6), 1),
            rainfall=round(random.uniform(0, 8), 1),
            fetched_at=datetime.utcnow() - timedelta(days=i),
        ))


def add_iot():
    sensor_map = {
        'temp': ('TEMP-01', '°C'),
        'hum': ('HUM-01', '%'),
        'soil_moisture': ('SOIL-01', '%'),
        'rain': ('RAIN-01', 'mm'),
    }

    for parcelle in ['P1', 'P2']:
        for hour in range(48, 0, -1):
            for sensor_type, (sensor_id, unit) in sensor_map.items():
                if sensor_type == 'temp':
                    value = round(random.uniform(24, 35), 1)
                elif sensor_type == 'hum':
                    value = round(random.uniform(40, 80), 1)
                elif sensor_type == 'soil_moisture':
                    value = round(random.uniform(15, 45), 1)
                else:
                    value = round(random.uniform(0, 5), 1)

                db.add(models.IoTSensor(
                    sensor_id=sensor_id,
                    parcelle_id=parcelle,
                    sensor_type=sensor_type,
                    value=value,
                    unit=unit,
                    timestamp=datetime.utcnow() - timedelta(hours=hour),
                ))


if __name__ == "__main__":
    print("Insertion des données fictives Ferme+...")
    add_soil()
    add_diseases()
    add_weather()
    add_iot()
    db.commit()
    db.close()
    print("✅ Données insérées.")
