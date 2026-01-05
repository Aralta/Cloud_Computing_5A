# ============================================
# ALB - Application Load Balancer
# ============================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # true en prod

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# ============================================
# Target Groups
# ============================================

# Target Group - Web
resource "aws_lb_target_group" "web" {
  name        = "${var.project_name}-web-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-web-tg"
  }
}

# Target Group - API Métier
resource "aws_lb_target_group" "api_metier" {
  name        = "${var.project_name}-api-metier-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-api-metier-tg"
  }
}

# Target Group - API Utilisateur
resource "aws_lb_target_group" "api_user" {
  name        = "${var.project_name}-api-user-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-api-user-tg"
  }
}

# ============================================
# Listeners
# ============================================

# HTTP Listener (redirect to HTTPS en prod)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# ============================================
# Listener Rules (routing)
# ============================================

# Route /api/events/* vers API Métier
resource "aws_lb_listener_rule" "api_metier" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_metier.arn
  }

  condition {
    path_pattern {
      values = ["/api/events*"]
    }
  }
}

# Route /api/auth/* et /api/users/* vers API Utilisateur
resource "aws_lb_listener_rule" "api_user_auth" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 110

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_user.arn
  }

  condition {
    path_pattern {
      values = ["/api/auth*", "/api/users*"]
    }
  }
}
