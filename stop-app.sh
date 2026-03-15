#!/bin/bash

echo "Stopping all processes..."

# Kill any running node processes for backend
pkill -f "node dist/index.js" 2>/dev/null || true

# Kill any running electron processes
pkill -f "electron" 2>/dev/null || true

# Kill any running vite dev servers
pkill -f "vite" 2>/dev/null || true

# Also kill any node processes on ports 3000 and 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "All processes stopped."
