#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/opt/ritech/app
COMPOSE_FILE=infra/aws/ec2/compose.yml
cd "$APP_DIR"

if [[ "${1:-}" == "update" ]]; then
  git fetch origin main
git reset --hard origin/main
fi

compose() {
  docker compose --env-file .env.production -f "$COMPOSE_FILE" "$@"
}

compose --profile setup run --rm migrate
compose build api
compose build web
compose up -d --remove-orphans
compose ps
