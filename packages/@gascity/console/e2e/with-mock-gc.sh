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

# Defer installing the cleanup trap until *after* we also know Vite's
# PID, so a single trap reaps both children. Installing the trap
# before the exec()/launch of Vite would silently drop it across the
# exec boundary, which is why the script intentionally avoids `exec`
# here and keeps bash as the parent of both processes.
VITE_PID=""
cleanup() {
    local rc=$?
    if [ -n "${VITE_PID}" ]; then
        kill "${VITE_PID}" 2>/dev/null || true
    fi
    kill "${MOCK_PID}" 2>/dev/null || true
    # Best-effort: also reap any grandchildren (Vite spawns workers)
    # so they don't linger as zombies after the mock's port is freed.
    pkill -P "${MOCK_PID}" 2>/dev/null || true
    pkill -P "${VITE_PID}" 2>/dev/null || true
    exit "${rc}"
}
trap cleanup EXIT INT TERM

# Probe /health so Vite doesn't start until the backend is listening.
# The mock returns 503 when the supervisor is intentionally down, which
# `curl -fsS` treats as failure. Use `-o /dev/null -w '%{http_code}'` and
# accept any HTTP response (4xx/5xx included) as proof the server is up —
# the console's `gcHealth` server function handles the 503 → `reachable:
# false` mapping itself.
ready=0
for _ in $(seq 1 50); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${MOCK_GC_PORT}/health" 2>/dev/null || echo 000)
  if [ "${CODE}" != "000" ]; then
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

# Wait for the gc shim to be written by the mock (it announces the
# path on startup). We then point GC_BIN at it so the console's
# supervisor server functions (which spawn `gc start|stop|restart`)
# drive the mock via the shim instead of failing on ENOENT.
SHIM=""
for _ in $(seq 1 50); do
  SHIM_CAND="${TMPDIR:-/tmp}/mock-gc-bin/gc"
  if [ -x "${SHIM_CAND}" ]; then SHIM="${SHIM_CAND}"; break; fi
  sleep 0.1
done
if [ -z "${SHIM}" ]; then
  echo "[with-mock-gc] mock-gc gc shim never appeared" >&2
  exit 1
fi
echo "[with-mock-gc] using mock gc shim at ${SHIM}" >&2

# Export so Vite's dev process picks them up.
export GC_API_BASE_URL
export GC_BIN="${SHIM}"
export PATH="${TMPDIR:-/tmp}/mock-gc-bin:${PATH}"
# Run Vite in the foreground (no `exec`) so this shell stays alive as
# the parent of both processes — the cleanup trap above depends on it.
bun x vite --port "${E2E_PORT}" --strictPort &
VITE_PID=$!
# Forward Playwright's SIGTERM/SIGINT to Vite so it shuts down
# promptly when the wrapper is asked to stop, then wait for it so the
# EXIT trap fires only after Vite actually exits.
forward_signal() {
    if [ -n "${VITE_PID}" ]; then
        kill -TERM "${VITE_PID}" 2>/dev/null || true
    fi
}
trap 'forward_signal; cleanup' INT TERM
wait "${VITE_PID}"
