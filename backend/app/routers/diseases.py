from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/diseases", tags=["diseases"])


@router.post("/", response_model=schemas.DiseaseDetectionResponse)
def create_detection(data: schemas.DiseaseDetectionCreate, db: Session = Depends(get_db)):
    detection = models.DiseaseDetection(
        **data.model_dump(),
        image_path=None,
        predicted_disease=None,
        confidence=None,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    return detection


@router.get("/", response_model=List[schemas.DiseaseDetectionResponse])
def list_detections(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.DiseaseDetection).order_by(models.DiseaseDetection.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{detection_id}", response_model=schemas.DiseaseDetectionResponse)
def get_detection(detection_id: int, db: Session = Depends(get_db)):
    detection = db.query(models.DiseaseDetection).filter(models.DiseaseDetection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Détection non trouvée")
    return detection
