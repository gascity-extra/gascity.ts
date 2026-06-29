#!/bin/bash
set -e

echo "Setting up Bun environment..."

# Add bun to PATH for current and future sessions
BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Add to .bashrc if it exists
if [[ -f "$HOME/.bashrc" ]] && ! grep -q 'export BUN_INSTALL="$HOME/.bun"' "$HOME/.bashrc"; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.bashrc"
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
fi

# Add to .zshrc if it exists
if [[ -f "$HOME/.zshrc" ]] && ! grep -q 'export BUN_INSTALL="$HOME/.bun"' "$HOME/.zshrc"; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.zshrc"
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.zshrc"
fi

# Verify installation
if command -v bun &> /dev/null; then
    echo "Bun installed successfully!"
    bun --version
else
    echo "Warning: Bun binary not found on PATH, but should be available via Homebrew"
fi