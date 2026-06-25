# Playwright DevContainer Feature

This feature installs system dependencies required for Playwright browser automation in devcontainer environments.

Compatible with Ubuntu 22.04, 24.04, and 26.04 (resolute). On 24.04+ many
libraries gained a `t64` SONAME suffix during the time_t transition; the
installer probes for the suffixed name first and falls back to the legacy
name, so the same feature works across the LTS spectrum without per-distro
overrides.

## Features

- Installs all required system libraries for browser automation
- Supports multiple browser engines (Chromium, Firefox, WebKit)
- Configures environment for headless browser operation
- Optional automatic browser binary installation via Playwright CLI

## Options

### `browsers` (default: "chromium")

Which browser engines to install system dependencies for:

- `chromium` - Install dependencies for Chromium only (default, recommended for most use cases)
- `firefox` - Install dependencies for Firefox
- `webkit` - Install dependencies for WebKit (Safari)
- `all` - Install dependencies for all browser engines

### `installMethod` (default: "auto")

How browser binaries should be managed:

- `auto` - Let Playwright manage browser binaries via `npx playwright install` (recommended)
- `system` - Install system dependencies only, manage browser binaries manually

## Usage

### Basic Usage

Add to your `devcontainer.json`:

```json
{
  "features": {
    "./features/playwright": {}
  }
}
```

### With Custom Options

```json
{
  "features": {
    "./features/playwright": {
      "browsers": "all",
      "installMethod": "auto"
    }
  }
}
```

### Complete Example

```json
{
  "name": "gascity.ts",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/node:2.1.0": {
      "version": "24"
    },
    "./features/playwright": {
      "browsers": "chromium",
      "installMethod": "auto"
    }
  },
  "postCreateCommand": "bun install && npx playwright install chromium"
}
```

## System Dependencies Installed

This feature installs the following system packages required by Playwright:

- **Core libraries**: libnss3, libnspr4, libatk1.0-0, libatk-bridge2.0-0, libcups2, libdrm2, libxkbcommon0
- **Graphics libraries**: libxcomposite1, libxdamage1, libxfixes3, libxrandr2, libgbm1, libasound2
- **Accessibility**: libatspi2.0-0
- **Rendering**: libpango-1.0-0, libcairo2, libgtk-3-0, libgdk-pixbuf2.0-0
- **X11 libraries**: libxshmfence1, libgl1, libglib2.0-0, libfontconfig1, libfreetype6, libx11-6, libxcb-*
- **Fonts**: fonts-liberation
- **Additional**: libu2f-udev, libvulkan1, xvfb

## Environment Variables

The feature sets the following environment variable:

- `DISPLAY=:99` - Configured for headless browser operation

## Manual Browser Installation

If you choose `installMethod: "system"` or need to install browsers manually:

```bash
# Install Chromium
npx playwright install chromium

# Install Firefox
npx playwright install firefox

# Install WebKit
npx playwright install webkit

# Install all browsers
npx playwright install
```

## Troubleshooting

### Browser binaries not found

If Playwright cannot find browser binaries after container creation:

```bash
# Reinstall browser binaries
npx playwright install --force
```

### Missing system dependencies

If you encounter errors related to missing libraries:

```bash
# Reinstall this feature or manually install dependencies
sudo apt-get update
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libatspi2.0-0 libpango-1.0-0 libcairo2 libgtk-3-0 libgdk-pixbuf2.0-0 libxshmfence1 libgl1 libglib2.0-0 libfontconfig1 libfreetype6 libx11-6 libx11-xcb1 libxcb1 libxcb-glx0 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxcb-shm0 libxcb-sync1 libxcb-xfixes0 libxcb-xinerama0 libxcb-xkb1 libxext6 libxrender1 fonts-liberation libu2f-udev libvulkan1 xvfb
```

### Display issues

If you encounter display-related errors:

```bash
# Ensure DISPLAY variable is set
export DISPLAY=:99

# Or use xvfb-run for virtual display
xvfb-run npx playwright test
```

## License

MIT

## Links

- [Playwright Documentation](https://playwright.dev)
- [DevContainer Features Specification](https://code.visualstudio.com/docs/devcontainers/containers-feature#_devcontainerjson-properties)
