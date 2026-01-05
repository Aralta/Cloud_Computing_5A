# Dockerfile pour le service Web (Front + Back)
FROM python:3.11-slim

LABEL maintainer="Cloud Computing 5A"
LABEL description="Serveur web statique pour l'application calendrier"

WORKDIR /app

# Copier le serveur Python
COPY server.py .

# Copier les fichiers statiques
COPY static/ ./static/

# Exposer le port
EXPOSE 8080

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

# Lancer le serveur
CMD ["python", "server.py"]
