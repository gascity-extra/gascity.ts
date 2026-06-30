#!/bin/bash
set -e

# Kilo CLI dependency installation script for Devcontainers.
#
# The kilo CLI binary itself is installed via the `homebrew` feature, which
# this feature pulls in via `dependsOn` (see devcontainer-feature.json) with
# "Kilo-Org/tap/kilo" passed through its `packages` option. This script
# installs the apt-level dependency (libnotify-bin, which provides
# /usr/bin/notify-send) that the CLI and related tooling use for desktop
# notifications.

echo "Installing kilo CLI apt dependencies..."

if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y libnotify-bin
    rm -rf /var/lib/apt/lists/*
else
    echo "Warning: apt-get not available; skipping libnotify-bin install" >&2
fi

echo "Kilo CLI apt dependencies installed successfully!"
