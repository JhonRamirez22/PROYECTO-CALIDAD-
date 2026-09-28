#!/bin/bash
# Start Frontend (Next.js) on port 3000, pointing to local API
cd "$(dirname "$0")/apps/web"
export NEXT_PUBLIC_API_URL="http://localhost:3001"
echo "Starting Frontend on http://localhost:3000 ..."
npm run dev
