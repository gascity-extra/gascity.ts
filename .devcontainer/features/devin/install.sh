#!/bin/bash
set -e

# Devin CLI Installation Script

VERSION=${VERSION:-"latest"}

echo "Installing Devin CLI (version: ${VERSION})..."

# Install curl if not available
if ! command -v curl &> /dev/null; then
    apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
fi

# Install official Devin CLI
# Note: The official installer doesn't currently support version selection
# The VERSION parameter is reserved for future use when the installer supports it
curl -fsSL https://cli.devin.ai/install.sh | bash

# Copy devin to /usr/local/bin for global access
if [[ -f "$HOME/.local/bin/devin" ]]; then
    cp "$HOME/.local/bin/devin" /usr/local/bin/devin
    chmod +x /usr/local/bin/devin
    echo "Devin CLI copied to /usr/local/bin/devin"
else
    echo "Devin CLI installation failed: binary not found at \$HOME/.local/bin/devin" >&2
    exit 1
fi

echo "Devin CLI installed successfully!"