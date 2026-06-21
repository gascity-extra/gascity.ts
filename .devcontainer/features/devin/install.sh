#!/bin/bash
set -e

# Devin CLI Installation Script

echo "Installing Devin CLI..."

# Install curl if not available
if ! command -v curl &> /dev/null; then
    apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
fi

# Install official Devin CLI (ignore login errors in non-interactive mode)
curl -fsSL https://cli.devin.ai/install.sh | bash || true

# Copy devin to /usr/local/bin for global access
if [ -f "$HOME/.local/bin/devin" ]; then
    cp "$HOME/.local/bin/devin" /usr/local/bin/devin
    chmod +x /usr/local/bin/devin
    echo "Devin CLI copied to /usr/local/bin/devin"
fi

echo "Devin CLI installed successfully!"