#!/bin/bash
set -e

# Gas City Entrypoint Script
# Runs at container startup to register city

echo "Gas City entrypoint: registering city..."

# Read config options saved by install.sh
AUTOREGISTER=$(cat /usr/local/share/gascity/autoregister_enabled 2>/dev/null || echo "false")

echo "AutoRegister: ${AUTOREGISTER}"

# Try to find and navigate to workspace
if [ -d "/workspaces/gascity-devcontainer" ]; then
    cd /workspaces/gascity-devcontainer
elif [ -d "/workspaces/$(basename ${PWD})" ]; then
    cd /workspaces/$(basename ${PWD})
elif [ -d "${PWD}" ]; then
    # Stay in current directory if it's a git workspace
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Current directory is a git workspace: ${PWD}"
    fi
fi

if [ "${AUTOREGISTER}" = "true" ]; then
    echo "Registering city with supervisor..."
    # Configure Dolt identity (required for gc register)
    dolt config --global --add user.name "DevContainer User"
    dolt config --global --add user.email "devcontainer@localhost"
    gc register .
    echo "City registered and ready!"
else
    echo "Auto-register skipped"
fi
