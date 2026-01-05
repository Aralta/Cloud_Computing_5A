# ============================================
# RDS - Base de données PostgreSQL
# ============================================

# Subnet group pour RDS
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# ============================================
# RDS Instance - API Métier (Events DB)
# ============================================
resource "aws_db_instance" "events" {
  identifier = "${var.project_name}-events-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "events_db"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = false # true pour la prod réelle
  publicly_accessible    = false
  skip_final_snapshot    = true # false en prod
  deletion_protection    = false # true en prod

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = false # true si supporté par l'instance

  tags = {
    Name = "${var.project_name}-events-db"
  }
}

# ============================================
# RDS Instance - API Utilisateur (Users DB)
# ============================================
resource "aws_db_instance" "users" {
  identifier = "${var.project_name}-users-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "users_db"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = false # true pour la prod réelle
  publicly_accessible    = false
  skip_final_snapshot    = true # false en prod
  deletion_protection    = false # true en prod

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = false

  tags = {
    Name = "${var.project_name}-users-db"
  }
}
