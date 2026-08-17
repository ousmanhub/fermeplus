from app.database import SessionLocal, engine, Base
from app import models
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Supprimer les analyses de sol incohérentes (garde seulement P1-P4)
deleted = db.query(models.SoilAnalysis).filter(
    models.SoilAnalysis.parcelle_id.notin_(['P1', 'P2', 'P3', 'P4'])
).delete(synchronize_session=False)

# Supprimer et recréer proprement les 4 parcelles
existing = db.query(models.SoilAnalysis.parcelle_id).filter(
    models.SoilAnalysis.parcelle_id.in_(['P1', 'P2', 'P3', 'P4'])
).all()
existing_ids = {p[0] for p in existing}

parcelles = [
    ('P1', 'sableux'),
    ('P2', 'argileux'),
    ('P3', 'limoneux'),
    ('P4', 'sableux'),
]

for p, t in parcelles:
    if p in existing_ids:
        continue
    ph = round(random.uniform(5.0, 8.0), 1)
    n = round(random.uniform(5, 40), 1)
    pval = round(random.uniform(3, 25), 1)
    k = round(random.uniform(8, 35), 1)
    hum = round(random.uniform(10, 60), 1)

    tips = []
    if ph < 6.0:
        tips.append("pH acide : envisager du chaulage.")
    elif ph > 7.5:
        tips.append("pH alcalin : envisager du soufre agricole.")
    if n < 20:
        tips.append("Azote faible : apport d'engrais azoté.")
    if pval < 10:
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
        phosphorus=pval,
        potassium=k,
        humidity=hum,
        texture=t,
        recommendation=rec,
        created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
    ))

db.commit()
db.close()

print(f"🧹 {deleted} analyses incohérentes supprimées.")
print("✅ 4 analyses propres P1-P4 conservées/créées.")
