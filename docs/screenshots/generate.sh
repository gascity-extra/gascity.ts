#!/bin/bash
set -e

echo "📸 Generating Documentation Screenshots"
echo "========================================"

# Check if console server is running
if ! curl -s http://localhost:8080 > /dev/null; then
  echo "⚠️  Console server not running on http://localhost:8080"
  echo "Starting console server..."
  
  # Start console server in background
  cd packages/@gascity/console
  bun run dev &
  CONSOLE_PID=$!
  
  # Wait for server to start
  echo "Waiting for server to start..."
  sleep 10
  
  # Check if server is now running
  if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Failed to start console server"
    exit 1
  fi
  
  echo "✅ Console server started"
else
  echo "✅ Console server already running"
fi

# Navigate back to docs/screenshots
cd ../../docs/screenshots

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Generate screenshots
echo "📸 Taking screenshots..."
bunx playwright test documentation.spec.ts --config=playwright.config.ts

# Check if screenshots were generated
if [ -d "screenshots" ] && [ "$(ls -A screenshots)" ]; then
  echo "✅ Screenshots generated successfully"
  echo "📁 Screenshots location: docs/screenshots/"
  ls -lh screenshots/
else
  echo "❌ No screenshots generated"
fi

# Kill the background server if we started it
if [ ! -z "$CONSOLE_PID" ]; then
  echo "🛑 Stopping console server..."
  kill $CONSOLE_PID
fi

echo "✨ Done!"
