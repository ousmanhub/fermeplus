#!/usr/bin/env python3
"""
Script de seed pour remplir la base Ferme+ avec des données de démo.
Exécution : python seed_demo_data.py
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Ajouter le path pour importer les modèles
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models

# Recréer les tables si besoin
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🌱 Seed des données Ferme+...")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Parcelles
# ─────────────────────────────────────────────────────────────────────────────
parcelles_data = [
    {"name": "Parcelle Nord", "parcelle_id": "P1", "lat": 12.135, "lng": 15.045, "area_ha": 5.5, "crop": "Maïs", "soil_status": "ok"},
    {"name": "Parcelle Sud", "parcelle_id": "P2", "lat": 12.132, "lng": 15.048, "area_ha": 3.2, "crop": "Sorgho", "soil_status": "dry"},
    {"name": "Parcelle Est", "parcelle_id": "P3", "lat": 12.138, "lng": 15.050, "area_ha": 4.0, "crop": "Mil", "soil_status": "ok"},
    {"name": "Parcelle Ouest", "parcelle_id": "P4", "lat": 12.130, "lng": 15.040, "area_ha": 2.8, "crop": "Arachide", "soil_status": "acid"},
    {"name": "Jardin Maraîcher", "parcelle_id": "P5", "lat": 12.134, "lng": 15.043, "area_ha": 1.5, "crop": "Tomates", "soil_status": "ok"},
]

for p in parcelles_data:
    existing = db.query(models.Parcel).filter(models.Parcel.parcelle_id == p["parcelle_id"]).first()
    if not existing:
        parcel = models.Parcel(**p)
        db.add(parcel)
        print(f"  ✅ Parcelle créée : {p['name']} ({p['area_ha']} ha)")

db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Analyses de sol (sur les 30 derniers jours)
# ─────────────────────────────────────────────────────────────────────────────
soil_data = []
base_date = datetime.now()

for parcelle_id in ["P1", "P2", "P3", "P4", "P5"]:
    for days_ago in [0, 7, 14, 21, 28]:
        date = base_date - timedelta(days=days_ago)
        # Variation réaliste selon la parcelle
        if parcelle_id == "P2":  # Parcelle sèche
            humidity = random.uniform(12, 18)
            ph = random.uniform(6.0, 6.5)
        elif parcelle_id == "P4":  # Parcelle acide
            humidity = random.uniform(25, 35)
            ph = random.uniform(5.2, 5.8)
        else:
            humidity = random.uniform(25, 35)
            ph = random.uniform(6.2, 6.8)
        
        analysis = models.SoilAnalysis(
            parcelle_id=parcelle_id,
            ph=round(ph if parcelle_id != "P4" else random.uniform(5.2, 5.8), 1),
            nitrogen=random.uniform(25, 45),
            phosphorus=random.uniform(15, 25),
            potassium=random.uniform(18, 30),
            humidity=round(humidity, 1),
            texture=random.choice(["Argileuse", "Limoneuse", "Sableuse"]),
            recommendation="Sol équilibré." if random.random() > 0.3 else "Apport recommandé.",
            created_at=date,
        )
        db.add(analysis)
        soil_data.append(analysis)

print(f"  ✅ {len(soil_data)} analyses de sol créées")
db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# 3. Stocks
# ─────────────────────────────────────────────────────────────────────────────
stock_data = [
    {"name": "Urée 46%", "category": "engrais", "quantity": 150, "unit": "kg", "cost_per_unit": 250, "supplier": "AgroChad", "parcelle_id": None},
    {"name": "NPK 15-15-15", "category": "engrais", "quantity": 80, "unit": "kg", "cost_per_unit": 300, "supplier": "AgroChad", "parcelle_id": None},
    {"name": "Semences Maïs", "category": "semence", "quantity": 25, "unit": "kg", "cost_per_unit": 1200, "supplier": "SemenChad", "parcelle_id": "P1"},
    {"name": "Semences Sorgho", "category": "semence", "quantity": 15, "unit": "kg", "cost_per_unit": 800, "supplier": "SemenChad", "parcelle_id": "P2"},
    {"name": "Pesticide Lambda", "category": "pesticide", "quantity": 5, "unit": "L", "cost_per_unit": 4500, "supplier": "PhytoAfrica", "parcelle_id": None},
    {"name": "Fongicide Cuivre", "category": "pesticide", "quantity": 8, "unit": "kg", "cost_per_unit": 3200, "supplier": "PhytoAfrica", "parcelle_id": None},
    {"name": "Bêche", "category": "outil", "quantity": 6, "unit": "unités", "cost_per_unit": 8000, "supplier": "Quincaillerie N'Djaména", "parcelle_id": None},
    {"name": "Arrosoir 10L", "category": "outil", "quantity": 10, "unit": "unités", "cost_per_unit": 3500, "supplier": "Quincaillerie N'Djaména", "parcelle_id": None},
    {"name": "Système irrigation goutte-à-goutte", "category": "équipement", "quantity": 2, "unit": "kits", "cost_per_unit": 45000, "supplier": "IrrigTech", "parcelle_id": "P5"},
]

for s in stock_data:
    existing = db.query(models.StockItem).filter(
        models.StockItem.name == s["name"],
        models.StockItem.parcelle_id == s.get("parcelle_id")
    ).first()
    if not existing:
        item = models.StockItem(**s)
        db.add(item)

print(f"  ✅ {len(stock_data)} articles de stock créés")
db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# 4. Activités (journal)
# ─────────────────────────────────────────────────────────────────────────────
activities = [
    {"action": "create", "entity_type": "soil", "details": "Analyse sol Parcelle Nord"},
    {"action": "create", "entity_type": "stock", "details": "Ajout stock engrais"},
    {"action": "update", "entity_type": "stock", "details": "Mise à jour quantité"},
    {"action": "consume", "entity_type": "stock", "details": "Consommation engrais P1"},
    {"action": "create", "entity_type": "calendar", "details": "Planification irrigation"},
    {"action": "create", "entity_type": "disease", "details": "Détection maladie tomates"},
    {"action": "update", "entity_type": "parcel", "details": "Mise à jour statut sol"},
    {"action": "create", "entity_type": "iot", "details": "Installation capteur humidité"},
]

for i, act in enumerate(activities):
    for days_ago in range(min(7, len(activities))):
        activity = models.ActivityLog(
            action=act["action"],
            entity_type=act["entity_type"],
            entity_id=random.randint(1, 20),
            parcelle_id=random.choice(["P1", "P2", "P3", "P4", "P5"]),
            details=act["details"],
            created_at=datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23)),
        )
        db.add(activity)

print(f"  ✅ {len(activities) * 7} activités créées")
db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# 5. Détections de maladies
# ─────────────────────────────────────────────────────────────────────────────
diseases = [
    {"parcelle_id": "P5", "predicted_disease": "Mildiou", "confidence": 0.87, "notes": "Taches jaunes sur feuilles"},
    {"parcelle_id": "P2", "predicted_disease": "Charbon du sorgho", "confidence": 0.72, "notes": "Épis noircis"},
    {"parcelle_id": "P4", "predicted_disease": "Rosette de l'arachide", "confidence": 0.65, "notes": "Feuilles décolorées"},
]

for d in diseases:
    detection = models.DiseaseDetection(
        parcelle_id=d["parcelle_id"],
        image_path=f"/uploads/disease_{d['parcelle_id']}_{datetime.now().strftime('%Y%m%d')}.jpg",
        predicted_disease=d["predicted_disease"],
        confidence=d["confidence"],
        notes=d["notes"],
        created_at=datetime.now() - timedelta(days=random.randint(1, 10)),
    )
    db.add(detection)

print(f"  ✅ {len(diseases)} détections de maladies créées")
db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# 6. Données IoT (capteurs)
# ─────────────────────────────────────────────────────────────────────────────
for parcelle_id in ["P1", "P2", "P3", "P5"]:
    for hours_ago in range(0, 48, 2):  # Toutes les 2h sur 48h
        sensor = models.IoTSensor(
            sensor_id=f"SENSOR_{parcelle_id}",
            parcelle_id=parcelle_id,
            sensor_type="humidity",
            value=random.uniform(20, 40) if parcelle_id != "P2" else random.uniform(10, 20),
            unit="%",
            timestamp=datetime.now() - timedelta(hours=hours_ago),
        )
        db.add(sensor)

print(f"  ✅ {4 * 24} lectures IoT créées")
db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# Résumé
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("✅ SEED TERMINÉ")
print("="*60)
print(f"   Parcelles        : {db.query(models.Parcel).count()}")
print(f"   Analyses sol     : {db.query(models.SoilAnalysis).count()}")
print(f"   Articles stock   : {db.query(models.StockItem).count()}")
print(f"   Activités        : {db.query(models.ActivityLog).count()}")
print(f"   Maladies         : {db.query(models.DiseaseDetection).count()}")
print(f"   Capteurs IoT     : {db.query(models.IoTSensor).count()}")
print("="*60)
print("\n📊 Dashboard Analytics prêt à être consulté !")
print("   URL : https://fermeplus.smartstacks.dev")
print("   Onglet : Analyses")

db.close()
