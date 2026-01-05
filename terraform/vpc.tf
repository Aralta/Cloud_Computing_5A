# ============================================
# VPC - Virtual Private Cloud
# ============================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# ============================================
# Internet Gateway
# ============================================
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ============================================
# Subnets Publics (pour ALB)
# ============================================
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Type = "public"
  }
}

# ============================================
# Subnets Privés (pour ECS et RDS)
# ============================================
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
    Type = "private"
  }
}

# ============================================
# NAT Gateway (ATTENTION: ~$32/mois)
# Pour compte Student: commenter et utiliser subnets publics
# ============================================
# Option 1: NAT Gateway (payant)
# resource "aws_eip" "nat" {
#   domain = "vpc"
#   tags = { Name = "${var.project_name}-nat-eip" }
# }
# resource "aws_nat_gateway" "main" {
#   allocation_id = aws_eip.nat.id
#   subnet_id     = aws_subnet.public[0].id
#   tags = { Name = "${var.project_name}-nat" }
#   depends_on = [aws_internet_gateway.main]
# }

# Option 2: Pas de NAT - ECS dans subnets publics (gratuit, utilisé ici)
# Les services ECS auront assign_public_ip = true

# ============================================
# Route Tables
# ============================================

# Route table publique
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route table privée (sans NAT pour compte Student)
# Les subnets privés n'ont pas d'accès internet sortant
# ECS utilisera les subnets publics avec assign_public_ip = true
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # Pas de route vers internet (économie NAT Gateway)
  # Uniquement pour RDS qui n'a pas besoin d'accès internet

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
