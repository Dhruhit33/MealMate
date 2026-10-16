# ==============================================================================
# MealMate AWS Elastic Container Registry (ECR) Repositories
# ==============================================================================

locals {
  services = [
    "api-gateway",
    "config-server",
    "delivery-service",
    "discovery-server",
    "notification-service",
    "order-service",
    "payment-service",
    "restaurant-service",
    "user-service",
    "frontend"
  ]
}

resource "aws_ecr_repository" "services" {
  for_each             = toset(local.services)
  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name    = "${var.project_name}-${each.key}"
    Service = each.key
  }
}

# Free-Tier & Cost-Optimization: Keep only last 5 tagged images per repository
resource "aws_ecr_lifecycle_policy" "services_policy" {
  for_each   = toset(local.services)
  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 tagged images to optimize ECR storage"
        selection = {
          tagStatus   = "any"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "ecr_repository_urls" {
  description = "ECR Repository URLs for MealMate microservices"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}
