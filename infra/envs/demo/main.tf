terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Tier        = "AWS Free Tier"
    }
  }
}

# ─── Default VPC & Subnets (Free Tier) ─────────────────────────────────────────

resource "aws_default_vpc" "default" {
  tags = {
    Name = "${var.project_name}-default-vpc"
  }
}

resource "aws_default_subnet" "default_az1" {
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "${var.project_name}-default-az1"
  }
}

resource "aws_default_subnet" "default_az2" {
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "${var.project_name}-default-az2"
  }
}

# ─── S3 Bucket (React Build) ──────────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${var.environment}-build"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-frontend-bucket"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_origin_access_control" "s3_oac" {
  count                             = var.enable_cloudfront ? 1 : 0
  name                              = "${var.project_name}-s3-oac"
  description                       = "OAC for MealMate Frontend S3 Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ─── Security Groups ──────────────────────────────────────────────────────────

resource "aws_security_group" "ec2_sg" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for MealMate EC2 k3s (Kubernetes) host with Traefik Ingress"
  vpc_id      = aws_default_vpc.default.id

  # HTTP to Traefik Ingress from CloudFront / users
  ingress {
    description = "Traefik Ingress port 80 from CloudFront / users"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS to Traefik Ingress
  ingress {
    description = "Traefik Ingress port 443 HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "k3s Kubernetes API server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for MealMate RDS MySQL"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    description     = "MySQL from EC2 application instance"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# ─── CloudFront Distribution (Free HTTPS & CDN) ────────────────────────────────

resource "aws_cloudfront_distribution" "cdn" {
  count               = var.enable_cloudfront ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "MealMate Free HTTPS & CDN Distribution"

  # Origin 1: S3 Bucket (React build)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac[0].id
  }

  # Origin 2: EC2 Custom Origin (Traefik Ingress on port 80)
  origin {
    domain_name = "ec2-13-234-110-133.ap-south-1.compute.amazonaws.com" # AWS EC2 Public DNS FQDN
    origin_id   = "EC2-Traefik-Ingress"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default Cache Behavior -> S3 React build
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # API Behavior -> EC2 Traefik Ingress (/api/*)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "EC2-Traefik-Ingress"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host", "Accept", "Origin"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Fallback for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cloudfront"
  }
}

# ─── IAM Role for EC2 (SSM Parameter Store Access) ─────────────────────────────

resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ─── EC2 Launch Template & Auto Scaling Group of 1 (Docker Compose) ───────────

variable "ami_id" {
  description = "Ubuntu AMI ID (default Ubuntu 22.04 LTS in ap-south-1)"
  type        = string
  default     = "ami-0f5ee92e2d63afc18"
}

resource "aws_launch_template" "mealmate_lt" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              # 1. 4GB Swap for running Spring Boot + Kafka + k3s in Free-Tier
              fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # 2. Install k3s (Lightweight Kubernetes) with built-in Traefik Ingress on port 80
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg git
              
              curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644

              # 3. Configure kubectl for ubuntu user
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube
              echo 'export KUBECONFIG=/home/ubuntu/.kube/config' >> /home/ubuntu/.bashrc

              # 4. Ready marker
              echo "EC2 running k3s (Kubernetes) with Traefik Ingress on port 80" > /home/ubuntu/ready.txt
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-k3s-host"
    }
  }
}

resource "aws_autoscaling_group" "mealmate_asg" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = [aws_default_subnet.default_az1.id, aws_default_subnet.default_az2.id]
  min_size            = 1
  max_size            = 1
  desired_capacity    = 1

  launch_template {
    id      = aws_launch_template.mealmate_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }
}

# ─── RDS MySQL (Free Tier db.t4g.micro, 1 AZ) ──────────────────────────────────

resource "aws_db_subnet_group" "rds_subnet_group" {
  name        = "${var.project_name}-rds-subnet-group"
  description = "Database subnet group covering default subnets in 2 AZs for Free Tier RDS"
  subnet_ids  = [aws_default_subnet.default_az1.id, aws_default_subnet.default_az2.id]

  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

resource "aws_db_instance" "mysql" {
  identifier             = "${var.project_name}-mysql-${var.environment}"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  max_allocated_storage  = 20
  storage_type           = "gp2"
  multi_az               = false # Single-AZ Free Tier
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  db_name                = "mealmate_db"
  username               = var.db_username
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = {
    Name = "${var.project_name}-rds-mysql"
  }
}

# ─── SSM Parameter Store (Free Secrets & Configs) ──────────────────────────────

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/DB_PASSWORD"
  description = "Database master password"
  type        = "SecureString"
  value       = var.db_password
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/${var.environment}/JWT_SECRET"
  description = "JWT Signing key for User Service and API Gateway"
  type        = "SecureString"
  value       = "default-mealmate-jwt-secret-key-must-be-at-least-256-bits-long-2026"
}

# ─── CloudWatch Log Group (7-day keep) ─────────────────────────────────────────

resource "aws_cloudwatch_log_group" "mealmate_logs" {
  name              = "/aws/${var.project_name}/${var.environment}/containers"
  retention_in_days = 7 # 7-day keep for free tier

  tags = {
    Name = "${var.project_name}-log-group"
  }
}

# ─── Lambda (Nightly Stop/Start Scheduler for Free Tier) ───────────────────────

data "archive_file" "lambda_dummy" {
  type        = "zip"
  output_path = "${path.module}/lambda_scheduler.zip"

  source {
    content  = "exports.handler = async () => { console.log('Nightly Stop/Start Scheduler trigger'); };"
    filename = "index.js"
  }
}

resource "aws_iam_role" "lambda_role" {
  count = var.enable_scheduler_lambda ? 1 : 0
  name  = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  count      = var.enable_scheduler_lambda ? 1 : 0
  role       = aws_iam_role.lambda_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "scheduler" {
  count            = var.enable_scheduler_lambda ? 1 : 0
  function_name    = "${var.project_name}-nightly-scheduler"
  role             = aws_iam_role.lambda_role[0].arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_dummy.output_path
  source_code_hash = data.archive_file.lambda_dummy.output_base64sha256

  environment {
    variables = {
      ASG_NAME   = aws_autoscaling_group.mealmate_asg.name
      DB_ID      = aws_db_instance.mysql.identifier
      ENV_TARGET = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-nightly-scheduler"
  }
}

resource "aws_cloudwatch_event_rule" "nightly_schedule" {
  count               = var.enable_scheduler_lambda ? 1 : 0
  name                = "${var.project_name}-nightly-trigger"
  description         = "Trigger nightly shutdown to save free-tier hours"
  schedule_expression = "cron(0 20 * * ? *)" # 8 PM UTC
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  count     = var.enable_scheduler_lambda ? 1 : 0
  rule      = aws_cloudwatch_event_rule.nightly_schedule[0].name
  target_id = "TriggerSchedulerLambda"
  arn       = aws_lambda_function.scheduler[0].arn
}
