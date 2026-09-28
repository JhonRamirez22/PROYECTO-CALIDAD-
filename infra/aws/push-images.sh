#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AWS_PROFILE="${AWS_PROFILE:?Set AWS_PROFILE to the named AWS CLI profile}"
AWS_REGION="${AWS_REGION:?Set AWS_REGION to the selected AWS region}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL, for example https://api.example.com}"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "$ROOT" rev-parse --short HEAD)-$(date +%Y%m%d%H%M%S)}"
ACCOUNT_ID="$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

for repository in ritech-api ritech-web; do
  if ! aws ecr describe-repositories --repository-names "$repository" --region "$AWS_REGION" --profile "$AWS_PROFILE" >/dev/null 2>&1; then
    aws ecr create-repository \
      --repository-name "$repository" \
      --image-scanning-configuration scanOnPush=true \
      --region "$AWS_REGION" \
      --profile "$AWS_PROFILE" >/dev/null
  fi
done

aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" \
  | docker login --username AWS --password-stdin "$REGISTRY"

cd "$ROOT"
docker build --platform linux/amd64 -f apps/api/Dockerfile -t "$REGISTRY/ritech-api:${IMAGE_TAG}" .
docker push "$REGISTRY/ritech-api:${IMAGE_TAG}"

docker build --platform linux/amd64 \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  -f apps/web/Dockerfile \
  -t "$REGISTRY/ritech-web:${IMAGE_TAG}" .
docker push "$REGISTRY/ritech-web:${IMAGE_TAG}"

printf 'API_IMAGE=%s/ritech-api:%s\n' "$REGISTRY" "$IMAGE_TAG"
printf 'WEB_IMAGE=%s/ritech-web:%s\n' "$REGISTRY" "$IMAGE_TAG"
