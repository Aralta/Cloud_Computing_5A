# 🏗️ Infrastructure Terraform - Application Calendar

Infrastructure as Code (IaC) pour déployer l'application Calendar sur AWS avec Terraform.

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Architecture](#-architecture)
- [Structure des fichiers](#-structure-des-fichiers)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Variables](#-variables)
- [Outputs](#-outputs)
- [Optimisations AWS Academy](#-optimisations-aws-academy)
- [Coûts estimés](#-coûts-estimés)
- [Commandes utiles](#-commandes-utiles)
- [Dépannage](#-dépannage)
- [Nettoyage](#-nettoyage)

---

## 🔧 Prérequis

| Outil | Version | Description |
|-------|---------|-------------|
| **Terraform** | >= 1.0 | Infrastructure as Code |
| **AWS CLI** | >= 2.0 | Interface ligne de commande AWS |
| **Docker** | >= 20.0 | Conteneurisation des applications |

### Configuration AWS

```bash
# Configurer les credentials AWS Academy
aws configure
# AWS Access Key ID: <votre_access_key>
# AWS Secret Access Key: <votre_secret_key>
# Default region name: us-east-1
# Default output format: json

# Vérifier la configuration
aws sts get-caller-identity
```

---

## 🏛️ Architecture

```
                           ┌─────────────────┐
                           │    Internet     │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │       ALB       │
                           │  (Port 80/443)  │
                           └────────┬────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
   ┌───────────┐            ┌─────────────┐            ┌────────────┐
   │    Web    │            │ API Métier  │            │  API User  │
   │   :8080   │◄──────────►│    :3001    │            │   :3000    │
   │  (Fargate)│            │  (Fargate)  │            │  (Fargate) │
   └───────────┘            └──────┬──────┘            └─────┬──────┘
                                   │                         │
        ┌──────────────────────────┼─────────────────────────┤
        │                          │                         │
        │                  ┌───────▼───────┐         ┌───────▼───────┐
        │                  │  RDS Events   │         │   RDS Users   │
        │                  │ (PostgreSQL)  │         │ (PostgreSQL)  │
        │                  │    :5432      │         │    :5432      │
        │                  └───────────────┘         └───────────────┘
        │                    (Private Subnet)          (Private Subnet)
        │
   ┌────▼─────┐
   │   ECR    │
   │ Registry │
   └──────────┘
```

### Composants

| Service | Description | Réseau |
|---------|-------------|--------|
| **ALB** | Application Load Balancer - Point d'entrée | Public |
| **ECS Fargate** | Conteneurs serverless (Web, API Métier, API User) | Public (avec IP publique) |
| **RDS PostgreSQL** | 2 bases de données (Events, Users) | Privé |
| **ECR** | Registre d'images Docker | - |
| **CloudWatch** | Logs et métriques | - |
| **Service Discovery** | DNS interne pour communication inter-services | Privé |

---

## 📁 Structure des fichiers

```
terraform/
├── main.tf                    # Configuration principale Terraform
├── variables.tf               # Déclaration des variables
├── outputs.tf                 # Valeurs de sortie
├── terraform.tfvars.example   # Exemple de configuration
├── vpc.tf                     # VPC, Subnets, Routes
├── security_groups.tf         # Règles de sécurité réseau
├── alb.tf                     # Application Load Balancer
├── ecr.tf                     # Registres Docker ECR
├── ecs.tf                     # Cluster ECS, Services, Tasks
├── rds.tf                     # Bases de données PostgreSQL
└── .gitignore                 # Fichiers à ignorer
```

---

## ⚙️ Configuration

### 1. Créer le fichier de variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

### 2. Éditer `terraform.tfvars`

```hcl
# Région et environnement
aws_region   = "us-east-1"
environment  = "prod"
project_name = "calendar"

# Configuration réseau
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

# Base de données (⚠️ À MODIFIER)
db_instance_class = "db.t3.micro"
db_username       = "calendar_admin"
db_password       = "VotreMotDePasseSecurise123!"  # À CHANGER

# ECS
ecs_task_cpu    = 256
ecs_task_memory = 512
app_count       = 1

# JWT (⚠️ À MODIFIER)
jwt_secret     = "VotreCleSecretJWT_TresLongue_Et_Complexe"  # À CHANGER
jwt_expiration = 3600
```

> ⚠️ **Important** : Changez impérativement `db_password` et `jwt_secret` avec des valeurs sécurisées !

---

## 🚀 Déploiement

### Étape 1 : Initialiser Terraform

```bash
cd terraform
terraform init
```

### Étape 2 : Valider la configuration

```bash
terraform validate
terraform fmt -check
```

### Étape 3 : Prévisualiser les changements

```bash
terraform plan
```

### Étape 4 : Appliquer l'infrastructure

```bash
terraform apply
```

Tapez `yes` pour confirmer le déploiement.

### Étape 5 : Récupérer les informations de déploiement

```bash
# URL de l'application
terraform output app_url

# Commande de connexion à ECR
terraform output docker_login_command

# URLs des registres ECR
terraform output ecr_web_url
terraform output ecr_api_metier_url
terraform output ecr_api_user_url
```

### Étape 6 : Pousser les images Docker

```bash
# 1. Se connecter à ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account_id>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build et push Web
docker build -t $(terraform output -raw ecr_web_url):latest ../web
docker push $(terraform output -raw ecr_web_url):latest

# 3. Build et push API Métier
docker build -t $(terraform output -raw ecr_api_metier_url):latest ../api-metier
docker push $(terraform output -raw ecr_api_metier_url):latest

# 4. Build et push API User
docker build -t $(terraform output -raw ecr_api_user_url):latest ../api-user
docker push $(terraform output -raw ecr_api_user_url):latest
```

### Étape 7 : Forcer le déploiement ECS (si images mises à jour)

```bash
aws ecs update-service --cluster calendar-cluster --service calendar-web --force-new-deployment
aws ecs update-service --cluster calendar-cluster --service calendar-api-metier --force-new-deployment
aws ecs update-service --cluster calendar-cluster --service calendar-api-user --force-new-deployment
```

---

## 📝 Variables

| Variable | Type | Défaut | Description |
|----------|------|--------|-------------|
| `aws_region` | string | `us-east-1` | Région AWS |
| `environment` | string | `prod` | Environnement (dev/staging/prod) |
| `project_name` | string | `calendar` | Nom du projet |
| `vpc_cidr` | string | `10.0.0.0/16` | CIDR du VPC |
| `public_subnet_cidrs` | list | `["10.0.1.0/24", "10.0.2.0/24"]` | CIDRs subnets publics |
| `private_subnet_cidrs` | list | `["10.0.10.0/24", "10.0.20.0/24"]` | CIDRs subnets privés |
| `db_instance_class` | string | `db.t3.micro` | Classe d'instance RDS |
| `db_username` | string | `calendar_admin` | Username RDS |
| `db_password` | string | - | Password RDS (sensible) |
| `ecs_task_cpu` | number | `256` | CPU par tâche ECS |
| `ecs_task_memory` | number | `512` | Mémoire par tâche ECS (MB) |
| `app_count` | number | `1` | Nombre d'instances par service |
| `jwt_secret` | string | - | Secret JWT (sensible) |
| `jwt_expiration` | number | `3600` | Durée JWT (secondes) |

---

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `app_url` | URL de l'application |
| `alb_dns_name` | DNS de l'ALB |
| `vpc_id` | ID du VPC |
| `ecr_web_url` | URL ECR service Web |
| `ecr_api_metier_url` | URL ECR API Métier |
| `ecr_api_user_url` | URL ECR API User |
| `ecs_cluster_name` | Nom du cluster ECS |
| `rds_events_endpoint` | Endpoint RDS Events |
| `rds_users_endpoint` | Endpoint RDS Users |
| `docker_login_command` | Commande de connexion ECR |
| `docker_push_commands` | Commandes de push Docker |

---

## 🎓 Optimisations AWS Academy

Cette configuration est optimisée pour les **comptes AWS Academy/Student** :

| Ressource | Rôle | Choix | Justification |
|-----------|------|-------|---------------|
| **Région** | Zone géographique AWS pour le déploiement | `us-east-1` | Région historique, tous services disponibles (obligatoire pour un compte student) |
| **RDS** | Base de données PostgreSQL managée pour stocker les événements et utilisateurs | `db.t3.micro` | Éligible Free Tier (750h/mois) |
| **ECS** | Orchestrateur de conteneurs Docker pour exécuter les services Web et APIs | Fargate | Serverless, pas de gestion EC2 |
| **NAT Gateway** | Passerelle permettant aux ressources privées d'accéder à internet | ❌ Désactivé | Économie ~$32/mois |
| **ECS Network** | Réseau des conteneurs applicatifs (Web, API Métier, API User) | Subnets publics | Avec `assign_public_ip = true` pour accès internet sans NAT |
| **RDS Network** | Réseau isolé des bases de données pour la sécurité | Subnets privés | Sécurité renforcée, pas besoin d'accès internet |
| **Multi-AZ** | Réplication des données sur plusieurs zones de disponibilité | ❌ Désactivé | Économie, suffisant pour environnement de dev |
| **Backup** | Sauvegarde automatique des bases de données | ❌ Désactivé | Économie pour environnement de test |

---

## 💰 Coûts estimés

| Service | Coût estimé/mois |
|---------|------------------|
| **ECS Fargate** | ~$10-20 (selon usage) |
| **RDS** (2x db.t3.micro) | Gratuit (Free Tier) |
| **ALB** | ~$16 |
| **ECR** | Gratuit (< 500MB) |
| **CloudWatch Logs** | Gratuit (< 5GB) |
| **Data Transfer** | ~$1-5 |
| **Total** | **~$30-45/mois** |

---

## 🔧 Commandes utiles

### Terraform

```bash
# Vérifier l'état
terraform show

# Rafraîchir l'état
terraform refresh

# Importer une ressource existante
terraform import <resource> <id>

# Afficher un output spécifique
terraform output <nom_output>

# Détruire une ressource spécifique
terraform destroy -target=<resource>
```

### AWS ECS

```bash
# Lister les services
aws ecs list-services --cluster calendar-cluster

# Voir les tâches en cours
aws ecs list-tasks --cluster calendar-cluster --service calendar-web

# Logs d'un service
aws logs tail /ecs/calendar/web --follow

# Décrire un service
aws ecs describe-services --cluster calendar-cluster --services calendar-web
```

### AWS RDS

```bash
# Lister les instances RDS
aws rds describe-db-instances

# Status d'une instance
aws rds describe-db-instances --db-instance-identifier calendar-events
```

---

## 🔍 Dépannage

### Le service ECS ne démarre pas

1. Vérifier les logs CloudWatch :
```bash
aws logs tail /ecs/calendar/web --since 1h
```

2. Vérifier le statut des tâches :
```bash
aws ecs describe-tasks --cluster calendar-cluster \
  --tasks $(aws ecs list-tasks --cluster calendar-cluster --service calendar-web --query 'taskArns[0]' --output text)
```

### Impossible de se connecter à RDS

1. Vérifier les security groups
2. Vérifier que le service ECS est dans le bon subnet
3. Tester la connectivité depuis le container

### Images Docker non trouvées

1. Vérifier que les images sont poussées dans ECR
2. Vérifier les URLs dans les task definitions
3. Forcer un nouveau déploiement ECS

### Erreur "No Fargate configuration found"

Vérifier que les capacity providers sont configurés :
```bash
aws ecs describe-clusters --clusters calendar-cluster
```

---

## 🗑️ Nettoyage

### Détruire l'infrastructure complète

```bash
# Supprimer toutes les ressources
terraform destroy
```

### Supprimer les images ECR (optionnel)

```bash
# Lister les images
aws ecr list-images --repository-name calendar-web

# Supprimer toutes les images
aws ecr batch-delete-image --repository-name calendar-web \
  --image-ids "$(aws ecr list-images --repository-name calendar-web --query 'imageIds[*]' --output json)"
```

> ⚠️ **Important** : Détruisez toujours les ressources quand vous ne les utilisez pas pour économiser vos crédits AWS Academy !

---

## 📚 Ressources

- [Documentation Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Documentation ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Documentation RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Best Practices Terraform](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

---

## 👥 Auteurs

Projet Cloud Computing 5A - POLYTECH

---

*Dernière mise à jour : Janvier 2026*
