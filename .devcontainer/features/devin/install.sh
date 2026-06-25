#!/bin/bash
set -e

# Devin CLI Installation Script (non-interactive)

VERSION=${VERSION:-"latest"}
INSTALL_METHOD=${INSTALLMETHOD:-"script"}

echo "Installing Devin CLI (method: ${INSTALL_METHOD}, version: ${VERSION})..."

# Install curl if not available
if ! command -v curl &> /dev/null; then
    apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
fi

# Ensure devin --version failures (warnings, missing creds, etc.) never abort
# the feature build. We only care that the binary is installed and executable.
DEVIN_BIN="$HOME/.local/bin/devin"

run_upstream_script() {
    local script_path="$1"

    # The official installer ends with `... setup`, which invokes the
    # interactive `devin setup` wizard. In a non-interactive container build
    # there is no controlling TTY, so the wizard either hangs or aborts under
    # `set -e` and breaks the entire Codespace/devcontainer build. Strip the
    # final `setup` invocation line before executing.
    #
    # The line we want to remove is the last executable statement of the
    # installer: `"$VERSION_DIR/bin/$COMPILED_BIN_NAME" setup`. We delete any
    # trailing line that invokes `$COMPILED_BIN_NAME setup` (or `devin setup`).
    local patched_script
    patched_script="$(mktemp "${TMPDIR:-/tmp}/devin-install.XXXXXX.sh")"
    sed -E '/\$COMPILED_BIN_NAME"[[:space:]]+setup/d; /(^|[^A-Za-z_])devin[[:space:]]+setup([[:space:]]|$)/d' \
        "$script_path" > "$patched_script"
    chmod +x "$patched_script"

    # Guard: if our sed didn't actually strip a setup invocation, refuse to
    # run the script rather than risk the interactive wizard hanging the
    # container build. The two patterns above match both variable-form and
    # literal-form invocations; if the upstream script changes shape we fail
    # loudly here instead of silently deadlocking the build.
    if grep -Eq '(^|[^A-Za-z_])(devin|\$COMPILED_BIN_NAME)[[:space:]]+setup' "$patched_script"; then
        echo "Error: failed to strip interactive 'devin setup' from upstream installer" >&2
        echo "Upstream script may have changed; please update run_upstream_script()." >&2
        rm -f "$patched_script"
        return 1
    fi

    bash "$patched_script"
    local rc=$?
    rm -f "$patched_script"
    return $rc
}

# Extract a string field for $TARGET from the manifest JSON. Prefers jq when
# available (robust against pretty-printing / whitespace); falls back to a
# grep/sed scan for minimal base images that don't ship jq.
manifest_field() {
    local manifest="$1" target="$2" field="$3"
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "$manifest" | jq -r --arg t "$target" --arg f "$field" \
            '.[$t][$f] // empty'
    else
        printf '%s' "$manifest" \
            | grep -o "\"$target\"[[:space:]]*:[[:space:]]*{[^}]*}" \
            | grep -o "\"$field\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
            | sed "s/.*\"\\([^\"]*\\)\"$/\\1/"
    fi
}

case "$INSTALL_METHOD" in
    script)
        # Download the official installer, strip the interactive setup wizard,
        # and run the patched version. This keeps us in sync with upstream
        # release artifacts while still being safe for non-interactive builds.
        INSTALLER="$(mktemp "${TMPDIR:-/tmp}/devin-cli-install.XXXXXX.sh")"
        curl -fsSL https://cli.devin.ai/install.sh -o "$INSTALLER"
        run_upstream_script "$INSTALLER"
        rm -f "$INSTALLER"
        ;;

    binary)
        # Direct-binary install path: download the platform tarball straight
        # from the manifest and place it in $HOME/.local/bin. Skips the
        # upstream installer entirely (and therefore the interactive setup
        # wizard). Honors $VERSION when set to a concrete release tag
        # (e.g. "2026.8.18"); falls back to "current" otherwise.
        if [ "$VERSION" = "latest" ] || [ -z "$VERSION" ]; then
            VERSION_PATH="current"
        else
            VERSION_PATH="$VERSION"
        fi

        MANIFEST_URL="https://static.devin.ai/cli/${VERSION_PATH}/manifest.json"
        MANIFEST="$(curl -fsSL "$MANIFEST_URL")"

        TARGET_RAW=$(uname -m)
        case "$TARGET_RAW" in
            x86_64)  TARGET="x86_64-unknown-linux" ;;
            aarch64) TARGET="aarch64-unknown-linux" ;;
            *)
                echo "Unsupported architecture: $TARGET_RAW" >&2
                exit 1
                ;;
        esac

        BUNDLE_URL=$(manifest_field "$MANIFEST" "$TARGET" "url")
        if [ -z "$BUNDLE_URL" ]; then
            echo "Error: no bundle URL in manifest for $TARGET" >&2
            exit 1
        fi

        EXPECTED_SHA=$(manifest_field "$MANIFEST" "$TARGET" "sha256")

        TMP_TARBALL="$(mktemp "${TMPDIR:-/tmp}/devin.XXXXXX.tar.gz")"
        TMP_EXTRACT="$(mktemp -d "${TMPDIR:-/tmp}/devin-extract.XXXXXX")"

        curl -fSL "$BUNDLE_URL" -o "$TMP_TARBALL"

        if [ -n "$EXPECTED_SHA" ]; then
            ACTUAL_SHA=$(sha256sum "$TMP_TARBALL" | cut -d' ' -f1)
            if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
                echo "Error: checksum mismatch for Devin CLI tarball" >&2
                echo "Expected: $EXPECTED_SHA" >&2
                echo "Got:      $ACTUAL_SHA" >&2
                rm -rf "$TMP_TARBALL" "$TMP_EXTRACT"
                exit 1
            fi
        fi

        mkdir -p "$HOME/.local/bin"
        tar xzf "$TMP_TARBALL" -C "$TMP_EXTRACT"
        # Tarball layout: devin/bin/devin (and friends). Find the actual binary.
        if [ -x "$TMP_EXTRACT/devin/bin/devin" ]; then
            cp "$TMP_EXTRACT/devin/bin/devin" "$DEVIN_BIN"
        elif [ -x "$TMP_EXTRACT/bin/devin" ]; then
            cp "$TMP_EXTRACT/bin/devin" "$DEVIN_BIN"
        else
            BIN_PATH=$(find "$TMP_EXTRACT" -type f -name devin -executable | head -n1)
            if [ -z "$BIN_PATH" ]; then
                echo "Error: could not locate devin binary in extracted tarball" >&2
                rm -rf "$TMP_TARBALL" "$TMP_EXTRACT"
                exit 1
            fi
            cp "$BIN_PATH" "$DEVIN_BIN"
        fi
        chmod +x "$DEVIN_BIN"

        rm -rf "$TMP_TARBALL" "$TMP_EXTRACT"
        ;;

    *)
        echo "Error: unknown INSTALLMETHOD '${INSTALL_METHOD}' (expected 'script' or 'binary')" >&2
        exit 1
        ;;
esac

# Copy devin to /usr/local/bin for global access. The script install path
# already creates a symlink at $DEVIN_BIN; the binary path writes the file
# directly. Either way, we want a copy on /usr/local/bin so the CLI is
# available system-wide in the container.
if [ ! -e "$DEVIN_BIN" ]; then
    echo "Devin CLI installation failed: binary not found at $DEVIN_BIN" >&2
    exit 1
fi

cp "$DEVIN_BIN" /usr/local/bin/devin
chmod +x /usr/local/bin/devin
echo "Devin CLI copied to /usr/local/bin/devin"

# Smoke test. `devin --version` may emit warnings (missing creds, etc.) but
# must not fail the feature build. `devin setup` is intentionally not run here
# because it is an interactive wizard that blocks non-interactive builds.
set +e
if command -v devin >/dev/null 2>&1; then
    OUT=$(devin --version 2>&1)
    RC=$?
    if [ $RC -eq 0 ]; then
        echo "Devin CLI version: ${OUT}"
    else
        echo "Devin CLI: version check skipped (exit ${RC})"
    fi
else
    echo "Devin CLI: binary not on PATH; skipping version check"
fi
set -e

echo "Devin CLI installed successfully!"