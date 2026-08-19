from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routers import soil, diseases, weather, iot, reports, alerts, irrigation, calendar, stock, activity, chat, parcels, analytics
import os
import hashlib
import secrets

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ferme+",
    description="Plateforme agriculture connectée",
    version="0.1.0",
)

allowed_origins = os.getenv("FERMEPLUS_CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth admin ─────────────────────────────────────────────────────────────

ADMIN_EMAIL = os.getenv("FERMEPLUS_ADMIN_EMAIL", "admin@smartstacks.dev")
ADMIN_PASSWORD_HASH = os.getenv(
    "FERMEPLUS_ADMIN_PASSWORD_HASH",
    "9c735c764b62f10575f6cd916e6259255a7b98475b1764b5c509c4c77bb9f98f"
)
sessions = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def require_auth(request: Request):
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if token in sessions:
        return sessions[token]
    return None

@app.options("/api/auth/login")
@app.post("/api/auth/login")
async def auth_login(request: Request):
    if request.method == "OPTIONS":
        return JSONResponse(content={})
    data = await request.json()
    email = data.get("email", "")
    password = data.get("password", "")
    if email != ADMIN_EMAIL or hash_password(password) != ADMIN_PASSWORD_HASH:
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})
    token = secrets.token_hex(32)
    sessions[token] = {"email": email, "role": "admin"}
    return {"token": token, "user": sessions[token]}

@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = require_auth(request)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return {"user": user}

@app.options("/api/auth/logout")
@app.post("/api/auth/logout")
async def auth_logout(request: Request):
    if request.method == "OPTIONS":
        return JSONResponse(content={})
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    if token in sessions:
        del sessions[token]
    return {"success": True}

# ─── Routers ────────────────────────────────────────────────────────────────

app.include_router(soil.router)
app.include_router(diseases.router)
app.include_router(weather.router)
app.include_router(iot.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(irrigation.router)
app.include_router(calendar.router)
app.include_router(stock.router)
app.include_router(activity.router)
app.include_router(chat.router)
app.include_router(parcels.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "Ferme+ API", "version": "0.1.0"}
