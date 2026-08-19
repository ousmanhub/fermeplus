from fastapi import APIRouter, HTTPException
from app import schemas
import httpx
import os

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = """Tu es un assistant agricole pour Ferme+, une application d'agriculture connectée au Tchad/Sahel.
Réponds en français, de manière concise et pratique.
Tu aides sur : les sols (pH, NPK, humidité), les maladies des cultures, la météo, l'irrigation, le calendrier agricole et la gestion des stocks.
Ne fais pas de diagnostics médicaux. Pour les maladies graves, recommande de consulter un agronome."""


@router.post("/", response_model=schemas.ChatResponse)
def chat(req: schemas.ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return schemas.ChatResponse(reply="Je suis en mode démo. Pose-moi une question simple sur l'agriculture et je te répondrai avec des conseils généraux.")

    try:
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": req.message},
                ],
                "max_tokens": 500,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return schemas.ChatResponse(reply=data["choices"][0]["message"]["content"])
    except Exception as e:
        return schemas.ChatResponse(reply=f"Service LLM temporairement indisponible. Erreur : {str(e)[:100]}")
