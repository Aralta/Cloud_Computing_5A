#!/usr/bin/env python3
"""
API Métier - Point d'entrée de l'application

Usage:
    python app.py                    # Mode développement
    uvicorn app:app --reload         # Mode développement avec rechargement
    uvicorn app:app --host 0.0.0.0   # Mode production
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from src.config import settings
from src.database import engine
from src import models
from src.routers import events
from src.routers import admin

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
app.include_router(admin.router)


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


if __name__ == "__main__":
    print(f"\n{'='*50}")
    print(f"🚀 API Métier démarrée sur http://0.0.0.0:3001")
    print(f"📚 Documentation: http://0.0.0.0:3001/docs")
    print(f"{'='*50}\n")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=3001,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug"
    )
