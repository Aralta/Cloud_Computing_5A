# ============================================
# ECS - Elastic Container Service
# Compatible AWS Academy / Student Account
# ============================================

# Cluster ECS
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# Capacity providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ============================================
# IAM - Utilisation du LabRole existant
# AWS Academy ne permet pas de créer des rôles IAM
# ============================================
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# ============================================
# CloudWatch Log Groups
# ============================================
resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project_name}/web"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "api_metier" {
  name              = "/ecs/${var.project_name}/api-metier"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "api_user" {
  name              = "/ecs/${var.project_name}/api-user"
  retention_in_days = 30
}

# ============================================
# Task Definitions
# ============================================

# Web Service
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name  = "web"
    image = "${aws_ecr_repository.web.repository_url}:latest"

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      { name = "PORT", value = "8080" },
      # Communication via ALB (pas de Service Discovery)
      { name = "API_METIER_URL", value = "http://${aws_lb.main.dns_name}/api/events" },
      { name = "API_USER_URL", value = "http://${aws_lb.main.dns_name}/api" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.web.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:8080/health')\" || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# API Métier
resource "aws_ecs_task_definition" "api_metier" {
  family                   = "${var.project_name}-api-metier"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name  = "api-metier"
    image = "${aws_ecr_repository.api_metier.repository_url}:latest"

    portMappings = [{
      containerPort = 3001
      protocol      = "tcp"
    }]

    environment = [
      { name = "PORT", value = "3001" },
      { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.events.endpoint}/events_db" },
      { name = "SECRET_KEY", value = var.jwt_secret },
      { name = "PURGE_PASSWORD", value = var.purge_password },
      # Communication via ALB
      { name = "API_USER_URL", value = "http://${aws_lb.main.dns_name}/api" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api_metier.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:3001/health')\" || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# API Utilisateur
resource "aws_ecs_task_definition" "api_user" {
  family                   = "${var.project_name}-api-user"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name  = "api-user"
    image = "${aws_ecr_repository.api_user.repository_url}:latest"

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "PORT", value = "3000" },
      { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.users.endpoint}/users_db" },
      { name = "SECRET_KEY", value = var.jwt_secret },
      { name = "PURGE_PASSWORD", value = var.purge_password },
      { name = "ACCESS_TOKEN_EXPIRE_MINUTES", value = tostring(var.jwt_expiration / 60) }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api_user.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:3000/health')\" || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ============================================
# ECS Services (sans Service Discovery)
# ============================================

# Service Web
resource "aws_ecs_service" "web" {
  name            = "${var.project_name}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}

# Service API Métier
resource "aws_ecs_service" "api_metier" {
  name            = "${var.project_name}-api-metier"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_metier.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_metier.arn
    container_name   = "api-metier"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.http]
}

# Service API Utilisateur
resource "aws_ecs_service" "api_user" {
  name            = "${var.project_name}-api-user"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_user.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_user.arn
    container_name   = "api-user"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}
