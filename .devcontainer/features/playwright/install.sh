#!/bin/bash
set -e

# Playwright System Dependencies Installation Script
#
# Compatible with Ubuntu 22.04 / 24.04 / 26.04 (resolute). On 24.04+ many
# library packages gained a `t64` suffix in the SONAME bump; we probe
# for the suffixed name first and fall back to the legacy name so this
# feature works across the LTS spectrum.

BROWSERS=${BROWSERS:-"chromium"}
INSTALL_METHOD=${INSTALLMETHOD:-"auto"}

echo "Installing Playwright system dependencies (browsers: ${BROWSERS}, method: ${INSTALL_METHOD})..."

apt-get update -y

# Helper: install a list of packages, choosing the version that exists
# on this distro (handles the t64 transition that started on Ubuntu 24.04).
install_pkgs() {
    local pkgs=()
    for pkg in "$@"; do
        if apt-cache show "${pkg}t64" >/dev/null 2>&1; then
            pkgs+=("${pkg}t64")
        elif apt-cache show "${pkg}" >/dev/null 2>&1; then
            pkgs+=("${pkg}")
        else
            echo "WARN: ${pkg} (and ${pkg}t64) not in repos, skipping"
        fi
    done
    if [[ ${#pkgs[@]} -gt 0 ]]; then
        apt-get install -y "${pkgs[@]}"
    fi
}

install_pkgs \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxshmfence1 \
    libgl1 \
    libglib2.0-0 \
    libfontconfig1 \
    libfreetype6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    fonts-liberation \
    libu2f-udev \
    libvulkan1 \
    xvfb

# Additional dependencies for Firefox / WebKit (Chromium is covered above).
case "$BROWSERS" in
    "all"|"firefox"|"webkit")
        echo "Installing extra dependencies for ${BROWSERS}..."
        install_pkgs libdbus-1-3 libdbus-glib-1-2
        ;;
    "chromium")
        echo "Chromium-only dependencies already installed."
        ;;
    *)
        echo "Unknown BROWSERS=${BROWSERS}; defaulting to Chromium."
        ;;
esac

rm -rf /var/lib/apt/lists/*

# Optional: trigger Playwright browser download now (requires Node + deps).
if [[ "$INSTALL_METHOD" == "auto" ]]; then
    if command -v npx >/dev/null 2>&1; then
        echo "To install browser binaries later: npx playwright install ${BROWSERS}"
    fi
fi

# Headless display for non-X servers.
export DISPLAY=:99
for shell_config in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [[ -f "$shell_config" ]] && ! grep -q 'export DISPLAY=:99' "$shell_config"; then
        echo 'export DISPLAY=:99' >> "$shell_config"
    fi
done

echo "Playwright system dependencies installed for: ${BROWSERS}"