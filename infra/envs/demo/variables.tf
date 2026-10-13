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
  description = "Free-tier EC2 instance type (t4g.micro or t3.micro/t3.small)"
  type        = string
  default     = "t4g.micro"
}
