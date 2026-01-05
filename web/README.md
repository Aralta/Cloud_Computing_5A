# 🌐 Web - Serveur Frontend

Service web servant l'interface utilisateur de l'application calendrier.

## 📁 Structure

```
web/
├── server.py          # Serveur HTTP Python
├── Dockerfile         # Image Docker
└── static/            # Fichiers statiques
    ├── index.html     # Page principale (SPA)
    ├── style.css      # Styles CSS
    ├── main.js        # Point d'entrée JavaScript
    ├── api.js         # Client API (fetch wrapper)
    ├── auth.js        # Gestion authentification
    ├── calendar.js    # Logique calendrier FullCalendar
    ├── modal.js       # Gestion des modales
    └── users.js       # Sélection multi-utilisateurs
```

## 🚀 Lancement

### Local (développement)

```bash
python server.py
# ou avec un port personnalisé
python server.py 3000
```

Accéder à : http://localhost:8080

### Docker

```bash
# Build
docker build -t calendar-web .

# Run
docker run -p 8080:8080 calendar-web
```

## 🔧 Configuration

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 8080 | Port du serveur HTTP |

## 📡 Endpoints

| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/` | Page index.html |
| GET | `/health` | Health check |
| GET | `/api/info` | Infos serveur |
| GET | `/*.js, *.css, *.html` | Fichiers statiques |
| POST | `/api/echo` | Echo JSON (debug) |

## 🛠️ Technologies

- **Serveur** : Python 3.11 (http.server)
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Calendrier** : [FullCalendar](https://fullcalendar.io/) v6
- **Auth** : JWT Bearer Token (via API User)

## 🔗 Communication avec les APIs

Le frontend communique avec :
- **API User** (`/api/auth/*`, `/api/users/*`) : Authentification, gestion utilisateurs
- **API Métier** (`/api/events/*`) : CRUD événements calendrier

En production, l'ALB route automatiquement vers les bonnes APIs selon le path.
