# Adapting This Project for Your Own Application

This guide explains how to customize this Service Mesh Traffic Management Dashboard to work with your own applications and services.

## Overview

This project provides a **reusable framework** for managing traffic routing in any Kubernetes service mesh environment. You can adapt it to manage traffic for your own microservices.

---

## What You Get

- ✅ Ready-to-use dashboard for creating traffic rules
- ✅ Backend API for managing and deploying Istio configurations
- ✅ Database schema for storing traffic rules
- ✅ Kubernetes and Istio integration
- ✅ Docker Compose setup for local testing

---

## Steps to Adapt for Your Application

### **Step 1: Run Locally to Understand the Flow**

First, run the project as-is to understand how it works:

```bash
# Clone and run
git clone https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management.git
cd Service-Mesh-Traffic-Management
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy

# Access dashboard at http://localhost:3000
```

Test creating a rule for the dummy-service to see how traffic routing works.

---

### **Step 2: Identify Your Services**

Determine which of your microservices need traffic management:

**Example:**

```
Your Application:
├── user-service (v1, v2)      ← Needs traffic management
├── payment-service (v1, v2)   ← Needs traffic management
├── auth-service               ← Single version, no routing needed
└── notification-service       ← Single version, no routing needed
```

---

### **Step 3: Replace Dummy Service with Your Services**

#### **Option A: Use Dashboard to Manage Existing Services**

If your services are already deployed in Kubernetes:

1. Deploy the dashboard (frontend + backend + database)
2. Use the UI to create traffic rules for your existing services
3. The backend will generate and apply Istio configs automatically

**No code changes needed!** The dashboard is service-agnostic.

#### **Option B: Deploy Your Services Using This Project Structure**

Replace the dummy-service with your actual services:

**Your Project Structure:**

```
Service-Mesh-Traffic-Management/
├── backend/                    # Keep as-is
├── frontend/                   # Keep as-is
├── user-service/              # Replace dummy-service
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── payment-service/           # Add your services
│   ├── Dockerfile
│   ├── src/
│   └── package.json
└── k8s/
    ├── backend.yaml           # Keep
    ├── frontend.yaml          # Keep
    ├── user-service.yaml      # Replace dummy-service
    └── payment-service.yaml   # Add your services
```

---

### **Step 4: Update Kubernetes Manifests**

#### **4.1: Create K8s Deployment for Your Service**

Copy `k8s/04-dummy-service.yaml` and modify:

**Example: `k8s/05-user-service.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-v1
  namespace: mesh-dashboard
  labels:
    app: user-service
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
      version: v1
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      containers:
        - name: user-service
          image: YOUR_DOCKERHUB_USERNAME/user-service:v1
          ports:
            - containerPort: 8080
          env:
            - name: VERSION
              value: "v1"
---
# v2 deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-v2
  namespace: mesh-dashboard
  labels:
    app: user-service
    version: v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
      version: v2
  template:
    metadata:
      labels:
        app: user-service
        version: v2
    spec:
      containers:
        - name: user-service
          image: YOUR_DOCKERHUB_USERNAME/user-service:v2
          ports:
            - containerPort: 8080
          env:
            - name: VERSION
              value: "v2"
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: mesh-dashboard
spec:
  selector:
    app: user-service
  ports:
    - port: 8080
      targetPort: 8080
```

**Key Points:**

- ✅ Use `version: v1` and `version: v2` labels (Istio requires these)
- ✅ Service name must match what you'll use in the dashboard
- ✅ Both versions must use the same Service name
- ✅ Update image paths to your Docker images

---

### **Step 5: Update Docker Compose (Optional, for Local Testing)**

If you want to test locally with your services:

**Update `docker-compose.yml`:**

```yaml
services:
  postgres:
    # Keep as-is

  backend:
    # Keep as-is

  frontend:
    # Keep as-is

  user-service-v1:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    container_name: user-service-v1
    environment:
      VERSION: v1
      PORT: 8080
    ports:
      - "8081:8080"
    restart: unless-stopped

  user-service-v2:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    container_name: user-service-v2
    environment:
      VERSION: v2
      PORT: 8080
    ports:
      - "8082:8080"
    restart: unless-stopped
```

---

### **Step 6: Update Backend Namespace (Optional)**

The backend applies Istio configs to the `default` namespace by default.

**To change namespace:**

Edit `backend/src/services/k8sService.ts`:

```typescript
// Line 52 and 85
// Change from:
namespace: "default",

// To:
namespace: "mesh-dashboard",  // or your namespace
```

Or make it configurable via environment variable:

```typescript
const NAMESPACE = process.env.K8S_NAMESPACE || "default";

// Then use:
namespace: NAMESPACE,
```

Add to `backend/.env`:

```env
K8S_NAMESPACE=mesh-dashboard
```

---

### **Step 7: Build and Push Your Service Images**

```bash
# Build your service
docker build -t YOUR_DOCKERHUB_USERNAME/user-service:v1 ./user-service
docker build -t YOUR_DOCKERHUB_USERNAME/user-service:v2 ./user-service

# Push to DockerHub
docker login
docker push YOUR_DOCKERHUB_USERNAME/user-service:v1
docker push YOUR_DOCKERHUB_USERNAME/user-service:v2
```

---

### **Step 8: Deploy to Kubernetes**

```bash
# Deploy dashboard
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml

# Deploy YOUR services
kubectl apply -f k8s/05-user-service.yaml
kubectl apply -f k8s/06-payment-service.yaml

# Check deployment
kubectl get pods -n mesh-dashboard
```

---

### **Step 9: Create Traffic Rules via Dashboard**

1. **Access the dashboard** (get external IP):

   ```bash
   kubectl get svc istio-ingressgateway -n istio-system
   # Or port-forward for testing
   kubectl port-forward svc/frontend -n mesh-dashboard 3000:3000
   ```

2. **Open**: http://localhost:3000

3. **Create a new rule**:

   - Service Name: `user-service` (must match K8s Service name)
   - Version 1 Name: `v1`
   - Version 2 Name: `v2`
   - Version 1 Weight: `80`
   - Version 2 Weight: `20`
   - Rule Type: `WEIGHTED`

4. **Click "Deploy"**

5. **Backend will**:
   - Generate Istio VirtualService
   - Generate Istio DestinationRule
   - Apply to your cluster
   - 80% traffic → v1, 20% traffic → v2

---

### **Step 10: Verify Traffic Routing**

```bash
# Check Istio configs were created
kubectl get virtualservice -n mesh-dashboard
kubectl get destinationrule -n mesh-dashboard

# Test your service
# Traffic should split 80/20 between versions
for i in {1..10}; do
  curl http://user-service:8080/api/users
  echo ""
done
```

---

## Customization Options

### **Add Custom Rule Types**

The project supports 3 rule types: `WEIGHTED`, `HEADER_MATCH`, `PATH_BASED`

Currently, only `WEIGHTED` is fully implemented. To add others:

**Edit `backend/src/services/k8sService.ts`:**

```typescript
// Add header-based routing
if (rule.ruleType === "HEADER_MATCH") {
  virtualService.spec.http = [
    {
      match: [
        {
          headers: {
            "user-type": {
              exact: "premium",
            },
          },
        },
      ],
      route: [
        {
          destination: {
            host: rule.serviceName.toLowerCase(),
            subset: rule.version2Name,
          },
          weight: 100,
        },
      ],
    },
    {
      route: [
        {
          destination: {
            host: rule.serviceName.toLowerCase(),
            subset: rule.version1Name,
          },
          weight: 100,
        },
      ],
    },
  ];
}
```

---

### **Add Authentication**

The dashboard currently has no authentication. To add:

**Backend (Option 1: JWT Auth):**

```bash
cd backend
npm install jsonwebtoken express-jwt
```

**Backend (Option 2: OAuth with Auth0/Okta):**

```bash
npm install passport passport-oauth2
```

**Frontend: Add login page**

```bash
cd frontend
npm install next-auth
```

---

### **Add RBAC for Multi-Tenant**

Allow different teams to manage their own services:

**Database: Add User model**

```prisma
// backend/prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("user")
  rules     TrafficRule[]
}

model TrafficRule {
  // ... existing fields
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

**Backend: Filter rules by user**

```typescript
// routes/rules.ts
router.get("/", authenticateUser, async (req, res) => {
  const rules = await prisma.trafficRule.findMany({
    where: { userId: req.user.id },
  });
  res.json({ success: true, data: rules });
});
```

---

### **Add Metrics and Monitoring**

The project already has Prometheus integration. To visualize:

**Deploy Prometheus & Grafana:**

```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

**Access Grafana:**

```bash
kubectl port-forward svc/grafana -n mesh-dashboard 3001:3000
# Open http://localhost:3001
# Default: admin/admin
```

**Add Istio dashboards:**

- Import Grafana dashboard ID: `7645` (Istio Mesh)
- Import Grafana dashboard ID: `7636` (Istio Service)

---

### **Add Canary Analysis Automation**

Automatically promote/rollback based on metrics:

**Install Flagger:**

```bash
kubectl apply -k github.com/fluxcd/flagger//kustomize/istio
```

**Create Canary resource:**

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: user-service
  namespace: mesh-dashboard
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service-v2
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
```

---

## Production Checklist

Before deploying to production:

- [ ] Add authentication to dashboard
- [ ] Set up HTTPS/TLS with cert-manager
- [ ] Configure production database (not in-cluster Postgres)
- [ ] Set up proper secrets management (Vault, Sealed Secrets)
- [ ] Configure resource limits in K8s manifests
- [ ] Set up alerting (Prometheus Alertmanager)
- [ ] Configure backup for database
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add rate limiting to API
- [ ] Configure CORS properly
- [ ] Set up log aggregation (ELK, Loki)
- [ ] Enable Pod Security Policies
- [ ] Configure NetworkPolicies
- [ ] Set up disaster recovery plan

---

## Common Use Cases

### **1. Canary Deployment**

Start with 5% traffic to new version:

```
v1: 95%
v2: 5%

→ Monitor metrics for 1 hour
→ If good, increase to 25%
→ Continue until 100%
```

### **2. Blue-Green Deployment**

Instant switch between versions:

```
v1: 100%  →  v1: 0%
v2: 0%    →  v2: 100%
```

### **3. A/B Testing**

Split traffic 50/50 for testing:

```
v1: 50%
v2: 50%

→ Compare conversion rates
→ Choose winner
```

### **4. Feature Flags via Headers**

Route premium users to new features:

```
Header: user-tier=premium → v2
Default → v1
```

---

## Example: Real-World E-Commerce Application

**Services:**

```
├── frontend-service (v1, v2)
├── product-service (v1, v2, v3)
├── cart-service (v1, v2)
├── payment-service (v1)
├── user-service (v1, v2)
└── notification-service (v1)
```

**Traffic Management Strategy:**

1. Deploy `product-service:v3` with 5% traffic
2. Monitor error rates and latency
3. Gradually increase to 100% over 2 weeks
4. Rollback instantly if issues detected

**Dashboard Usage:**

- Create rule: `product-service`, v2=95%, v3=5%
- Monitor via Grafana
- Update rule: v2=50%, v3=50%
- Final: v2=0%, v3=100%

---

## Support

For questions about adapting this project:

1. Check examples in this guide
2. Review the [SETUP.md](SETUP.md) for deployment details
3. Open an issue: [GitHub Issues](https://github.com/ManthanVishwa/Service-Mesh-Traffic-Management/issues)

---

## Contributing Your Adaptations

If you build something cool with this project:

1. Fork the repo
2. Add your example to `examples/` directory
3. Submit a PR with your use case

We'd love to see how you're using it!

---

## License

This project is MIT licensed - freely adapt and use for your applications!
