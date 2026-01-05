# ============================================
# ECS - Elastic Container Service
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
# IAM Role pour ECS Task Execution
# ============================================
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ============================================
# IAM Role pour ECS Task
# ============================================
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
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
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "web"
    image = "${aws_ecr_repository.web.repository_url}:latest"

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      { name = "PORT", value = "8080" },
      { name = "API_METIER_URL", value = "http://api-metier.${var.project_name}.local:3001" },
      { name = "API_USER_URL", value = "http://api-user.${var.project_name}.local:3000" }
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
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

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
      { name = "API_USER_URL", value = "http://api-user.${var.project_name}.local:3000" }
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
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

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
      { name = "JWT_SECRET", value = var.jwt_secret },
      { name = "JWT_EXPIRATION", value = tostring(var.jwt_expiration) }
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
# ECS Services
# ============================================

# Service Web
resource "aws_ecs_service" "web" {
  name            = "${var.project_name}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id  # Public pour éviter NAT Gateway
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true  # Nécessaire sans NAT
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 8080
  }

  service_registries {
    registry_arn = aws_service_discovery_service.web.arn
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
    subnets          = aws_subnet.public[*].id  # Public pour éviter NAT Gateway
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true  # Nécessaire sans NAT
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_metier.arn
    container_name   = "api-metier"
    container_port   = 3001
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api_metier.arn
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
    subnets          = aws_subnet.public[*].id  # Public pour éviter NAT Gateway
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true  # Nécessaire sans NAT
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_user.arn
    container_name   = "api-user"
    container_port   = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api_user.arn
  }

  depends_on = [aws_lb_listener.http]
}

# ============================================
# Service Discovery (pour communication inter-services)
# ============================================
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.project_name}.local"
  vpc         = aws_vpc.main.id
  description = "Service discovery pour ${var.project_name}"
}

resource "aws_service_discovery_service" "web" {
  name = "web"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "api_metier" {
  name = "api-metier"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "api_user" {
  name = "api-user"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
