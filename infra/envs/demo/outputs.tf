output "website_url" {
  description = "Public S3 Static Website Hosting URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "cloudfront_domain_name" {
  description = "CloudFront Free HTTPS & CDN Distribution domain name"
  value       = try(aws_cloudfront_distribution.cdn[0].domain_name, null)
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for cache invalidation"
  value       = try(aws_cloudfront_distribution.cdn[0].id, null)
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
