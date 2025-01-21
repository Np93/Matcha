from fastapi import FastAPI, Request
from app.routers import auth
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
