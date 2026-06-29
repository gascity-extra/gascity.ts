#!/bin/bash
set -e

echo "Setting up Bun environment..."

# Add bun to PATH for current and future sessions
BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Constants for shell configuration
BUN_EXPORT_LINE='export BUN_INSTALL="$HOME/.bun"'
BUN_PATH_LINE='export PATH="$BUN_INSTALL/bin:$PATH"'

# Add to .bashrc if it exists
if [[ -f "$HOME/.bashrc" ]] && ! grep -q "$BUN_EXPORT_LINE" "$HOME/.bashrc"; then
    echo "$BUN_EXPORT_LINE" >> "$HOME/.bashrc"
    echo "$BUN_PATH_LINE" >> "$HOME/.bashrc"
fi

# Add to .zshrc if it exists
if [[ -f "$HOME/.zshrc" ]] && ! grep -q "$BUN_EXPORT_LINE" "$HOME/.zshrc"; then
    echo "$BUN_EXPORT_LINE" >> "$HOME/.zshrc"
    echo "$BUN_PATH_LINE" >> "$HOME/.zshrc"
fi

# Verify installation
if command -v bun &> /dev/null; then
    echo "Bun installed successfully!"
    bun --version
else
    echo "Warning: Bun binary not found on PATH, but should be available via Homebrew"
fi