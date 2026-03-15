#!/bin/bash

echo "Stopping existing processes..."

# Kill any running node processes for backend
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "node dist/index.js" 2>/dev/null || true

# Kill any running electron processes
pkill -f "electron" 2>/dev/null || true

# Kill any running vite dev servers
pkill -f "vite" 2>/dev/null || true

# Also kill any node processes on ports 3000 and 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Starting backend server..."
cd backend
npm run build
node dist/index.js &
cd ..

sleep 2

echo "Starting frontend..."
cd frontend
npm run start &

echo "Application started!"
echo "Backend: http://127.0.0.1:3001"
echo "Frontend: http://localhost:5173 (or check Electron)"
