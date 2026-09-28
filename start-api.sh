#!/bin/bash
# Start API (NestJS) on port 3001
cd "$(dirname "$0")/apps/api"
echo "Starting API on http://localhost:3001 ..."
npm run start:dev
