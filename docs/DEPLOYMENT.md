# Deployment Guide

This guide walks you through deploying the Service Mesh Traffic Management Dashboard.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [ArgoCD GitOps Setup](#argocd-gitops-setup)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Quick Start

**On Linux/Mac:**

```bash
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

**On Windows (PowerShell):**

```powershell
.\scripts\setup-local.ps1
```

### Manual Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Setup environment files:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp dummy-service/.env.example dummy-service/.env
```

3. **Start PostgreSQL:**

```bash
docker run -d --name mesh-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=meshdb \
  -p 5432:5432 \
  postgres:15
```

4. **Run Prisma migrations:**

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
cd ..
```

5. **Start services:**

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Terminal 3 - Dummy Service
npm run dev:dummy
```

6. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Dummy Service: http://localhost:5000

---

## Docker Deployment

### Using Docker Compose

1. **Build and start all services:**

```bash
docker-compose up -d
```

2. **View logs:**

```bash
docker-compose logs -f
```

3. **Stop services:**

```bash
docker-compose down
```

### Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Dummy Service v1: http://localhost:5001
- Dummy Service v2: http://localhost:5002

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (Minikube, Kind, or cloud provider)
- kubectl configured
- Istio CLI (`istioctl`)
- Docker

### Automated Deployment

**On Linux/Mac:**

```bash
chmod +x scripts/deploy-k8s.sh
./scripts/deploy-k8s.sh
```

**On Windows (PowerShell):**

```powershell
.\scripts\deploy-k8s.ps1
```

### Manual Deployment

#### 1. Setup Kubernetes Cluster

**For Minikube:**

```bash
minikube start --cpus=4 --memory=8192
```

**For Kind:**

```bash
kind create cluster --name mesh-dashboard
```

#### 2. Install Istio

```bash
istioctl install --set profile=demo -y
```

Verify installation:

```bash
kubectl get pods -n istio-system
```

#### 3. Create Namespaces

```bash
kubectl apply -f k8s/00-namespace.yaml
```

#### 4. Build Docker Images

```bash
docker build -t mesh-backend:latest ./backend
docker build -t mesh-frontend:latest ./frontend
docker build --build-arg VERSION=v1 -t dummy-service:v1 ./dummy-service
docker build --build-arg VERSION=v2 -t dummy-service:v2 ./dummy-service
```

**For Minikube, load images:**

```bash
minikube image load mesh-backend:latest
minikube image load mesh-frontend:latest
minikube image load dummy-service:v1
minikube image load dummy-service:v2
```

**For Kind, load images:**

```bash
kind load docker-image mesh-backend:latest --name mesh-dashboard
kind load docker-image mesh-frontend:latest --name mesh-dashboard
kind load docker-image dummy-service:v1 --name mesh-dashboard
kind load docker-image dummy-service:v2 --name mesh-dashboard
```

#### 5. Deploy Application

```bash
# Deploy PostgreSQL
kubectl apply -f k8s/01-postgres.yaml

# Wait for PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n mesh-dashboard --timeout=120s

# Deploy Backend
kubectl apply -f k8s/02-backend.yaml

# Deploy Frontend
kubectl apply -f k8s/03-frontend.yaml

# Deploy Dummy Services
kubectl apply -f k8s/04-dummy-service.yaml

# Apply Istio configurations
kubectl apply -f k8s/istio/
```

#### 6. Deploy Monitoring

```bash
kubectl apply -f k8s/monitoring/
```

#### 7. Verify Deployment

```bash
kubectl get pods -n mesh-dashboard
kubectl get pods -n monitoring
kubectl get svc -n mesh-dashboard
```

#### 8. Access the Application

**Port Forward Frontend:**

```bash
kubectl port-forward svc/frontend -n mesh-dashboard 3000:3000
```

Open: http://localhost:3000

**Port Forward Backend (optional):**

```bash
kubectl port-forward svc/backend -n mesh-dashboard 4000:4000
```

**Access Prometheus:**

```bash
kubectl port-forward svc/prometheus -n monitoring 9090:9090
```

Open: http://localhost:9090

**Access Grafana:**

```bash
kubectl port-forward svc/grafana -n monitoring 3000:3000
```

Open: http://localhost:3000 (admin/admin)

**Istio Dashboard:**

```bash
istioctl dashboard kiali
```

---

## ArgoCD GitOps Setup

### 1. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Access ArgoCD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Get admin password:

```bash
# Linux/Mac
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Windows PowerShell
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

Open: https://localhost:8080

- Username: admin
- Password: [from command above]

### 3. Configure Git Repository

1. Push your project to a Git repository (GitHub, GitLab, etc.)
2. In ArgoCD UI → Settings → Repositories
3. Click "Connect Repo"
4. Enter repository URL and credentials

### 4. Create ArgoCD Application

Update `gitops-repo/argocd/mesh-dashboard-app.yaml` with your repository URL, then:

```bash
kubectl apply -f gitops-repo/argocd/mesh-dashboard-app.yaml
```

Or create via ArgoCD UI:

- Application Name: `mesh-dashboard-istio`
- Project: `default`
- Repository URL: `[your-git-repo-url]`
- Path: `gitops-repo/istio`
- Cluster: `https://kubernetes.default.svc`
- Namespace: `mesh-dashboard`

### 5. Enable Auto-Sync (Optional)

```bash
argocd app set mesh-dashboard-istio --sync-policy automated
```

---

## Troubleshooting

### PostgreSQL Connection Issues

Check if PostgreSQL is running:

```bash
kubectl logs -n mesh-dashboard deployment/postgres
```

Test connection from backend pod:

```bash
kubectl exec -it -n mesh-dashboard deployment/backend -- sh
# Inside pod:
nc -zv postgres 5432
```

### Backend API Errors

Check backend logs:

```bash
kubectl logs -n mesh-dashboard deployment/backend -f
```

Check if database migrations ran:

```bash
kubectl exec -it -n mesh-dashboard deployment/backend -- npm run prisma:migrate status
```

### Istio Sidecar Not Injected

Verify namespace has Istio injection enabled:

```bash
kubectl get namespace mesh-dashboard --show-labels
```

If not, enable it:

```bash
kubectl label namespace mesh-dashboard istio-injection=enabled
kubectl rollout restart deployment -n mesh-dashboard
```

### Traffic Rules Not Working

Check Istio configuration:

```bash
kubectl get virtualservice,destinationrule -n mesh-dashboard
```

View Istio proxy logs:

```bash
kubectl logs -n mesh-dashboard deployment/dummy-service-v1 -c istio-proxy
```

### Metrics Not Appearing in Prometheus

Check if services expose `/metrics`:

```bash
kubectl port-forward -n mesh-dashboard svc/backend 4000:4000
curl http://localhost:4000/metrics
```

Check Prometheus configuration:

```bash
kubectl logs -n monitoring deployment/prometheus -f
```

### Image Pull Errors

For local clusters (Minikube/Kind), ensure images are loaded:

```bash
# Minikube
minikube image ls | grep mesh

# Kind
docker exec -it mesh-dashboard-control-plane crictl images | grep mesh
```

### Port Forward Keeps Disconnecting

Use `--address 0.0.0.0` to bind to all interfaces:

```bash
kubectl port-forward --address 0.0.0.0 svc/frontend -n mesh-dashboard 3000:3000
```

### Clean Up Everything

```bash
# Delete all resources
kubectl delete namespace mesh-dashboard monitoring argocd

# Uninstall Istio
istioctl uninstall --purge -y

# Delete Minikube cluster
minikube delete

# Delete Kind cluster
kind delete cluster --name mesh-dashboard
```

---

## Next Steps

After deployment:

1. ✅ Create your first traffic rule in the dashboard
2. ✅ Deploy a 80/20 canary deployment
3. ✅ Monitor traffic in Prometheus/Grafana
4. ✅ View service mesh topology in Kiali
5. ✅ Experiment with different traffic splits

For more information, see:

- [Kubernetes README](../k8s/README.md)
- [Istio Configuration](../k8s/istio/README.md)
- [Monitoring Setup](../k8s/monitoring/README.md)
- [GitOps Workflow](../gitops-repo/README.md)
