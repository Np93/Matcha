from fastapi import FastAPI, Request
from app.routers import auth, profile, log, profiles_complete, chat, match, notifications, email_service
from app.config import settings
from app.utils.database import create_tables
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Ajouter le chemin racine du projet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Créer l'application FastAPI
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await create_tables()

# Ajouter le middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Origine autorisée (le frontend)
    allow_credentials=True,  # Autoriser l'utilisation des cookies
    allow_methods=["*"],  # Autoriser toutes les méthodes HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Autoriser tous les en-têtes (par ex. Authorization)
)

# Inclure les routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(log.router, prefix="/log", tags=["log"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(profiles_complete.router, prefix="/profiles_complete", tags=["profiles_complete"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(match.router, prefix="/match", tags=["match"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
# Inclure le routeur de confirmation d'email
app.include_router(email_service.router, prefix="/email", tags=["email"])