#!/bin/bash
set -e

# sacp-conductor Installation Script

echo "Installing sacp-conductor..."

# Install curl if not available
if ! command -v curl &> /dev/null; then
    apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
fi

# Install Rust if not available
if ! command -v rustup &> /dev/null; then
    echo "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Install sacp-conductor
echo "Installing sacp-conductor via cargo..."
source "$HOME/.cargo/env"
cargo install sacp-conductor

# Create symlink for sacp-conductor
if [ -f "$HOME/.cargo/bin/sacp-conductor" ]; then
    ln -sf "$HOME/.cargo/bin/sacp-conductor" /usr/local/bin/sacp-conductor
    echo "sacp-conductor symlinked to /usr/local/bin/sacp-conductor"
else
    echo "Warning: sacp-conductor binary not found after installation"
fi

echo "sacp-conductor installed successfully!"
