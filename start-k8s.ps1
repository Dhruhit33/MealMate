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

# 2. Deploy Infrastructure, Configs and Spring Cloud Core First
Write-Host "`n[2/4] Deploying core configurations, databases, and Spring Cloud Core..." -ForegroundColor Yellow
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-infrastructure/
kubectl apply -f k8s/03-core/

Write-Host "Waiting for Config Server and Eureka Discovery to be ready..." -ForegroundColor Cyan
kubectl rollout status deployment/config-server -n mealmate --timeout=120s
kubectl rollout status deployment/discovery-server -n mealmate --timeout=120s

# 3. Deploy Microservices, Frontend, HPA and Ingress
Write-Host "`n[3/4] Deploying Microservices, Ingress & Frontend..." -ForegroundColor Yellow
kubectl apply -f k8s/04-services/
kubectl apply -f k8s/05-frontend/
kubectl apply -f k8s/06-autoscaling/
kubectl apply -f k8s/07-ingress/

Write-Host "Waiting for API Gateway and Frontend to be ready..." -ForegroundColor Cyan
kubectl rollout status deployment/api-gateway -n mealmate --timeout=120s
kubectl rollout status deployment/frontend -n mealmate --timeout=60s

Write-Host "`nChecking pods status in 'mealmate' namespace..." -ForegroundColor Yellow
kubectl get pods -n mealmate

# 3. Start Ingress Port-Forward on Port 3000
Write-Host "`n[3/3] Opening MealMate on http://localhost:3000..." -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  MealMate is live at: http://localhost:3000          " -ForegroundColor Green
Write-Host "  Keep this window open to maintain access.           " -ForegroundColor Yellow
Write-Host "  Press Ctrl + C anytime to stop.                     " -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Cyan

kubectl port-forward --address 127.0.0.1 -n ingress-nginx svc/ingress-nginx-controller 3000:80
