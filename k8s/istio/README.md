# Service Mesh (Istio) Configuration

This directory contains all Istio Service Mesh configurations for the dashboard.

## Files

- `01-gateway.yaml` - Istio Gateway and Frontend VirtualService
- `02-dummy-service-traffic.yaml` - Initial traffic routing (100% v1, 0% v2)
- `03-destination-rules.yaml` - Traffic policies for resilience

## Deployment

1. **Install Istio** (if not already installed):

```bash
istioctl install --set profile=demo -y
```

2. **Label namespace for Istio injection**:

```bash
kubectl label namespace mesh-dashboard istio-injection=enabled
```

3. **Apply Istio configurations**:

```bash
kubectl apply -f k8s/istio/
```

4. **Verify Istio resources**:

```bash
kubectl get gateway,virtualservice,destinationrule -n mesh-dashboard
```

## Traffic Management

The dashboard will dynamically update `02-dummy-service-traffic.yaml` when you deploy traffic rules from the UI.

Example: To manually set 80/20 traffic split:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: dummy-service-vs
  namespace: mesh-dashboard
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

## Monitoring Traffic

View traffic distribution in Kiali:

```bash
istioctl dashboard kiali
```

View metrics in Grafana:

```bash
istioctl dashboard grafana
```
