from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import auth, users # On importe nos deux nouveaux fichiers

# Création des tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUSION DES ROUTERS ---
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def home():
    return {"message": "API Client (User Service) est en ligne et structurée !"}