# Setup Guide

## Prerequisites

Make sure you have the following installed:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **Docker & Docker Compose**: [Download](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download](https://git-scm.com/)

## For Kubernetes Deployment (Optional)

- **kubectl**: [Install Guide](https://kubernetes.io/docs/tasks/tools/)
- **Istio CLI**: [Install Guide](https://istio.io/latest/docs/setup/getting-started/#download)
- **Kubernetes Cluster**: Minikube, Docker Desktop, DigitalOcean, EKS, etc.

---

## Quick Start with Docker Compose

This is the **easiest way** to run the project:

```bash
# 1. Clone the repository
git clone https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management.git
cd Service-Mesh-Traffic-Management

# 2. Start all services
docker-compose up -d

# 3. Wait for services to be healthy (30-60 seconds)
docker-compose ps

# 4. Run database migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Open the dashboard
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000

# 6. Stop services when done
docker-compose down
```

---

## Local Development Setup

If you want to develop and make changes:

### 1. Clone and Install

```bash
git clone https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management.git
cd Service-Mesh-Traffic-Management
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Install Dummy Service Dependencies

```bash
cd dummy-service
npm install
cd ..
```

### 5. Start PostgreSQL

```bash
docker run --name mesh-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=meshdb \
  -p 5432:5432 \
  -d postgres:15
```

**Windows PowerShell:**

```powershell
docker run --name mesh-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=meshdb -p 5432:5432 -d postgres:15
```

### 6. Configure Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meshdb
PORT=4000
NODE_ENV=development
```

### 7. Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 8. Start Services

Open **3 separate terminals**:

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 3 - Dummy Service:**

```bash
cd dummy-service
npm run dev
```

### 9. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **Dummy Service**: http://localhost:5000

---

## Kubernetes Deployment

### Prerequisites

- Running Kubernetes cluster
- kubectl configured
- Istio installed

### Step 1: Install Istio

```bash
istioctl install --set profile=demo -y
```

### Step 2: Deploy Application

**Linux/macOS:**

```bash
./scripts/deploy-k8s.sh
```

**Windows:**

```powershell
.\scripts\deploy-k8s.ps1
```

**Or manually:**

```bash
# Create namespace
kubectl apply -f k8s/00-namespace.yaml

# Deploy services
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml
kubectl apply -f k8s/04-dummy-service.yaml

# Deploy Istio configs
kubectl apply -f k8s/istio/
```

### Step 3: Check Deployment

```bash
# Check pods
kubectl get pods -n mesh-dashboard

# Check services
kubectl get svc -n mesh-dashboard

# Check Istio resources
kubectl get gateway,virtualservice,destinationrule -n mesh-dashboard
```

### Step 4: Access the Application

```bash
# Get Istio Ingress Gateway external IP
kubectl get svc istio-ingressgateway -n istio-system

# Access at: http://<EXTERNAL-IP>
```

---

## Troubleshooting

### Docker Compose Issues

**Problem: Backend can't connect to PostgreSQL**

```bash
# Check if postgres is healthy
docker-compose ps

# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

**Problem: Port already in use**

```bash
# Stop all containers
docker-compose down

# Check what's using the port
# Windows:
netstat -ano | findstr :3000

# Linux/macOS:
lsof -i :3000

# Kill the process or change ports in docker-compose.yml
```

### Local Development Issues

**Problem: Prisma Client not generated**

```bash
cd backend
npx prisma generate
```

**Problem: Database migration failed**

```bash
cd backend
npx prisma migrate reset  # Warning: This deletes all data
npx prisma migrate deploy
```

**Problem: Module not found errors**

```bash
# Delete node_modules and reinstall
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf dummy-service/node_modules

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd dummy-service && npm install && cd ..
```

### Kubernetes Issues

**Problem: Pods not starting**

```bash
# Describe the pod to see errors
kubectl describe pod <pod-name> -n mesh-dashboard

# Check logs
kubectl logs <pod-name> -n mesh-dashboard

# Check if images are pulling correctly
kubectl get events -n mesh-dashboard
```

**Problem: Istio sidecars not injected**

```bash
# Enable automatic sidecar injection
kubectl label namespace mesh-dashboard istio-injection=enabled

# Restart deployments
kubectl rollout restart deployment -n mesh-dashboard
```

---

## Project Structure

```
.
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Helper functions
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── Dockerfile
│
├── frontend/               # Next.js + TypeScript
│   ├── src/
│   │   ├── app/           # Next.js 13 app directory
│   │   ├── components/    # React components
│   │   └── lib/           # API client
│   └── Dockerfile
│
├── dummy-service/         # Test microservice
│   ├── src/
│   │   └── index.ts      # Simple Express server
│   └── Dockerfile
│
├── k8s/                   # Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-postgres.yaml
│   ├── 02-backend.yaml
│   ├── 03-frontend.yaml
│   ├── 04-dummy-service.yaml
│   └── istio/            # Istio configs
│
├── scripts/              # Deployment scripts
│   ├── deploy-k8s.sh
│   └── deploy-k8s.ps1
│
├── docker-compose.yml    # Local development
└── README.md
```

---

## Environment Variables

### Backend

| Variable       | Default        | Description                          |
| -------------- | -------------- | ------------------------------------ |
| `DATABASE_URL` | Required       | PostgreSQL connection string         |
| `PORT`         | 4000           | Backend server port                  |
| `NODE_ENV`     | development    | Environment (development/production) |
| `KUBECONFIG`   | ~/.kube/config | Path to kubeconfig file              |

### Frontend

| Variable              | Default               | Description     |
| --------------------- | --------------------- | --------------- |
| `NEXT_PUBLIC_API_URL` | http://localhost:4000 | Backend API URL |

### Dummy Service

| Variable  | Default | Description                |
| --------- | ------- | -------------------------- |
| `VERSION` | v1      | Service version identifier |
| `PORT`    | 5000    | Service port               |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management/issues)
3. Create a new issue with detailed information

---

## License

MIT License - see [LICENSE](LICENSE) file for details
