# ============================================
# Outputs Terraform
# ============================================

# ============================================
# VPC
# ============================================
output "vpc_id" {
  description = "ID du VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs des subnets publics"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs des subnets privés"
  value       = aws_subnet.private[*].id
}

# ============================================
# ALB
# ============================================
output "alb_dns_name" {
  description = "DNS name de l'ALB (URL de l'application)"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID de l'ALB"
  value       = aws_lb.main.zone_id
}

output "app_url" {
  description = "URL de l'application"
  value       = "http://${aws_lb.main.dns_name}"
}

# ============================================
# ECR
# ============================================
output "ecr_web_url" {
  description = "URL du repository ECR Web"
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_api_metier_url" {
  description = "URL du repository ECR API Métier"
  value       = aws_ecr_repository.api_metier.repository_url
}

output "ecr_api_user_url" {
  description = "URL du repository ECR API Utilisateur"
  value       = aws_ecr_repository.api_user.repository_url
}

# ============================================
# RDS
# ============================================
output "rds_events_endpoint" {
  description = "Endpoint RDS Events DB"
  value       = aws_db_instance.events.endpoint
  sensitive   = true
}

output "rds_users_endpoint" {
  description = "Endpoint RDS Users DB"
  value       = aws_db_instance.users.endpoint
  sensitive   = true
}

# ============================================
# ECS
# ============================================
output "ecs_cluster_name" {
  description = "Nom du cluster ECS"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN du cluster ECS"
  value       = aws_ecs_cluster.main.arn
}

# ============================================
# Service Discovery
# ============================================
output "service_discovery_namespace" {
  description = "Namespace DNS pour le service discovery"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

# ============================================
# Commandes utiles
# ============================================
output "docker_login_command" {
  description = "Commande pour se connecter à ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "docker_push_commands" {
  description = "Commandes pour push les images Docker"
  value = {
    web        = "docker build -t ${aws_ecr_repository.web.repository_url}:latest ../web && docker push ${aws_ecr_repository.web.repository_url}:latest"
    api_metier = "docker build -t ${aws_ecr_repository.api_metier.repository_url}:latest ../api-metier && docker push ${aws_ecr_repository.api_metier.repository_url}:latest"
    api_user   = "docker build -t ${aws_ecr_repository.api_user.repository_url}:latest ../api-user && docker push ${aws_ecr_repository.api_user.repository_url}:latest"
  }
}
