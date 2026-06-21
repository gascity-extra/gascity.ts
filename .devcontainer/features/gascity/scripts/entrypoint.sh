#!/bin/bash
set -e

# Gas City Entrypoint Script
# Runs at container startup to register city

echo "Gas City entrypoint: registering city..."

# Read config options saved by install.sh
AUTOREGISTER=$(cat /usr/local/share/gascity/autoregister_enabled 2>/dev/null || echo "false")

echo "AutoRegister: ${AUTOREGISTER}"

# Try to find and navigate to workspace
WORKSPACE_DIR=""

# Check common workspace locations
if [ -d "/workspaces/gascity-devcontainer" ]; then
    WORKSPACE_DIR="/workspaces/gascity-devcontainer"
elif [ -d "/workspaces/gascity.ts" ]; then
    WORKSPACE_DIR="/workspaces/gascity.ts"
elif [ -d "/workspaces/$(basename "${PWD}")" ]; then
    WORKSPACE_DIR="/workspaces/$(basename "${PWD}")"
fi

# Navigate to workspace if found
if [ -n "$WORKSPACE_DIR" ]; then
    echo "Navigating to workspace: ${WORKSPACE_DIR}"
    cd "$WORKSPACE_DIR"
elif git rev-parse --git-dir > /dev/null 2>&1; then
    # Stay in current directory if it's a git workspace
    echo "Current directory is a git workspace: ${PWD}"
else
    echo "Warning: Could not determine workspace directory, using current directory: ${PWD}"
fi

if [ "${AUTOREGISTER}" = "true" ]; then
    echo "Registering city with supervisor..."

    # Check if dolt is available
    if ! command -v dolt &> /dev/null; then
        echo "Warning: dolt not found, skipping Dolt identity configuration"
    else
        # Configure Dolt identity (required for gc register)
        dolt config --global --add user.name "DevContainer User"
        dolt config --global --add user.email "devcontainer@localhost"
    fi

    # Check if gc is available
    if ! command -v gc &> /dev/null; then
        echo "Error: gc not found, cannot register city"
        exit 1
    fi

    gc register .
    echo "City registered and ready!"
else
    echo "Auto-register skipped"
fi
