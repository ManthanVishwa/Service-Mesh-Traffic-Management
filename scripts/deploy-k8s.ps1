# Service Mesh Dashboard - Kubernetes Deployment Script (PowerShell)

Write-Host "🚀 Deploying Service Mesh Dashboard to Kubernetes..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Blue

$commands = @('kubectl', 'istioctl')
foreach ($cmd in $commands) {
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $cmd is required but not installed. Aborting." -ForegroundColor Red
        exit 1
    }
}

# Check cluster connection
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green

# Install Istio
Write-Host "`nInstalling Istio..." -ForegroundColor Blue
istioctl install --set profile=demo -y 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Istio already installed" -ForegroundColor Yellow
}

# Create namespaces
Write-Host "`nCreating namespaces..." -ForegroundColor Blue
kubectl apply -f k8s\00-namespace.yaml

# Build Docker images
Write-Host "`nBuilding Docker images..." -ForegroundColor Blue
docker build -t mesh-backend:latest .\backend
docker build -t mesh-frontend:latest .\frontend
docker build --build-arg VERSION=v1 -t dummy-service:v1 .\dummy-service
docker build --build-arg VERSION=v2 -t dummy-service:v2 .\dummy-service

# Load images to cluster (uncomment for Minikube)
# minikube image load mesh-backend:latest
# minikube image load mesh-frontend:latest
# minikube image load dummy-service:v1
# minikube image load dummy-service:v2

# Deploy PostgreSQL
Write-Host "`nDeploying PostgreSQL..." -ForegroundColor Blue
kubectl apply -f k8s\01-postgres.yaml

Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n mesh-dashboard --timeout=120s

# Deploy Backend
Write-Host "`nDeploying Backend API..." -ForegroundColor Blue
kubectl apply -f k8s\02-backend.yaml

# Deploy Frontend
Write-Host "`nDeploying Frontend..." -ForegroundColor Blue
kubectl apply -f k8s\03-frontend.yaml

# Deploy Dummy Services
Write-Host "`nDeploying Dummy Services..." -ForegroundColor Blue
kubectl apply -f k8s\04-dummy-service.yaml

# Apply Istio configurations
Write-Host "`nApplying Istio configurations..." -ForegroundColor Blue
kubectl apply -f k8s\istio\

# Deploy Monitoring
Write-Host "`nDeploying Prometheus & Grafana..." -ForegroundColor Blue
kubectl apply -f k8s\monitoring\

# Wait for deployments
Write-Host "`nWaiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/backend -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/frontend -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/dummy-service-v1 -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/dummy-service-v2 -n mesh-dashboard --timeout=180s

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`nAccess the dashboard:" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/frontend -n mesh-dashboard 3000:3000"
Write-Host "  Open: http://localhost:3000"
Write-Host "`nAccess Prometheus:" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/prometheus -n monitoring 9090:9090"
Write-Host "  Open: http://localhost:9090"
Write-Host "`nAccess Grafana:" -ForegroundColor Cyan
Write-Host "  kubectl port-forward svc/grafana -n monitoring 3000:3000"
Write-Host "  Open: http://localhost:3000 (admin/admin)"
Write-Host "`nView Istio dashboard:" -ForegroundColor Cyan
Write-Host "  istioctl dashboard kiali"
Write-Host "`nCheck deployment status:" -ForegroundColor Cyan
Write-Host "  kubectl get pods -n mesh-dashboard"
Write-Host "  kubectl get pods -n monitoring"
