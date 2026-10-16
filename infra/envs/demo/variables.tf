variable "aws_region" {
  description = "AWS region for the deployment (e.g. ap-south-1 for Mumbai, us-east-1 for N. Virginia)"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name prefix used for resource naming"
  type        = string
  default     = "mealmate"
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "demo"
}

variable "db_username" {
  description = "Master username for RDS MySQL database"
  type        = string
  default     = "mealmate_admin"
}

variable "db_password" {
  description = "Master password for RDS MySQL database"
  type        = string
  default     = "MealMateFreeTier2026!"
  sensitive   = true
}

variable "enable_scheduler_lambda" {
  description = "Enable Lambda function for nightly stop/start of EC2 and RDS to preserve free-tier hours"
  type        = bool
  default     = true
}

variable "instance_type" {
  description = "EC2 instance type (t3.medium recommended with 4GB RAM to run all microservices, Kafka, Redis & k3s stably)"
  type        = string
  default     = "t3.medium"
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN distribution (provides HTTPS link for mobile devices; requires account verification on new AWS accounts)"
  type        = bool
  default     = false
}
