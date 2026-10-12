# start-services.ps1 - FoodRush Microservices Launcher
Param(
    [string]$Service = "core" # "core" launches Config, Eureka, Gateway, User; "all" launches everything
)

$rootDir = $PSScriptRoot
$envFile = Join-Path $rootDir ".env"

function Start-ServiceWindow($name, $path, $port) {
    Write-Host "Launching $name (port $port)..." -ForegroundColor Green
    $cmd = "cd '$rootDir\$path'; Get-Content '$envFile' | ForEach-Object { if (`$_ -match '^\s*([^#][^=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable(`$matches[1].Trim(), `$matches[2].Trim(), 'Process') } }; mvn spring-boot:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       FoodRush Services Launcher        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Helper function to check if port is open before launching
function Launch-If-Not-Running($name, $path, $port) {
    $running = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if (-not $running) {
        Start-ServiceWindow $name $path $port
    } else {
        Write-Host "$name is already running on port $port." -ForegroundColor Green
    }
}

# 1. Config Server (8888)
$configRunning = Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue
if (-not $configRunning) {
    Start-ServiceWindow "Config Server" "Backened\config-server" "8888"
    Write-Host "Waiting 8 seconds for Config Server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
} else {
    Write-Host "Config Server is already running on port 8888." -ForegroundColor Green
}

# 2. Discovery Server (8761)
$discoveryRunning = Get-NetTCPConnection -LocalPort 8761 -ErrorAction SilentlyContinue
if (-not $discoveryRunning) {
    Start-ServiceWindow "Discovery Server" "Backened\discovery-server" "8761"
    Write-Host "Waiting 6 seconds for Discovery Server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 6
} else {
    Write-Host "Discovery Server is already running on port 8761." -ForegroundColor Green
}

# 3. User Service (8081)
Launch-If-Not-Running "User Service" "Backened\user-service" "8081"

# 4. API Gateway (8080)
Launch-If-Not-Running "API Gateway" "Backened\api-gateway" "8080"

if ($Service -eq "all") {
    Start-Sleep -Seconds 2
    Launch-If-Not-Running "Restaurant Service" "Backened\restaurant-service" "8082"
    Launch-If-Not-Running "Order Service" "Backened\order-service" "8083"
    Launch-If-Not-Running "Delivery Service" "Backened\delivery-service" "8084"
    Launch-If-Not-Running "Payment Service" "Backened\payment-service" "8085"
    Launch-If-Not-Running "Notification Service" "Backened\notification-service" "8086"
}

Write-Host ""
Write-Host "Services started! Each service is running in its own terminal window." -ForegroundColor Cyan
