from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.utils.activity import log_activity

router = APIRouter(prefix="/parcels", tags=["parcels"])


@router.post("/", response_model=schemas.ParcelResponse)
def create_parcel(data: schemas.ParcelCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Parcel).filter(models.Parcel.parcelle_id == data.parcelle_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Parcelle déjà existante")
    parcel = models.Parcel(**data.model_dump())
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    log_activity(db, "create", "parcel", parcel.id, parcel.parcelle_id, f"Parcelle {parcel.name} créée")
    return parcel


@router.get("/", response_model=List[schemas.ParcelResponse])
def list_parcels(db: Session = Depends(get_db)):
    return db.query(models.Parcel).order_by(models.Parcel.parcelle_id).all()


@router.put("/{parcel_id}", response_model=schemas.ParcelResponse)
def update_parcel(parcel_id: int, data: schemas.ParcelCreate, db: Session = Depends(get_db)):
    parcel = db.query(models.Parcel).get(parcel_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    for key, value in data.model_dump().items():
        setattr(parcel, key, value)
    db.commit()
    db.refresh(parcel)
    log_activity(db, "update", "parcel", parcel.id, parcel.parcelle_id, f"Parcelle {parcel.name} mise à jour")
    return parcel


@router.delete("/{parcel_id}")
def delete_parcel(parcel_id: int, db: Session = Depends(get_db)):
    parcel = db.query(models.Parcel).get(parcel_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db.delete(parcel)
    db.commit()
    log_activity(db, "delete", "parcel", parcel_id, parcel.parcelle_id, f"Parcelle {parcel.name} supprimée")
    return {"ok": True}
