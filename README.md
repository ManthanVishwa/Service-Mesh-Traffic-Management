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

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup PostgreSQL:**

   ```bash
   docker run --name mesh-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=meshdb -p 5432:5432 -d postgres:15
   ```

3. **Run Prisma migrations:**

   ```bash
   npm run dev:backend
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start services:**

   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend

   # Terminal 3 - Dummy Service
   npm run dev:dummy
   ```

5. **Access the dashboard:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Dummy Service: http://localhost:5000

### Docker Build

```bash
npm run docker:build
npm run docker:up
```

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

## 🔧 API Endpoints

- `GET /api/rules` - Get all traffic rules
- `POST /api/rules` - Create/update a traffic rule
- `POST /api/deploy-rule/:id` - Deploy rule to cluster
- `GET /api/health` - Health check

## 📝 License

MIT
