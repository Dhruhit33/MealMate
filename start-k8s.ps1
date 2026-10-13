# =====================================================================
# MealMate — Kubernetes All-in-One Startup Script
# Usage: .\start-k8s.ps1
# =====================================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       MealMate Kubernetes Launcher       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Ensure Minikube is Running
Write-Host "`n[1/3] Checking Minikube status..." -ForegroundColor Yellow
$status = minikube status --format '{{.Host}}' 2>$null
if ($status -ne "Running") {
    Write-Host "Starting Minikube..." -ForegroundColor Green
    minikube start --memory=8192 --cpus=4
    minikube addons enable ingress
    minikube addons enable metrics-server
} else {
    Write-Host "Minikube is already running." -ForegroundColor Green
}

# 2. Apply All Manifests Recursively
Write-Host "`n[2/3] Applying all MealMate Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f k8s/ -R

Write-Host "`nChecking pods status in 'mealmate' namespace..." -ForegroundColor Yellow
kubectl get pods -n mealmate

# 3. Start Ingress Port-Forward on Port 3000
Write-Host "`n[3/3] Opening MealMate on http://localhost:3000..." -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  MealMate is live at: http://localhost:3000          " -ForegroundColor Green
Write-Host "  Keep this window open to maintain access.           " -ForegroundColor Yellow
Write-Host "  Press Ctrl + C anytime to stop.                     " -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Cyan

kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 3000:80
