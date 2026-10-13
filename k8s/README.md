# ☸️ MealMate Kubernetes Architecture (`k8s/`)

This directory provides complete, cloud-ready Kubernetes manifests for MealMate with **Container Orchestration**, **Multi-Instance Replicas**, and **Horizontal Pod Autoscaling (HPA)**.

---

## 🎯 Key Guarantees
* **Zero Backend Code Changes**: Connects via existing environment variables (`DB_HOST`, `REDIS_HOST`, `KAFKA_BOOTSTRAP`, `EUREKA_URL`).
* **Zero Frontend Design Changes**: The React UI runs unmodified; Ingress routes `/` to Frontend and `/api/` to API Gateway.
* **No Cluster in Local Docker**: These are purely declarative static manifests. They do not run or consume resources on your local machine unless you explicitly apply them to a cluster.

---

## 📁 Directory Structure

```text
k8s/
├── 00-namespace.yaml          # Creates isolated 'mealmate' namespace
├── 01-configmap.yaml          # Shared config (Eureka, Kafka, Redis, DB hosts)
├── 01-secrets.yaml            # Database passwords, JWT secret
├── 02-infrastructure/
│   ├── mysql.yaml             # MySQL with 10Gi PVC storage
│   ├── redis.yaml             # Redis with 2Gi PVC storage
│   └── kafka.yaml             # Zookeeper & Apache Kafka brokers
├── 03-core/
│   ├── config-server.yaml     # Spring Cloud Config Server
│   └── discovery-server.yaml  # Spring Cloud Eureka Service Registry
├── 04-services/               # Business Microservices (Replicas: 2 each)
│   ├── api-gateway.yaml       # API Gateway with Spring Actuator health probes
│   ├── user-service.yaml
│   ├── restaurant-service.yaml
│   ├── order-service.yaml
│   ├── payment-service.yaml
│   ├── delivery-service.yaml
│   └── notification-service.yaml
├── 05-frontend/
│   └── frontend.yaml          # React SPA Nginx Deployment (Replicas: 2)
├── 06-autoscaling/
│   └── hpa.yaml               # CPU-based Horizontal Pod Autoscalers (2 to 10 replicas)
└── 07-ingress/
    └── ingress.yaml           # Nginx Ingress Controller routing (/ & /api/ & /ws/)
```

---

## 🚀 How to Deploy (When ready on any K8s cluster)

To deploy to any remote Kubernetes cluster (e.g. AWS EKS, Minikube, or GKE):

```bash
# 1. Apply namespace, configs, and secrets
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/01-secrets.yaml

# 2. Deploy infrastructure (MySQL, Redis, Kafka)
kubectl apply -f k8s/02-infrastructure/

# 3. Deploy Spring Cloud Core
kubectl apply -f k8s/03-core/

# 4. Deploy all microservices & frontend
kubectl apply -f k8s/04-services/
kubectl apply -f k8s/05-frontend/

# 5. Enable Autoscaling & Ingress
kubectl apply -f k8s/06-autoscaling/
kubectl apply -f k8s/07-ingress/
```

Or apply everything recursively:
```bash
kubectl apply -f k8s/ -R
```

---

## 📈 Monitoring Autoscaling
To view autoscaling in action:
```bash
kubectl get hpa -n mealmate
```
