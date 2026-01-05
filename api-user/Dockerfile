# Dockerfile pour l'API Utilisateur (Auth/Users)
FROM python:3.11-slim

LABEL maintainer="Cloud Computing 5A"
LABEL description="API Utilisateur - Authentification et gestion des utilisateurs"

WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PORT=3000
ENV DATABASE_URL=postgresql://user:password@db:5432/calendar_db
ENV JWT_SECRET=change_me_in_production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')" || exit 1

# Lancer l'application
CMD ["python", "app.py"]
