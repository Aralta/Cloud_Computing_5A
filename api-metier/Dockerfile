FROM python:3.11-slim

LABEL maintainer="Cloud Computing 5A"
LABEL description="API Métier - Gestion des événements calendrier"

WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source (sans le .env local)
COPY app.py .
COPY src/ ./src/

# Variables d'environnement par défaut
ENV HOST=0.0.0.0
ENV PORT=3001
ENV DEBUG=0
ENV PYTHONUNBUFFERED=1

# Exposition du port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3001/health')" || exit 1

# Commande de démarrage
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "3001"]
