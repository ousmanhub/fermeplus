from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["soil"])


def generate_recommendation(ph: float, n: float, p: float, k: float, humidity: float) -> str:
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
    if humidity < 20:
        tips.append("Humidité faible : irrigation recommandée.")
    return " ".join(tips) if tips else "Sol équilibré."


@router.post("/", response_model=schemas.SoilAnalysisResponse)
def create_analysis(data: schemas.SoilAnalysisCreate, db: Session = Depends(get_db)):
    recommendation = generate_recommendation(data.ph, data.nitrogen, data.phosphorus, data.potassium, data.humidity)
    analysis = models.SoilAnalysis(
        **data.model_dump(),
        recommendation=recommendation,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/", response_model=List[schemas.SoilAnalysisResponse])
def list_analyses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.SoilAnalysis).order_by(models.SoilAnalysis.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{analysis_id}", response_model=schemas.SoilAnalysisResponse)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(models.SoilAnalysis).filter(models.SoilAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    return analysis
