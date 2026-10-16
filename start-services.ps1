# ==============================================================================
# MealMate Services Launcher
# ==============================================================================
# NOTE: The backend microservices run live in AWS EC2 at http://13.234.110.133.
# This script starts the local frontend connected to the AWS backend.
# ==============================================================================

Param(
    [switch]$LocalBackend = $false
)

$rootDir = $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       MealMate Development Launcher      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not $LocalBackend) {
    Write-Host "[AWS Mode] Backend is running live on AWS: http://13.234.110.133" -ForegroundColor Green
    Write-Host "Starting local frontend connected to AWS backend..." -ForegroundColor Yellow
    
    cd "$rootDir\frontend"
    npm run dev
} else {
    Write-Host "[Local Mode] Starting backend microservices locally with Maven..." -ForegroundColor Yellow
    # Local startup logic if explicitly requested with -LocalBackend
    $envFile = Join-Path $rootDir ".env"
    function Start-ServiceWindow($name, $path, $port) {
        Write-Host "Launching $name (port $port)..." -ForegroundColor Green
        $cmd = "cd '$rootDir\$path'; Get-Content '$envFile' | ForEach-Object { if (`$_ -match '^\s*([^#][^=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable(`$matches[1].Trim(), `$matches[2].Trim(), 'Process') } }; mvn spring-boot:run"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    }
    Start-ServiceWindow "Config Server" "Backened\config-server" "8888"
    Start-Sleep -Seconds 6
    Start-ServiceWindow "Discovery Server" "Backened\discovery-server" "8761"
    Start-Sleep -Seconds 6
    Start-ServiceWindow "User Service" "Backened\user-service" "8081"
    Start-ServiceWindow "API Gateway" "Backened\api-gateway" "8080"
}
