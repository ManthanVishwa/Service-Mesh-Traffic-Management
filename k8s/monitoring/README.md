# Prometheus & Grafana Monitoring

This directory contains monitoring configuration for the Service Mesh Dashboard.

## Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards

## Deployment

### 1. Create Monitoring Namespace

```bash
kubectl apply -f k8s/00-namespace.yaml
```

### 2. Deploy Prometheus

```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
```

Verify deployment:

```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 3. Deploy Grafana

```bash
kubectl apply -f k8s/monitoring/grafana.yaml
```

### 4. Access Dashboards

**Prometheus:**

```bash
kubectl port-forward svc/prometheus -n monitoring 9090:9090
```

Open: http://localhost:9090

**Grafana:**

```bash
kubectl port-forward svc/grafana -n monitoring 3000:3000
```

Open: http://localhost:3000

- Username: admin
- Password: admin

## Metrics Collected

### Backend API (`/metrics` endpoint)

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- Node.js process metrics

### Dummy Service (`/metrics` endpoint)

- `http_requests_total{version="v1"}` - Requests to v1
- `http_requests_total{version="v2"}` - Requests to v2
- `http_request_duration_seconds` - Response time by version

### Istio Metrics

- Request success rate
- Request latency (p50, p90, p99)
- Traffic distribution by service version
- Connection pool metrics

## Key Queries

### Traffic Distribution

```promql
# Percentage of traffic to v1
sum(rate(http_requests_total{job="dummy-service-v1"}[5m]))
/
sum(rate(http_requests_total{job=~"dummy-service.*"}[5m]))
* 100

# Percentage of traffic to v2
sum(rate(http_requests_total{job="dummy-service-v2"}[5m]))
/
sum(rate(http_requests_total{job=~"dummy-service.*"}[5m]))
* 100
```

### Request Rate by Version

```promql
rate(http_requests_total{job=~"dummy-service.*"}[5m])
```

### Average Response Time

```promql
rate(http_request_duration_seconds_sum{job=~"dummy-service.*"}[5m])
/
rate(http_request_duration_seconds_count{job=~"dummy-service.*"}[5m])
```

### Error Rate

```promql
rate(http_requests_total{status=~"5.."}[5m])
```

## Grafana Dashboards

The deployment includes a pre-configured dashboard:

- **Service Mesh Traffic Dashboard** - Shows real-time traffic distribution

### Import Additional Dashboards

1. Go to Grafana → Dashboards → Import
2. Import Istio dashboards:
   - Istio Performance Dashboard: ID `7645`
   - Istio Service Dashboard: ID `7636`
   - Istio Workload Dashboard: ID `7630`

## Validating Traffic Rules

After deploying an 80/20 traffic split:

1. Open Prometheus
2. Run query: `rate(http_requests_total{job=~"dummy-service.*"}[5m])`
3. Verify v2 receives ~20% of traffic
4. Check Grafana dashboard for visual confirmation

## Alerting (Optional)

Create alerting rules in `prometheus.yml`:

```yaml
rule_files:
  - /etc/prometheus/alerts.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

Example alert for high error rate:

```yaml
groups:
  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## Troubleshooting

**Metrics not appearing?**

- Check if services expose `/metrics` endpoint
- Verify ServiceMonitor labels match Prometheus selector
- Check Prometheus logs: `kubectl logs -n monitoring deployment/prometheus`

**Can't access Grafana?**

- Check service type: `kubectl get svc -n monitoring grafana`
- Use port-forward if LoadBalancer not available
- Reset password: `kubectl exec -it -n monitoring deployment/grafana -- grafana-cli admin reset-admin-password newpassword`
