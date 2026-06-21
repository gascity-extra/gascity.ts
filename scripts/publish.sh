#!/bin/bash
set -e

echo "📦 Publishing gascity.ts packages to npm"
echo "=========================================="

# Check if npm token is set
if [ -z "$NPM_TOKEN" ]; then
  echo "❌ NPM_TOKEN environment variable is not set"
  echo "Please set it with: export NPM_TOKEN=your_npm_token"
  exit 1
fi

# Set npm token
npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"

# Build all packages
echo "🔨 Building packages..."
bun run build

# Check if packages are built
if [ ! -d "packages/@gascity/client/dist" ]; then
  echo "❌ Client package not built. Run 'bun run build' first."
  exit 1
fi

if [ ! -d "packages/@gascity/sdk/dist" ]; then
  echo "❌ SDK package not built. Run 'bun run build' first."
  exit 1
fi

# Publish client package
echo "📦 Publishing @gascity/client..."
cd packages/@gascity/client
npm publish --access public
cd ../..

# Publish SDK package
echo "📦 Publishing @gascity/sdk..."
cd packages/@gascity/sdk
npm publish --access public
cd ../..

echo "✅ All packages published successfully!"
echo ""
echo "Published packages:"
echo "  - @gascity/client@$(node -p "require('./packages/@gascity/client/package.json').version")"
echo "  - @gascity/sdk@$(node -p "require('./packages/@gascity/sdk/package.json').version")"
