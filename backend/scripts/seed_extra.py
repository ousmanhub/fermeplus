import random
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Événements calendrier
events = [
    ('Semis mil P1', 'semis', 'P1', 2),
    ('Fertilisation P2', 'fertilisation', 'P2', 5),
    ('Irrigation P1', 'irrigation', 'P1', 1),
    ('Récolte niébé P3', 'recolte', 'P3', 45),
    ('Traitement pesticide P4', 'traitement', 'P4', 7),
]
for title, etype, parcelle, days in events:
    db.add(models.CalendarEvent(
        title=title,
        event_type=etype,
        parcelle_id=parcelle,
        event_date=datetime.utcnow() + timedelta(days=days),
        status='planifié',
        notes=f'Événement planifié pour {parcelle}',
    ))

# Stock initial
stocks = [
    ('Engrais NPK 20-10-10', 'engrais', 250, 'kg', 'P1', 12500),
    ('Semences mil', 'semence', 12, 'sac', None, 15000),
    ('Herbicide', 'pesticide', 8, 'L', 'P2', 8500),
    ('Bâche d\'irrigation', 'outil', 3, 'unité', None, 45000),
]
for name, cat, qty, unit, parcelle, cost in stocks:
    db.add(models.StockItem(
        name=name,
        category=cat,
        quantity=qty,
        unit=unit,
        parcelle_id=parcelle,
        cost_per_unit=cost,
        supplier='Fournisseur local',
        notes='Stock initial de démonstration',
    ))

db.commit()
db.close()
print("✅ Calendrier et stock de démo insérés.")
