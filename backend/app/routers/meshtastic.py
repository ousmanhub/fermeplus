"""Router Meshtastic — réseau mesh off-grid pour capteurs agricoles.

Endpoints REST + ingestion de messages depuis le gateway (ou le simulateur).
Sans matériel : les données viennent de POST /ingest (simulateur).
Avec matériel : le daemon meshtastic_gateway.py fait la même chose via le SDK.
"""
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    MeshtasticNode,
    MeshtasticMessage,
    MeshtasticSensorReading,
)

router = APIRouter()

# Mapping des métriques du format payload -> (metric, unit)
METRIC_MAP = {
    "temperature_c": ("temperature", "°C"),
    "humidity_pct": ("humidity", "%"),
    "soil_moisture_pct": ("soil_moisture", "%"),
    "battery_pct": ("battery", "%"),
}


class MeshIngest(BaseModel):
    """Message reçu du mesh (format JSON du canal texte)."""
    type: str = Field(default="sensor_reading")  # sensor_reading | alert | position | ping
    sensor_id: str = ""
    node_id: str = Field(..., description="ex: !a1b2c3d4")
    node_name: str = ""
    role: str = "client"
    parcelle_id: str = ""
    lat: float | None = None
    lon: float | None = None
    values: dict = Field(default_factory=dict)
    battery_pct: float | None = None
    text: str = ""
    ts: str = ""
    rssi: float | None = None
    snr: float | None = None
    hops_away: int = 0


def _upsert_node(db: Session, msg: MeshIngest) -> MeshtasticNode:
    """Crée ou met à jour le node (last_seen, batterie, position)."""
    node = db.query(MeshtasticNode).filter(MeshtasticNode.node_id == msg.node_id).first()
    now = datetime.utcnow()
    if node is None:
        node = MeshtasticNode(
            node_id=msg.node_id,
            name=msg.node_name or msg.sensor_id or msg.node_id,
            role=msg.role,
            parcelle_id=msg.parcelle_id or None,
        )
        db.add(node)
    # mise à jour
    node.last_seen = now
    if msg.node_name:
        node.name = msg.node_name
    if msg.role:
        node.role = msg.role
    if msg.parcelle_id:
        node.parcelle_id = msg.parcelle_id
    if msg.lat is not None:
        node.lat = msg.lat
    if msg.lon is not None:
        node.lon = msg.lon
    if msg.battery_pct is not None:
        node.battery_pct = msg.battery_pct
    if msg.rssi is not None:
        node.rssi = msg.rssi
    if msg.snr is not None:
        node.snr = msg.snr
    if msg.hops_away is not None:
        node.hops_away = msg.hops_away
    return node


@router.post("/ingest")
def ingest_message(msg: MeshIngest, db: Session = Depends(get_db)):
    """Ingestion d'un message mesh (appelé par le gateway ou le simulateur)."""
    node = _upsert_node(db, msg)

    # Stocke le message brut
    payload = msg.model_dump(exclude_none=True)
    db.add(MeshtasticMessage(
        node_id=msg.node_id,
        channel="primary",
        portnum=msg.type if msg.type != "sensor_reading" else "telemetry",
        payload=json.dumps(payload, ensure_ascii=False),
        rssi=msg.rssi,
        snr=msg.snr,
    ))

    # Stocke les lectures capteurs
    readings = []
    for key, val in msg.values.items():
        if key not in METRIC_MAP or not isinstance(val, (int, float)):
            continue
        metric, unit = METRIC_MAP[key]
        ts = _parse_ts(msg.ts)
        reading = MeshtasticSensorReading(
            sensor_id=msg.sensor_id or f"{msg.node_id}_sensor",
            node_id=msg.node_id,
            parcelle_id=msg.parcelle_id or node.parcelle_id,
            metric=metric,
            value=float(val),
            unit=unit,
            timestamp=ts,
        )
        db.add(reading)
        readings.append({"metric": metric, "value": float(val), "unit": unit})

    db.commit()
    return {
        "status": "ok",
        "node": node.node_id,
        "readings_stored": len(readings),
    }


def _parse_ts(ts: str) -> datetime:
    if not ts:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return datetime.utcnow()


@router.get("/nodes")
def list_nodes(
    active_within_min: int = Query(default=120, description="fenêtre d'activité"),
    db: Session = Depends(get_db),
):
    """Nodes actifs (last_seen dans la fenêtre)."""
    threshold = datetime.utcnow() - timedelta(minutes=active_within_min)
    nodes = db.query(MeshtasticNode).order_by(desc(MeshtasticNode.last_seen)).all()
    result = []
    for n in nodes:
        active = n.last_seen and n.last_seen >= threshold
        result.append({
            "node_id": n.node_id,
            "name": n.name,
            "role": n.role,
            "parcelle_id": n.parcelle_id,
            "last_seen": n.last_seen.isoformat() if n.last_seen else None,
            "battery_pct": n.battery_pct,
            "lat": n.lat,
            "lon": n.lon,
            "hops_away": n.hops_away,
            "snr": n.snr,
            "rssi": n.rssi,
            "active": bool(active),
        })
    return {"count": len(result), "nodes": result}


@router.get("/nodes/{node_id}")
def get_node(node_id: str, db: Session = Depends(get_db)):
    """Détails d'un node + dernières lectures."""
    node = db.query(MeshtasticNode).filter(MeshtasticNode.node_id == node_id).first()
    if node is None:
        raise HTTPException(status_code=404, detail="Node inconnu")
    readings = (
        db.query(MeshtasticSensorReading)
        .filter(MeshtasticSensorReading.node_id == node_id)
        .order_by(desc(MeshtasticSensorReading.timestamp))
        .limit(20)
        .all()
    )
    return {
        "node_id": node.node_id,
        "name": node.name,
        "role": node.role,
        "parcelle_id": node.parcelle_id,
        "last_seen": node.last_seen.isoformat() if node.last_seen else None,
        "battery_pct": node.battery_pct,
        "lat": node.lat,
        "lon": node.lon,
        "readings": [
            {
                "sensor_id": r.sensor_id,
                "metric": r.metric,
                "value": r.value,
                "unit": r.unit,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in readings
        ],
    }


@router.get("/messages")
def list_messages(
    limit: int = Query(default=50, le=500),
    node_id: str | None = None,
    db: Session = Depends(get_db),
):
    """Messages reçus, les plus récents d'abord."""
    q = db.query(MeshtasticMessage).order_by(desc(MeshtasticMessage.received_at))
    if node_id:
        q = q.filter(MeshtasticMessage.node_id == node_id)
    msgs = q.limit(limit).all()
    return {
        "count": len(msgs),
        "messages": [
            {
                "id": m.id,
                "node_id": m.node_id,
                "portnum": m.portnum,
                "payload": json.loads(m.payload) if m.payload else {},
                "rssi": m.rssi,
                "snr": m.snr,
                "received_at": m.received_at.isoformat() if m.received_at else None,
            }
            for m in msgs
        ],
    }


@router.get("/readings")
def list_readings(
    parcelle_id: str | None = None,
    metric: str | None = None,
    hours: int = Query(default=24, le=720),
    limit: int = Query(default=500, le=2000),
    db: Session = Depends(get_db),
):
    """Lectures capteurs (filtrables par parcelle, métrique, fenêtre)."""
    threshold = datetime.utcnow() - timedelta(hours=hours)
    q = db.query(MeshtasticSensorReading).filter(
        MeshtasticSensorReading.timestamp >= threshold
    )
    if parcelle_id:
        q = q.filter(MeshtasticSensorReading.parcelle_id == parcelle_id)
    if metric:
        q = q.filter(MeshtasticSensorReading.metric == metric)
    readings = q.order_by(desc(MeshtasticSensorReading.timestamp)).limit(limit).all()
    return {
        "count": len(readings),
        "readings": [
            {
                "sensor_id": r.sensor_id,
                "node_id": r.node_id,
                "parcelle_id": r.parcelle_id,
                "metric": r.metric,
                "value": r.value,
                "unit": r.unit,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in readings
        ],
    }


@router.post("/send")
def send_message(
    text: str = Query(..., description="texte à envoyer sur le mesh"),
    db: Session = Depends(get_db),
):
    """Envoi d'un message sur le mesh.
    V0 simulateur : stocké localement, marqué 'simulated'.
    V1 : branché sur le gateway réel via le SDK meshtastic.
    """
    db.add(MeshtasticMessage(
        node_id="!gateway",
        channel="primary",
        portnum="text",
        payload=json.dumps({"type": "outgoing", "text": text}, ensure_ascii=False),
    ))
    db.commit()
    return {"status": "queued", "text": text, "note": "mode simulateur — gateway non connecté"}
