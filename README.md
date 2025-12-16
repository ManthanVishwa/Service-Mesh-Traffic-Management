# Service Mesh Traffic Management Dashboard

A full-stack application for managing traffic routing rules in a Kubernetes Service Mesh environment.

## 🏗️ Architecture

- **Frontend**: Next.js + TypeScript
- **Backend API**: Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio
- **GitOps**: ArgoCD
- **Monitoring**: Prometheus

## 📦 Project Structure

```
.
├── backend/          # Express API
├── frontend/         # Next.js Dashboard
├── dummy-service/    # Test microservice (v1 & v2)
├── k8s/             # Kubernetes manifests
├── gitops-repo/     # GitOps configuration
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Kubernetes cluster (Minikube/EKS)
- kubectl
- Istio CLI

### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management.git
   cd Service-Mesh-Traffic-Management
   ```

2. **Start all services:**

   ```bash
   docker-compose up -d
   ```

3. **Run Prisma migrations:**

   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **Access the dashboard:**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Dummy Service v1: http://localhost:5001
   - Dummy Service v2: http://localhost:5002

5. **View logs:**

   ```bash
   docker-compose logs -f
   ```

6. **Stop services:**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development (Manual Setup)

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management.git
   cd Service-Mesh-Traffic-Management
   ```

2. **Install dependencies for each service:**

   ```bash
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   cd dummy-service && npm install && cd ..
   ```

3. **Setup PostgreSQL:**

   ```bash
   docker run --name mesh-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=meshdb -p 5432:5432 -d postgres:15
   ```

4. **Configure backend environment:**
   Create `backend/.env`:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meshdb
   PORT=4000
   NODE_ENV=development
   ```

5. **Run Prisma migrations:**

   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   cd ..
   ```

6. **Start services in separate terminals:**

   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev

   # Terminal 3 - Dummy Service
   cd dummy-service && npm run dev
   ```

7. **Access the dashboard:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Dummy Service: http://localhost:5000

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Install Istio
istioctl install --set profile=demo -y

# Apply Istio configurations
kubectl apply -f k8s/istio/
```

## 📊 Features

- ✅ Create and manage traffic routing rules
- ✅ Visual traffic weight distribution (slider UI)
- ✅ Real-time rule deployment to Kubernetes
- ✅ Weighted routing (Canary deployments)
- ✅ GitOps workflow with ArgoCD
- ✅ Prometheus metrics integration
- ✅ Service Mesh visualization

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions and troubleshooting
- **[CUSTOMIZATION.md](CUSTOMIZATION.md)** - How to adapt this project for your own applications
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design decisions
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide

## 🔧 API Endpoints

### Backend API (Default: http://localhost:4000)

#### Traffic Rules Management

- `GET /api/rules` - Get all traffic rules
- `POST /api/rules` - Create/update a traffic rule
  ```json
  {
    "serviceName": "dummy-service",
    "v1Weight": 70,
    "v2Weight": 30
  }
  ```
- `POST /api/deploy-rule/:id` - Deploy rule to Kubernetes cluster
- `DELETE /api/rules/:id` - Delete a traffic rule

#### Metrics & Monitoring

- `GET /api/metrics/traffic` - Get traffic metrics from Prometheus
- `GET /metrics` - Prometheus metrics endpoint
- `GET /health` - Health check endpoint

### Frontend (Default: http://localhost:3000)

- `/` - Dashboard home page with traffic rules management
- Traffic weight sliders for canary deployments
- Real-time rule deployment status

### Dummy Service (Default: http://localhost:5000)

#### Service Endpoints

- `GET /` - Service version and basic info
- `GET /api/data` - Sample data endpoint
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint

**Note:** In Kubernetes, dummy-service runs as two versions (v1 and v2) for canary deployment testing.

### Monitoring & Observability

#### Prometheus (Default: http://localhost:9090)

- `/graph` - Query interface for metrics
- `/targets` - Service discovery and target health
- `/alerts` - Alert rules and status
- Key metrics to query:
  - `http_requests_total` - Total HTTP requests by service
  - `http_request_duration_seconds` - Request latency
  - `istio_requests_total` - Service mesh request metrics

#### Grafana (Default: http://localhost:3000)

- Login: `admin` / `admin`
- Pre-configured dashboards for Istio and application metrics
- Custom dashboards for traffic distribution visualization

#### Kiali (Istio Service Mesh Dashboard)

```bash
istioctl dashboard kiali
```

- Service topology visualization
- Traffic flow and metrics
- Istio configuration validation

### Kubernetes Port Forwarding

When deployed to Kubernetes, access services using port forwarding:

```bash
# Frontend
kubectl port-forward svc/frontend -n mesh-dashboard 3000:3000

# Backend API
kubectl port-forward svc/backend -n mesh-dashboard 4000:4000

# Prometheus
kubectl port-forward svc/prometheus -n monitoring 9090:9090

# Grafana
kubectl port-forward svc/grafana -n monitoring 3000:3000

# PostgreSQL (for debugging)
kubectl port-forward svc/postgres -n mesh-dashboard 5432:5432
```
