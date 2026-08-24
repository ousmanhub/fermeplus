#!/usr/bin/env python3
"""Simulateur de réseau Meshtastic pour Ferme+ (sans matériel).

Simule N nodes capteurs autour de N'Djamena qui émettent périodiquement
des lectures (température, humidité, humidité du sol, batterie) vers
l'API Ferme+ /api/meshtastic/ingest.

Usage:
    python scripts/meshtastic_simulator.py [--api http://localhost:8000] [--interval 30] [--nodes 5] [--once]

Le gateway réel (meshtastic_gateway.py, V1) enverra exactement le même
format JSON — le simulateur sert de source de test.
"""
import argparse
import json
import random
import time
import urllib.request
from datetime import datetime, timezone

# Positions de démo autour de N'Djamena
NDJAMENA = (12.1348, 15.0557)
PARCELLES = [
    ("parcelle_nord", 12.1500, 15.0500, "Champ de mil"),
    ("parcelle_sud", 12.1150, 15.0620, "Marais salants"),
    ("parcelle_est", 12.1400, 15.0900, "Coton"),
    ("parcelle_ouest", 12.1300, 15.0200, "Sorgho"),
    ("parcelle_centre", 12.1348, 15.0557, "Verger mango"),
]

NODE_PREFIXES = ["FIELD", "NODE", "SENS", "MESH"]


def hex_id() -> str:
    return "!" + "".join(random.choice("0123456789abcdef") for _ in range(8))


def make_node(idx: int) -> dict:
    parcelle = PARCELLES[idx % len(PARCELLES)]
    return {
        "node_id": f"!{NODE_PREFIXES[idx % len(NODE_PREFIXES)]}{idx:02d}{random.randint(100, 999):x}",
        "node_name": f"{parcelle[0]}_{idx + 1}",
        "role": random.choice(["client", "client", "sensor", "router"]),
        "parcelle_id": parcelle[0],
        "lat": parcelle[1] + random.uniform(-0.005, 0.005),
        "lon": parcelle[2] + random.uniform(-0.005, 0.005),
        "battery_pct": random.uniform(55, 100),
    }


def make_reading(node: dict, tick: int) -> dict:
    """Génère une lecture réaliste (cycle jour/nuit simplifié)."""
    hour = datetime.now(timezone.utc).hour + tick * 0.1
    # température : 22°C la nuit, 42°C l'après-midi (saison sèche)
    temp = 27 + 8 * max(0, -((hour - 14) ** 2) / 30 + 1) + random.uniform(-1.5, 1.5)
    # humidité : inverse de la température
    hum = max(12, 65 - (temp - 24) * 2 + random.uniform(-4, 4))
    # humidité du sol : décroît lentement, remonte quand on arrose (random)
    soil = random.uniform(18, 55)
    return {
        "type": "sensor_reading",
        "sensor_id": f"{node['node_name']}_ENV",
        "node_id": node["node_id"],
        "node_name": node["node_name"],
        "role": node["role"],
        "parcelle_id": node["parcelle_id"],
        "lat": round(node["lat"], 5),
        "lon": round(node["lon"], 5),
        "values": {
            "temperature_c": round(temp, 1),
            "humidity_pct": round(hum, 1),
            "soil_moisture_pct": round(soil, 1),
        },
        "battery_pct": round(max(3, node["battery_pct"] - tick * 0.01), 1),
        "ts": datetime.now(timezone.utc).isoformat(),
        "rssi": round(random.uniform(-115, -75), 1),
        "snr": round(random.uniform(-15, 12), 1),
        "hops_away": random.choice([0, 0, 1, 1, 2]),
    }


def send(api: str, payload: dict) -> bool:
    try:
        req = urllib.request.Request(
            f"{api}/api/meshtastic/ingest",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            return body.get("status") == "ok"
    except Exception as e:
        print(f"  ERREUR envoi: {e}")
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8000")
    ap.add_argument("--interval", type=float, default=30, help="secondes entre les lectures")
    ap.add_argument("--nodes", type=int, default=5)
    ap.add_argument("--once", action="store_true", help="une seule salve puis quitte")
    args = ap.parse_args()

    nodes = [make_node(i) for i in range(args.nodes)]
    print(f"Simulateur Meshtastic — {len(nodes)} nodes, API {args.api}")
    for n in nodes:
        print(f"  {n['node_id']} ({n['node_name']}) → {n['parcelle_id']}")

    tick = 0
    while True:
        print(f"\n[Salve {tick + 1}] {datetime.now().strftime('%H:%M:%S')}")
        ok = 0
        for node in nodes:
            reading = make_reading(node, tick)
            if send(args.api, reading):
                ok += 1
                v = reading["values"]
                print(f"  ✓ {node['node_name']}: {v['temperature_c']}°C, "
                      f"hum {v['humidity_pct']}%, sol {v['soil_moisture_pct']}%")
            # petit délai aléatoire pour simuler le mesh
            time.sleep(random.uniform(0.05, 0.3))
        print(f"  → {ok}/{len(nodes)} messages livrés")

        if args.once:
            break
        tick += 1
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
