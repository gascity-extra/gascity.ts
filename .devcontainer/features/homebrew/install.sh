#!/bin/bash
set -e

# Homebrew Installation Script for Devcontainers

PACKAGES=${PACKAGES:-$HOMEBREW_PACKAGES}

echo "Installing Homebrew..."

# Install Homebrew for non-root user if not available
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew for non-root user..."
    
    # Install Linuxbrew as non-root user (vscode)
    export NONROOT_USER=vscode
    export HOMEBREW_PREFIX=/home/linuxbrew/.linuxbrew
    export HOMEBREW_CELLAR=/home/linuxbrew/.linuxbrew/Cellar
    export HOMEBREW_REPOSITORY=/home/linuxbrew/.linuxbrew/Homebrew
    
    # Install Homebrew non-interactively
    sudo -u $NONROOT_USER /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || true
fi

# Add Homebrew to PATH for all users
echo "export PATH=\"/home/linuxbrew/.linuxbrew/bin:\$PATH\"" >> /etc/profile.d/homebrew.sh
chmod +x /etc/profile.d/homebrew.sh

# Set HOME for non-root user
export HOMEBREW_PREFIX=/home/linuxbrew/.linuxbrew
export PATH="$HOMEBREW_PREFIX/bin:$PATH"

echo "Homebrew installed successfully!"

# Install packages if specified
if [ -n "$PACKAGES" ]; then
    echo "Installing packages: $PACKAGES"
    
    # Convert JSON array to space-separated list
    PACKAGES_LIST=$(echo "$PACKAGES" | sed 's/\[//g' | sed 's/\]//g' | sed 's/,/ /g' | tr -d '"')
    
    if [ "$(id -u)" = "0" ]; then
        sudo -u vscode /home/linuxbrew/.linuxbrew/bin/brew install $PACKAGES_LIST || sudo -u vscode /home/linuxbrew/.linuxbrew/bin/brew upgrade $PACKAGES_LIST
    else
        brew install $PACKAGES_LIST || brew upgrade $PACKAGES_LIST
    fi
    
    echo "Packages installed successfully!"
    
    # Create symlinks for common binaries
    for package in $PACKAGES_LIST; do
        # Extract package name (last part after /)
        package_name=$(echo "$package" | awk -F'/' '{print $NF}')
        if [ -f "/home/linuxbrew/.linuxbrew/bin/$package_name" ] && [ ! -f "/usr/local/bin/$package_name" ]; then
            ln -sf /home/linuxbrew/.linuxbrew/bin/$package_name /usr/local/bin/$package_name
        fi
    done
fi

echo "Run 'eval \$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)' to enable in your shell"