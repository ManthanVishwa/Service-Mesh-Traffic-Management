# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Next.js Frontend     │
                    │   (Port 3000)          │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Express Backend      │
                    │   (Port 4000)          │
                    │   - CRUD API           │
                    │   - K8s Client         │
                    │   - Metrics            │
                    └───┬────────────────┬───┘
                        │                │
            ┌───────────▼─────┐     ┌───▼──────────────┐
            │   PostgreSQL    │     │   Kubernetes     │
            │   (Prisma ORM)  │     │   API Server     │
            └─────────────────┘     └───┬──────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │   Istio Service Mesh  │
                            │   - VirtualService    │
                            │   - DestinationRule   │
                            └───┬───────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────────┐  ┌──▼──────────┐  ┌▼────────────┐
        │ Dummy Service  │  │ Dummy Service│  │  Prometheus │
        │     v1         │  │     v2       │  │  Scraping   │
        │  (80% traffic) │  │ (20% traffic)│  │  Metrics    │
        └────────────────┘  └──────────────┘  └─────────────┘
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **UI Library**: Chakra UI
- **State Management**: SWR (React Hooks for data fetching)
- **Styling**: CSS-in-JS (Emotion)

### Backend

- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Validation**: Zod
- **K8s Integration**: @kubernetes/client-node
- **Metrics**: prom-client

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Service Mesh**: Istio
- **GitOps**: ArgoCD
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions (optional)

## Component Details

### 1. Frontend Dashboard (Next.js)

**Purpose**: User interface for managing traffic rules

**Key Features**:

- Create/Read/Update/Delete traffic rules
- Visual traffic weight slider (0-100%)
- Real-time rule status display
- One-click deployment to Kubernetes
- Responsive design

**Components**:

- `TrafficRulesList.tsx` - Display all rules with metrics
- `CreateRuleModal.tsx` - Form for creating new rules
- `Header.tsx` - Navigation and status indicators

**API Integration**:

```typescript
// lib/api.ts
export const trafficRulesApi = {
  getAll: () => GET /api/rules
  create: (data) => POST /api/rules
  deploy: (id) => POST /api/deploy-rule/:id
}
```

### 2. Backend API (Express)

**Purpose**: Business logic and Kubernetes integration

**Key Endpoints**:

- `GET /api/rules` - Fetch all traffic rules
- `POST /api/rules` - Create new traffic rule
- `PUT /api/rules/:id` - Update existing rule
- `POST /api/deploy-rule/:id` - Deploy rule to K8s
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

**Services**:

- `k8sService.ts` - Kubernetes API client
  - Generate Istio VirtualService YAML
  - Generate DestinationRule YAML
  - Apply configurations to cluster
  - Save to GitOps repository

### 3. Database (PostgreSQL + Prisma)

**Schema**:

```prisma
model TrafficRule {
  id            String   @id @default(uuid())
  serviceName   String
  version1Name  String
  version2Name  String
  version1Weight Int
  version2Weight Int
  ruleType      RuleType @default(WEIGHTED)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deployedAt    DateTime?
  isActive      Boolean  @default(true)
}
```

### 4. Dummy Microservice

**Purpose**: Test service for traffic routing

**Versions**:

- **v1**: Stable version

  - Response time: ~100ms
  - Error rate: ~30%
  - Message: "Hello from v1!"

- **v2**: Canary version
  - Response time: ~50ms (faster)
  - Error rate: ~10% (more reliable)
  - Message: "Hello from v2!"

**Endpoints**:

- `GET /` - Version info
- `GET /health` - Health check
- `GET /api/data` - Sample data (different latency)
- `GET /api/error` - Error testing (different error rates)
- `GET /metrics` - Prometheus metrics

### 5. Istio Service Mesh

**VirtualService**: Traffic routing rules

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: dummy-service-vs
spec:
  hosts:
    - dummy-service
  http:
    - route:
        - destination:
            host: dummy-service
            subset: v1
          weight: 80
        - destination:
            host: dummy-service
            subset: v2
          weight: 20
```

**DestinationRule**: Service version subsets

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: dummy-service-dr
spec:
  host: dummy-service
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

### 6. GitOps Workflow (ArgoCD)

**Flow**:

1. User creates traffic rule (80/20 split)
2. Backend generates Istio YAML
3. Backend commits to `gitops-repo/istio/`
4. ArgoCD detects Git change
5. ArgoCD applies to Kubernetes cluster
6. Istio updates traffic routing

**Benefits**:

- ✅ All changes tracked in Git
- ✅ Audit trail of modifications
- ✅ Easy rollback to previous configs
- ✅ Declarative infrastructure

### 7. Monitoring Stack

**Prometheus**:

- Scrapes metrics from all services
- Stores time-series data
- Provides query language (PromQL)

**Key Metrics**:

```promql
# Traffic distribution
sum(rate(http_requests_total{job="dummy-service-v1"}[5m]))
/
sum(rate(http_requests_total{job=~"dummy-service.*"}[5m]))
* 100

# Request latency
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
)

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

**Grafana**:

- Visualizes Prometheus metrics
- Pre-configured dashboards
- Real-time traffic distribution graphs

## Data Flow

### Creating a Traffic Rule

1. **User Input**: User fills form (service name, versions, weights)
2. **Frontend**: POST request to `/api/rules`
3. **Validation**: Zod schema validates input
4. **Database**: Prisma creates TrafficRule record
5. **Response**: Returns created rule to frontend

### Deploying a Traffic Rule

1. **User Action**: Click "Apply & Deploy" button
2. **Frontend**: POST to `/api/deploy-rule/:id`
3. **Backend**:
   - Fetch rule from database
   - Generate Istio VirtualService YAML
   - Generate Istio DestinationRule YAML
   - Save YAMLs to `gitops-repo/istio/`
   - Apply to Kubernetes cluster via K8s API
4. **Istio**: Updates traffic routing
5. **ArgoCD**: Detects Git change and syncs
6. **Backend**: Updates `deployedAt` timestamp
7. **Frontend**: Shows success notification

### Traffic Routing

1. **Client Request**: Hits dummy-service endpoint
2. **Istio Ingress**: Intercepts request
3. **VirtualService**: Checks routing rules
4. **Weight-Based Routing**:
   - 80% → dummy-service-v1 pods
   - 20% → dummy-service-v2 pods
5. **DestinationRule**: Identifies pod versions by labels
6. **Envoy Proxy**: Routes to selected pod
7. **Response**: Returns to client
8. **Metrics**: Recorded by Prometheus

## Security Considerations

- **Database**: Credentials stored in Kubernetes Secrets
- **API**: Input validation with Zod
- **K8s RBAC**: ServiceAccount with limited permissions
- **Istio mTLS**: Encrypted service-to-service communication
- **Container Security**: Non-root users, minimal base images

## Scalability

- **Frontend**: Stateless, horizontally scalable
- **Backend**: Stateless, horizontally scalable
- **Database**: PostgreSQL with connection pooling
- **Dummy Services**: Multiple replicas per version
- **Istio**: Load balancing across pod replicas

## High Availability

- **Multiple Replicas**: 2+ pods per service
- **Health Checks**: Liveness and readiness probes
- **Circuit Breaking**: Istio outlier detection
- **Automatic Failover**: Kubernetes self-healing

## Observability

- **Metrics**: Prometheus + Grafana
- **Logs**: Kubernetes logs (kubectl logs)
- **Tracing**: Istio distributed tracing (optional)
- **Service Mesh Topology**: Kiali dashboard
