#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_NAME="${RITECH_DB_NAME:-ritech_sprint2}"
DB_USER="${PGUSER:-$(id -un)}"
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

if [[ ! "$DB_NAME" =~ ^[A-Za-z][A-Za-z0-9_]*$ ]]; then
  printf 'Nombre de base inválido: %s\n' "$DB_NAME" >&2
  exit 2
fi

EXISTING="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -Atc "SELECT datname FROM pg_database WHERE datname = '${DB_NAME}'" || true)"
if [[ "$EXISTING" == "$DB_NAME" ]]; then
  printf 'La base %s ya existe y no fue modificada. Usa otro valor para RITECH_DB_NAME.\n' "$DB_NAME" >&2
  exit 1
fi

createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -O "$DB_USER" "$DB_NAME"
cd "$PROJECT_ROOT/apps/api"
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/prisma db push --schema=prisma/schema.prisma
DATABASE_URL="$DATABASE_URL" RITECH_DEMO_PASSWORD="${RITECH_DEMO_PASSWORD:-}" npm run seed:sprint2

printf '\nBase creada: %s\n' "$DATABASE_URL"
printf 'Si no fijaste RITECH_DEMO_PASSWORD, el seeder imprimió una contraseña aleatoria para admin@ritech.local.\n'
