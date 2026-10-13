output "cloudfront_domain_name" {
  description = "CloudFront Free HTTPS & CDN Distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "frontend_s3_bucket" {
  description = "S3 Bucket hosting React frontend build"
  value       = aws_s3_bucket.frontend.id
}

output "asg_name" {
  description = "EC2 Auto Scaling Group of 1 running k3s (Kubernetes)"
  value       = aws_autoscaling_group.mealmate_asg.name
}

output "rds_endpoint" {
  description = "RDS MySQL database endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group (7-day keep)"
  value       = aws_cloudwatch_log_group.mealmate_logs.name
}

output "scheduler_lambda_arn" {
  description = "Nightly stop/start scheduler Lambda ARN"
  value       = try(aws_lambda_function.scheduler[0].arn, null)
}
