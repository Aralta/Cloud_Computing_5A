# ============================================
# Variables Terraform
# - variables globales pour le projet Calendar
# ============================================

variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "us-east-1" # Région historique AWS
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "calendar"
}

# ============================================
# VPC Configuration
# - variables décrivant le réseau
# ============================================
variable "vpc_cidr" {
  description = "CIDR block pour le VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks pour les subnets publics"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks pour les subnets privés"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# ============================================
# RDS Configuration
# - variables pour la base de données relationnelle
# ============================================
variable "db_instance_class" {
  description = "Classe d'instance RDS"
  type        = string
  default     = "db.t3.micro" # Free tier eligible
}

variable "db_username" {
  description = "Username master RDS"
  type        = string
  default     = "calendar_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Password master RDS"
  type        = string
  sensitive   = true
}

# ============================================
# ECS Configuration
# - variables pour le cluster ECS et les services
# ============================================
variable "ecs_task_cpu" {
  description = "CPU pour les tâches ECS (en unités)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Mémoire pour les tâches ECS (en MB)"
  type        = number
  default     = 512
}

variable "app_count" {
  description = "Nombre d'instances par service"
  type        = number
  default     = 1
}

# ============================================
# Application Configuration
# - variables spécifiques à l'application Calendar
# ============================================
variable "jwt_secret" {
  description = "Secret JWT pour l'authentification"
  type        = string
  sensitive   = true
}

variable "jwt_expiration" {
  description = "Durée de validité du JWT (secondes)"
  type        = number
  default     = 3600
}

variable "purge_password" {
  description = "Mot de passe utilisé pour l'opération de purge des bases via l'admin endpoint"
  type        = string
  sensitive   = true
}
