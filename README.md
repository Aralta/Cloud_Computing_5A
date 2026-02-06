# 📅 Cloud Calendar - Cloud Computing 5A

Application de calendrier collaboratif déployée sur AWS avec une architecture microservices.

> 📄 **Rapport** : [Lien Overleaf](https://www.overleaf.com/8592434592tvycwyjqpbhr#451fac)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Application Load Balancer              │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                    │
│  ┌─────────────────────────┼─────────────────────────────────┐  │
│  │                    ECS Cluster                            │  │
│  │  ┌─────────┐    ┌─────────────┐    ┌──────────────┐       │  │
│  │  │   Web   │    │  API User   │    │  API Métier  │       │  │
│  │  │ :8080   │    │   :3000     │    │    :3001     │       │  │
│  │  └─────────┘    └──────┬──────┘    └──────┬───────┘       │  │
│  └────────────────────────┼──────────────────┼───────────────┘  │
│                           │                  │                  │
│  ┌────────────────────────┼──────────────────┼───────────────┐  │
│  │                    RDS PostgreSQL                         │  │
│  │            ┌───────────┴───────────┐                      │  │
│  │            │                       │                      │  │
│  │      users_db                events_db                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Structure du projet

```
Cloud_Computing_5A/
├── .env                    # Configuration centralisée
├── .env.example            # Template de configuration
├── api-user/               # API Authentification & Utilisateurs
│   ├── app.py              # Point d'entrée
│   ├── Dockerfile
│   └── src/
│       ├── routers/        # Routes (auth, users)
│       ├── models.py       # Modèles SQLAlchemy
│       ├── schemas.py      # Schémas Pydantic
│       └── security.py     # JWT & auth
├── api-metier/             # API Gestion des événements
│   ├── app.py              # Point d'entrée
│   ├── Dockerfile
│   └── src/
│       ├── routers/        # Routes (events)
│       ├── models.py       # Modèle Event
│       ├── schemas.py      # Schémas Pydantic
│       └── rights.py       # Gestion des droits
├── web/                    # Frontend + Serveur statique
│   ├── server.py           # Serveur HTTP Python
│   ├── Dockerfile
│   └── static/             # HTML, CSS, JS
├── docker/                 # Configuration Docker
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── init-db/            # Scripts SQL d'initialisation
└── terraform/              # Infrastructure AWS
    ├── vpc.tf              # Réseau
    ├── ecs.tf              # Cluster ECS
    ├── rds.tf              # Base de données
    ├── alb.tf              # Load Balancer
    └── ecr.tf              # Registry Docker
```

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Python 3.11+
- Terraform (pour le déploiement AWS)

### Lancement local avec Docker

```bash
# 1. Copier la configuration
cp .env.example .env

# 2. Lancer les services
cd docker
sudo docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 3. Accéder à l'application
# Web:        http://localhost:8080
# API User:   http://localhost:3000/docs
# API Métier: http://localhost:3001/docs
# Adminer:    http://localhost:8081
```

### Utilisateurs de test

| Email | Mot de passe |
|-------|--------------|
| `test@test.com` | `test123` |
| `admin@calendar.com` | `admin123` |

## 🔌 APIs

### API User (Port 3000)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion |
| `GET` | `/api/auth/me` | Utilisateur courant |
| `GET` | `/api/users` | Liste des utilisateurs |
| `GET` | `/api/users/{id}` | Détail utilisateur |
| `PUT` | `/api/users/{id}` | Modifier utilisateur |
| `DELETE` | `/api/users/{id}` | Supprimer utilisateur |

### API Métier (Port 3001)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/events` | Liste des événements |
| `POST` | `/api/events` | Créer un événement |
| `GET` | `/api/events/{id}` | Détail événement |
| `PUT` | `/api/events/{id}` | Modifier événement |
| `DELETE` | `/api/events/{id}` | Supprimer événement |

## ⚙️ Configuration

Variables d'environnement principales (`.env`) :

```env
# Base de données
POSTGRES_USER=calendar_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB_USER=users_db
POSTGRES_DB_METIER=events_db

# JWT
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Debug
DEBUG=0
```

## 🌐 Déploiement AWS

```bash
cd terraform

# 1. Configurer les variables
cp terraform.tfvars.example terraform.tfvars
# Éditer terraform.tfvars avec vos valeurs

# 2. Initialiser et déployer
terraform init
terraform plan
terraform apply
```

Voir [terraform/README.md](terraform/README.md) pour plus de détails.

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | FastAPI (Python 3.11) |
| **Frontend** | HTML/CSS/JS vanilla + FullCalendar |
| **Base de données** | PostgreSQL 15 |
| **Auth** | JWT (python-jose) |
| **Conteneurisation** | Docker |
| **Orchestration** | AWS ECS Fargate |
| **Infrastructure** | Terraform |

## 👥 Équipe

Projet réalisé dans le cadre du cours Cloud Computing - 5A

## 📝 Licence

MIT
