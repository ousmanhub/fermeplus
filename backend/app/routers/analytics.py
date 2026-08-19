from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app import models

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/soil-trends")
def get_soil_trends(parcelle_id: str = None, days: int = 30, db: Session = Depends(get_db)):
    """Évolution des analyses de sol (pH, N, P, K, humidité) sur les X derniers jours."""
    cutoff = datetime.now() - timedelta(days=days)
    q = db.query(models.SoilAnalysis).filter(models.SoilAnalysis.created_at >= cutoff)
    if parcelle_id:
        q = q.filter(models.SoilAnalysis.parcelle_id == parcelle_id)
    analyses = q.order_by(models.SoilAnalysis.created_at).all()
    
    return {
        "labels": [a.created_at.strftime("%Y-%m-%d") for a in analyses],
        "data": [
            {
                "date": a.created_at.strftime("%Y-%m-%d"),
                "parcelle_id": a.parcelle_id,
                "ph": a.ph,
                "nitrogen": a.nitrogen,
                "phosphorus": a.phosphorus,
                "potassium": a.potassium,
                "humidity": a.humidity,
            }
            for a in analyses
        ]
    }


@router.get("/stock-value")
def get_stock_value(db: Session = Depends(get_db)):
    """Valeur totale du stock par catégorie."""
    results = db.query(
        models.StockItem.category,
        func.sum(models.StockItem.quantity).label("total_quantity"),
        func.sum(models.StockItem.quantity * models.StockItem.cost_per_unit).label("total_value"),
        func.count(models.StockItem.id).label("item_count"),
    ).group_by(models.StockItem.category).all()
    
    total = db.query(
        func.sum(models.StockItem.quantity * models.StockItem.cost_per_unit).label("grand_total")
    ).scalar() or 0
    
    return {
        "categories": [
            {
                "category": r.category or "autre",
                "total_quantity": float(r.total_quantity or 0),
                "total_value": float(r.total_value or 0),
                "item_count": r.item_count,
            }
            for r in results
        ],
        "grand_total": float(total),
    }


@router.get("/activity-summary")
def get_activity_summary(days: int = 7, db: Session = Depends(get_db)):
    """Résumé des activités sur les X derniers jours."""
    cutoff = datetime.now() - timedelta(days=days)
    results = db.query(
        models.ActivityLog.action,
        func.count(models.ActivityLog.id).label("count"),
    ).filter(
        models.ActivityLog.created_at >= cutoff
    ).group_by(models.ActivityLog.action).all()
    
    by_entity = db.query(
        models.ActivityLog.entity_type,
        func.count(models.ActivityLog.id).label("count"),
    ).filter(
        models.ActivityLog.created_at >= cutoff
    ).group_by(models.ActivityLog.entity_type).all()
    
    return {
        "by_action": [{"action": r.action, "count": r.count} for r in results],
        "by_entity": [{"entity_type": r.entity_type, "count": r.count} for r in by_entity],
        "period_days": days,
    }


@router.get("/parcelle-kpi")
def get_parcelle_kpi(db: Session = Depends(get_db)):
    """KPI par parcelle : surface, analyses, alertes, activités."""
    parcelles = db.query(models.Parcel).all()
    
    kpis = []
    for p in parcelles:
        soil_count = db.query(models.SoilAnalysis).filter(models.SoilAnalysis.parcelle_id == p.parcelle_id).count()
        disease_count = db.query(models.DiseaseDetection).filter(models.DiseaseDetection.parcelle_id == p.parcelle_id).count()
        activity_count = db.query(models.ActivityLog).filter(models.ActivityLog.parcelle_id == p.parcelle_id).count()
        alert_count = db.query(models.Parcel).filter(models.Parcel.parcelle_id == p.parcelle_id, models.Parcel.soil_status != "ok").count()
        
        # Dernière analyse sol
        last_soil = db.query(models.SoilAnalysis).filter(
            models.SoilAnalysis.parcelle_id == p.parcelle_id
        ).order_by(models.SoilAnalysis.created_at.desc()).first()
        
        kpis.append({
            "parcelle_id": p.parcelle_id,
            "name": p.name,
            "area_ha": float(p.area_ha or 0),
            "crop": p.crop,
            "soil_status": p.soil_status,
            "soil_analysis_count": soil_count,
            "disease_count": disease_count,
            "activity_count": activity_count,
            "has_alert": p.soil_status != "ok",
            "last_ph": last_soil.ph if last_soil else None,
            "last_humidity": last_soil.humidity if last_soil else None,
        })
    
    return {"parcelles": kpis}


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """Vue d'ensemble : KPI globaux pour le dashboard."""
    total_parcelles = db.query(models.Parcel).count()
    total_soil_analyses = db.query(models.SoilAnalysis).count()
    total_stock_value = db.query(
        func.sum(models.StockItem.quantity * models.StockItem.cost_per_unit)
    ).scalar() or 0
    alert_parcels = db.query(models.Parcel).filter(models.Parcel.soil_status != "ok").count()
    recent_activities = db.query(models.ActivityLog).filter(
        models.ActivityLog.created_at >= datetime.now() - timedelta(days=7)
    ).count()
    
    return {
        "total_parcelles": total_parcelles,
        "total_soil_analyses": total_soil_analyses,
        "total_stock_value": float(total_stock_value),
        "alert_parcels": alert_parcels,
        "recent_activities": recent_activities,
    }
