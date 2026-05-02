#!/bin/bash

# Kilo Command: restart-app
# Kill running Electron app instances and restart

echo "🔄 Killing existing Electron processes..."

# Kill Electron processes (cross-platform)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # macOS/Linux
    pkill -f "electron.*hailstorm" 2>/dev/null || true
    pkill -f "Electron.*hailstorm" 2>/dev/null || true
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    taskkill /F /IM electron.exe /T 2>/dev/null || true
fi

# Wait a moment for processes to terminate
sleep 2

echo "🚀 Starting Hailstorm application..."
cd frontend && npm run start