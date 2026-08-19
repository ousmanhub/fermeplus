from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.utils.activity import log_activity

router = APIRouter(tags=["stock"])


@router.post("/", response_model=schemas.StockItemResponse)
def create_item(data: schemas.StockItemCreate, db: Session = Depends(get_db)):
    item = models.StockItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    log_activity(
        db,
        action="create",
        entity_type="stock",
        entity_id=item.id,
        parcelle_id=item.parcelle_id,
        details=f"Stock '{item.name}' créé : {item.quantity} {item.unit}",
    )
    return item


@router.get("/", response_model=List[schemas.StockItemResponse])
def list_items(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.StockItem).order_by(models.StockItem.updated_at.desc())
    if category:
        q = q.filter(models.StockItem.category == category)
    return q.all()


@router.put("/{item_id}", response_model=schemas.StockItemResponse)
def update_item(item_id: int, data: schemas.StockItemCreate, db: Session = Depends(get_db)):
    item = db.query(models.StockItem).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    log_activity(
        db,
        action="update",
        entity_type="stock",
        entity_id=item.id,
        parcelle_id=item.parcelle_id,
        details=f"Stock '{item.name}' mis à jour : {item.quantity} {item.unit}",
    )
    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.StockItem).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    db.delete(item)
    db.commit()
    log_activity(
        db,
        action="delete",
        entity_type="stock",
        entity_id=item_id,
        parcelle_id=item.parcelle_id,
        details=f"Stock '{item.name}' supprimé",
    )
    return {"ok": True}


@router.post("/{item_id}/consume")
def consume_item(item_id: int, quantity: float, db: Session = Depends(get_db)):
    item = db.query(models.StockItem).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if item.quantity < quantity:
        raise HTTPException(status_code=400, detail="Stock insuffisant")
    item.quantity -= quantity
    db.commit()
    db.refresh(item)
    log_activity(
        db,
        action="consume",
        entity_type="stock",
        entity_id=item.id,
        parcelle_id=item.parcelle_id,
        details=f"{quantity} {item.unit} de '{item.name}' consommés",
    )
    return item
