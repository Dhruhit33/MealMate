#!/bin/bash
set -e

ECR_REGISTRY="__ECR_REGISTRY__"
ECR_PASSWORD="__ECR_PASSWORD__"
IMAGE_TAG="__IMAGE_TAG__"
K8S_NAMESPACE="__K8S_NAMESPACE__"

echo "==> Ensuring ECR pull secret in namespace ${K8S_NAMESPACE}..."
k3s kubectl delete secret ecr-secret -n "${K8S_NAMESPACE}" --ignore-not-found=true
k3s kubectl create secret docker-registry ecr-secret \
  --docker-server="${ECR_REGISTRY}" \
  --docker-username="AWS" \
  --docker-password="${ECR_PASSWORD}" \
  --namespace="${K8S_NAMESPACE}"

k3s kubectl patch serviceaccount default -n "${K8S_NAMESPACE}" -p '{"imagePullSecrets": [{"name": "ecr-secret"}]}' 2>/dev/null || true

SERVICES="api-gateway config-server delivery-service discovery-server notification-service order-service payment-service restaurant-service user-service"

echo "==> Starting zero-downtime rolling update for microservices..."
for svc in $SERVICES; do
  IMAGE_URI="${ECR_REGISTRY}/mealmate-${svc}:${IMAGE_TAG}"
  k3s kubectl patch deployment "${svc}" -n "${K8S_NAMESPACE}" -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ecr-secret"}]}}}}' 2>/dev/null || true
  k3s kubectl set image deployment/"${svc}" "${svc}=${IMAGE_URI}" -n "${K8S_NAMESPACE}" || true
done

echo "==> Verifying rolling update statuses..."
for svc in $SERVICES; do
  echo "Checking rollout status for ${svc}..."
  if ! k3s kubectl rollout status deployment/"${svc}" -n "${K8S_NAMESPACE}" --timeout=180s; then
    echo "❌ Rollout check failed for ${svc}! Rolling back to previous healthy state..."
    k3s kubectl rollout undo deployment/"${svc}" -n "${K8S_NAMESPACE}"
    exit 1
  fi
done

echo "==> Final pod statuses in namespace ${K8S_NAMESPACE}:"
k3s kubectl get pods -n "${K8S_NAMESPACE}"
