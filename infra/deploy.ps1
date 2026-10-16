# ==============================================================================
# MealMate AWS Infrastructure & Frontend Deployment Script
# ==============================================================================
# Automates:
# 1. Building Vite/React production assets
# 2. Provisioning AWS Free-Tier infrastructure via Terraform
# 3. Syncing build artifacts to S3
# 4. Invalidating CloudFront CDN cache for immediate propagation
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MealMate AWS Infrastructure Deployment  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$scriptRoot = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptRoot
$frontendDir = Join-Path $projectRoot "frontend"
$demoDir = Join-Path $scriptRoot "envs\demo"

# 1. Build Frontend
Write-Host "`n[1/4] Building React Frontend..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
} finally {
    Pop-Location
}
Write-Host "Frontend build completed successfully." -ForegroundColor Green

# 2. Terraform Apply
Write-Host "`n[2/4] Applying Terraform Infrastructure (envs/demo)..." -ForegroundColor Yellow
Push-Location $demoDir
try {
    terraform apply -auto-approve
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform apply exited with code $LASTEXITCODE"
    }

    $bucketName = (terraform output -raw frontend_s3_bucket).Trim()
    $cfDomain   = (terraform output -raw cloudfront_domain_name).Trim()
    $cfId       = (terraform output -raw cloudfront_distribution_id).Trim()
    $rdsEp      = (terraform output -raw rds_endpoint).Trim()
    $asgName    = (terraform output -raw asg_name).Trim()
} finally {
    Pop-Location
}

# 3. Sync Frontend to S3
Write-Host "`n[3/4] Syncing frontend build to S3 ($bucketName)..." -ForegroundColor Yellow
$distPath = Join-Path $frontendDir "dist"
aws s3 sync $distPath "s3://$bucketName" --delete
Write-Host "Frontend assets uploaded to S3 successfully." -ForegroundColor Green

# 4. Invalidate CloudFront CDN
Write-Host "`n[4/4] Invalidating CloudFront CDN cache ($cfId)..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $cfId --paths "/*" | Out-Null
Write-Host "CloudFront cache invalidation triggered." -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  MealMate Deployment Succeeded!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host " Live Website URL: https://$cfDomain" -ForegroundColor Cyan
Write-Host " S3 Bucket:        $bucketName" -ForegroundColor White
Write-Host " CloudFront ID:    $cfId" -ForegroundColor White
Write-Host " RDS MySQL Host:   $rdsEp" -ForegroundColor White
Write-Host " EC2 ASG:          $asgName" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
