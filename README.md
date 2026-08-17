# Ferme+

Agriculture connectée — FastAPI + React + SQLite.

## Modules
- **Sols** : analyses pH, NPK, humidité, recommandations
- **Maladies** : détection de maladies des cultures (placeholder image upload)
- **Météo** : OpenWeatherMap API
- **IoT** : ingestion de capteurs + historique 24h

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables d'environnement
```bash
OPENWEATHER_API_KEY=          # optionnel
FERMEPLUS_DATABASE_URL=sqlite:///./fermeplus.db
```
