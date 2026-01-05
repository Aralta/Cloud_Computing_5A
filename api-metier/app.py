#!/usr/bin/env python3
"""
API Métier - Point d'entrée de l'application

Ce fichier sert de point d'entrée pour lancer l'API avec Uvicorn.
La logique métier est dans le package src/.

Usage:
    python app.py                    # Mode développement
    uvicorn app:app --reload         # Mode développement avec rechargement
    uvicorn app:app --host 0.0.0.0   # Mode production
"""

import os
import uvicorn

# Import de l'application FastAPI depuis src/
from src.main import app

# Export pour uvicorn
__all__ = ["app"]


if __name__ == "__main__":
    # Configuration depuis les variables d'environnement
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 3001))
    debug = os.getenv("DEBUG", "0") == "1"
    
    print(f"\n{'='*50}")
    print(f"🚀 API Métier démarrée sur http://{host}:{port}")
    print(f"📚 Documentation: http://{host}:{port}/docs")
    print(f"{'='*50}\n")
    
    # Lancement du serveur
    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug"
    )
