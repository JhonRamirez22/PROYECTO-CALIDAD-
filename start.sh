#!/bin/bash
# Start both API + Frontend in parallel
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== RiTech Export System ==="
echo "API:    http://localhost:3001"
echo "Web:    http://localhost:3000"
echo ""

# Kill previous instances on these ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Start API in background
cd "$DIR/apps/api"
echo "[1/2] Starting API..."
npm run start:dev &
API_PID=$!

# Start Frontend in background
cd "$DIR/apps/web"
export NEXT_PUBLIC_API_URL="http://localhost:3001"
echo "[2/2] Starting Frontend..."
npm run dev &
WEB_PID=$!

echo ""
echo "Both services running."
echo "  API PID: $API_PID"
echo "  Web PID: $WEB_PID"
echo ""
echo "Press Ctrl+C to stop both."

# Trap Ctrl+C to kill both
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait
