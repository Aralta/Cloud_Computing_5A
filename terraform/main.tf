# ============================================
# Terraform - Infrastructure AWS Calendar
# ============================================
# Compatible AWS Academy / Student Account
# Région: us-east-1 (N. Virginia)
# ============================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 pour stocker l'état (décommenter si disponible)
  # Note: AWS Academy peut ne pas permettre la création de buckets S3
  # backend "s3" {
  #   bucket = "calendar-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# ============================================
# Provider AWS
# ============================================
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Calendar-CloudComputing"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================
# Data Sources
# ============================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
