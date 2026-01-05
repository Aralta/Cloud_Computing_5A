# ============================================
# ECR - Elastic Container Registry
# ============================================

# Repository pour le service Web
resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-web"
  }
}

# Repository pour l'API Métier
resource "aws_ecr_repository" "api_metier" {
  name                 = "${var.project_name}-api-metier"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-api-metier"
  }
}

# Repository pour l'API Utilisateur
resource "aws_ecr_repository" "api_user" {
  name                 = "${var.project_name}-api-user"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-api-user"
  }
}

# Lifecycle policy pour nettoyer les vieilles images
resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = toset(["web", "api-metier", "api-user"])
  repository = "${var.project_name}-${each.key}"

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })

  depends_on = [
    aws_ecr_repository.web,
    aws_ecr_repository.api_metier,
    aws_ecr_repository.api_user
  ]
}
