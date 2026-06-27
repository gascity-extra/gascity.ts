#!/usr/bin/env bash
# Wrapper that starts the in-process mock GC supervisor, waits for it
# to come up, then execs Vite in the foreground. The mock is the parent
# of Vite via the trap, so when Playwright SIGTERMs the wrapper, the
# mock gets reaped too.
#
# The mock gates itself on ALLOW_GC_MOCK=1 to make it impossible to
# shadow a real `gc` daemon by accident. Setting it here is the
# single canonical way to opt into mock mode for e2e.
#
# Env (with defaults):
#   MOCK_GC_PORT       - port the mock listens on (default 8780; NOT
#                        8372 so it can never silently shadow a real
#                        gc daemon on the operator's machine)
#   GC_API_BASE_URL    - Vite's proxy target for /gc/* (default
#                        http://127.0.0.1:${MOCK_GC_PORT})
#   E2E_PORT           - port Vite listens on (default 3100)
#
# On failure to bring up the mock, dump its log to stderr and exit 1.
set -euo pipefail

MOCK_GC_PORT="${MOCK_GC_PORT:-8780}"
GC_API_BASE_URL="${GC_API_BASE_URL:-http://127.0.0.1:${MOCK_GC_PORT}}"
E2E_PORT="${E2E_PORT:-3100}"

LOG="${TMPDIR:-/tmp}/mock-gc-supervisor.log"
echo "[with-mock-gc] starting mock-gc on :${MOCK_GC_PORT} (log=${LOG})" >&2

ALLOW_GC_MOCK=1 MOCK_GC_PORT="${MOCK_GC_PORT}" bun e2e/mock-gc-supervisor.ts >"${LOG}" 2>&1 &
MOCK_PID=$!
trap "kill ${MOCK_PID} 2>/dev/null || true" EXIT

# Probe /health so Vite doesn't start until the backend is ready.
ready=0
for _ in $(seq 1 50); do
  if curl -fsS "http://127.0.0.1:${MOCK_GC_PORT}/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.1
done

if [ "${ready}" -ne 1 ]; then
  echo "[with-mock-gc] mock-gc failed to come up. log follows:" >&2
  cat "${LOG}" >&2 || true
  exit 1
fi

echo "[with-mock-gc] mock-gc ready; starting vite on :${E2E_PORT} pointed at ${GC_API_BASE_URL}" >&2

# Export so Vite's dev process picks them up.
export GC_API_BASE_URL
exec bun x vite --port "${E2E_PORT}" --strictPort
