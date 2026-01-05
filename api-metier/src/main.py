"""
Application FastAPI principale - Point d'entrée de l'API Métier
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from .config import settings
from .database import engine
from . import models
from .routers import events

# Création des tables en base de données
models.Base.metadata.create_all(bind=engine)

# Initialisation de l'application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API de gestion des événements du calendrier",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour autoriser les requêtes cross-origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.include_router(events.router)


# ============================================
# Routes de base
# ============================================

@app.get("/")
def root():
    """Route racine - Information sur l'API"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "documentation": "/docs"
    }


@app.get("/health")
def health():
    """Health check pour les load balancers et monitoring"""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "timestamp": datetime.utcnow().isoformat()
    }
