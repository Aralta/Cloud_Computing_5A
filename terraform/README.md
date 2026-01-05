# Terraform - Infrastructure AWS Calendar

## 🎓 Compte AWS Academy / Student

Cette configuration est optimisée pour fonctionner avec un **compte AWS Academy/Student**.

### Optimisations appliquées

| Ressource | Choix | Raison |
|-----------|-------|--------|
| **Région** | `us-east-1` | Région historique, tous les services disponibles |
| **RDS** | `db.t3.micro` | Free Tier eligible (750h/mois) |
| **ECS** | Fargate | Pas besoin de gérer des EC2 |
| **NAT Gateway** | ❌ Désactivé | Économie ~$32/mois |
| **ECS Subnets** | Publics | Avec `assign_public_ip = true` |
| **RDS** | Subnets privés | Sécurité, pas besoin d'internet |
| **Multi-AZ** | ❌ Désactivé | Économie, pas nécessaire pour dev |

### Coûts estimés (Free Tier)

| Service | Coût estimé |
|---------|-------------|
| ECS Fargate | ~$10-20/mois (selon usage) |
| RDS (2x db.t3.micro) | Gratuit (Free Tier) |
| ALB | ~$16/mois |
| ECR | Gratuit (< 500MB) |
| CloudWatch Logs | Gratuit (< 5GB) |
| **Total estimé** | **~$25-40/mois** |

> ⚠️ Les crédits AWS Academy couvrent généralement ces coûts.

---

## 🚀 Déploiement

### Prérequis

1. AWS CLI configuré avec les credentials AWS Academy
2. Terraform >= 1.0 installé

### Étapes

```bash
# 1. Copier et configurer les variables
cp terraform.tfvars.example terraform.tfvars
# Éditer terraform.tfvars avec vos valeurs

# 2. Initialiser Terraform
terraform init

# 3. Vérifier le plan
terraform plan

# 4. Appliquer l'infrastructure
terraform apply

# 5. Noter les outputs (URL de l'application)
terraform output app_url
```

### Pousser les images Docker

```bash
# Se connecter à ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build et push
docker build -t <ecr_web_url>:latest ../web
docker push <ecr_web_url>:latest

docker build -t <ecr_api_metier_url>:latest ../api-metier
docker push <ecr_api_metier_url>:latest

docker build -t <ecr_api_user_url>:latest ../api-user
docker push <ecr_api_user_url>:latest
```

---

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │   Internet  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │ (Public)
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌───────────┐      ┌──────────┐
   │   Web   │       │API Métier │      │ API User │
   │  :8080  │       │   :3001   │      │  :3000   │
   └─────────┘       └─────┬─────┘      └────┬─────┘
   (Public Subnet)         │                 │
                           │                 │
                    ┌──────▼─────┐     ┌─────▼──────┐
                    │ RDS Events │     │ RDS Users  │
                    │   :5432    │     │   :5432    │
                    └────────────┘     └────────────┘
                       (Private Subnet - pas d'accès internet)
```

---

## 🗑️ Nettoyage

```bash
# Détruire toute l'infrastructure
terraform destroy
```

⚠️ **Important** : Toujours détruire les ressources quand vous ne les utilisez pas pour économiser les crédits !
