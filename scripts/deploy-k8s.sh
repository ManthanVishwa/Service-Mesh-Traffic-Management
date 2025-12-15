#!/bin/bash

# Service Mesh Dashboard - Kubernetes Deployment Script

set -e

echo "🚀 Deploying Service Mesh Dashboard to Kubernetes..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required. Aborting."; exit 1; }
command -v istioctl >/dev/null 2>&1 || { echo "❌ istioctl is required. Aborting."; exit 1; }

# Check cluster connection
kubectl cluster-info >/dev/null 2>&1 || { echo "❌ Cannot connect to Kubernetes cluster. Aborting."; exit 1; }

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Install Istio
echo -e "${BLUE}Installing Istio...${NC}"
istioctl install --set profile=demo -y || echo "Istio already installed"

# Create namespaces
echo -e "${BLUE}Creating namespaces...${NC}"
kubectl apply -f k8s/00-namespace.yaml

# Build and load Docker images (for local clusters like Minikube/Kind)
echo -e "${BLUE}Building Docker images...${NC}"
docker build -t mesh-backend:latest ./backend
docker build -t mesh-frontend:latest ./frontend
docker build --build-arg VERSION=v1 -t dummy-service:v1 ./dummy-service
docker build --build-arg VERSION=v2 -t dummy-service:v2 ./dummy-service

# Load images to cluster (uncomment for Minikube)
# minikube image load mesh-backend:latest
# minikube image load mesh-frontend:latest
# minikube image load dummy-service:v1
# minikube image load dummy-service:v2

# Deploy PostgreSQL
echo -e "${BLUE}Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/01-postgres.yaml

echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n mesh-dashboard --timeout=120s

# Deploy Backend
echo -e "${BLUE}Deploying Backend API...${NC}"
kubectl apply -f k8s/02-backend.yaml

# Deploy Frontend
echo -e "${BLUE}Deploying Frontend...${NC}"
kubectl apply -f k8s/03-frontend.yaml

# Deploy Dummy Services
echo -e "${BLUE}Deploying Dummy Services...${NC}"
kubectl apply -f k8s/04-dummy-service.yaml

# Apply Istio configurations
echo -e "${BLUE}Applying Istio configurations...${NC}"
kubectl apply -f k8s/istio/

# Deploy Monitoring
echo -e "${BLUE}Deploying Prometheus & Grafana...${NC}"
kubectl apply -f k8s/monitoring/

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment/backend -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/frontend -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/dummy-service-v1 -n mesh-dashboard --timeout=180s
kubectl wait --for=condition=available deployment/dummy-service-v2 -n mesh-dashboard --timeout=180s

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access the dashboard:"
echo "  kubectl port-forward svc/frontend -n mesh-dashboard 3000:3000"
echo "  Open: http://localhost:3000"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward svc/prometheus -n monitoring 9090:9090"
echo "  Open: http://localhost:9090"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward svc/grafana -n monitoring 3000:3000"
echo "  Open: http://localhost:3000 (admin/admin)"
echo ""
echo "View Istio dashboard:"
echo "  istioctl dashboard kiali"
echo ""
echo "Check deployment status:"
echo "  kubectl get pods -n mesh-dashboard"
echo "  kubectl get pods -n monitoring"
