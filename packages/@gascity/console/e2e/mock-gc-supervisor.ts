#!/usr/bin/env bun
/**
 * Mock GC supervisor server for e2e tests.
 *
 * Speaks just enough of the GC OpenAPI surface to drive the console
 * supervisor panel (start / stop / restart / status / logs / health).
 * Not a complete implementation — anything we don't need for the panel
 * returns 404.
 *
 * ## Safety: this is a test fixture, not a development backend
 *
 * The mock defaults to a **non-standard port** (8780, not 8372) so it
 * can never silently shadow a real `gc` daemon on the operator's
 * machine. To make this explicit, the startup banner shouts `MOCK`
 * in red, and every response carries an `X-Gc-Mock: 1` header so a
 * developer who accidentally pointed their browser DevTools at it
 * can tell at a glance.
 *
 * The mock also refuses to run unless either:
 *   - `ALLOW_GC_MOCK=1` is set in the environment (only set by the
 *     e2e wrapper scripts `e2e/with-mock-gc.sh` and the mock Playwright
 *     config), OR
 *   - The process is running under `bun test` (Playwright test mode).
 *
 * If neither condition holds, the process prints a loud refusal and
 * exits with code 2. This makes "I forgot the env var" loud instead
 * of silently booting a fake backend.
 *
 * Usage:
 *   ALLOW_GC_MOCK=1 bun run e2e/mock-gc-supervisor.ts
 *   # or via the wrapper:
 *   ./e2e/with-mock-gc.sh
 *
 * State model: a single mutable city `default`. start/stop transitions
 * the city between `stopped` and `running`. Each successful transition
 * appends a `request.result.*` event so the supervisor popover's polling
 * loop in `gcCityStart`/`gcCityStop` receives the completion event.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

// Default port is intentionally NOT 8372 (the real `gc` default). The
// e2e wrapper / Playwright config set MOCK_GC_PORT explicitly when they
// want a specific port; if you run this script directly, 8780 is what
// you get — a port the real `gc` would never use.
const DEFAULT_PORT = 8780
const PORT = Number(process.env.MOCK_GC_PORT ?? DEFAULT_PORT)
const SUPERVISOR_VERSION = '1.4.2-mock'

const ALLOW_FLAG = process.env.ALLOW_GC_MOCK === '1'
const UNDER_TEST =
    // Playwright sets NODE_ENV / npm_lifecycle_event when running tests.
    process.env.NODE_ENV === 'test' ||
    !!process.env.PLAYWRIGHT_TEST_BASE_URL ||
    (process.env.npm_lifecycle_event ?? '').startsWith('test')

if (!ALLOW_FLAG && !UNDER_TEST) {
    console.error(
        [
            '',
            '\x1b[31m============================================================\x1b[0m',
            '\x1b[31m  REFUSED: this is a TEST-ONLY mock, not a dev backend.\x1b[0m',
            '\x1b[31m============================================================\x1b[0m',
            '',
            '  To run the mock:',
            '    ALLOW_GC_MOCK=1 bun run e2e/mock-gc-supervisor.ts',
            '',
            '  Or use the wrapper that brings up mock + vite together:',
            '    ./e2e/with-mock-gc.sh',
            '',
            '  To run real e2e against a real gc, set GC_API_BASE_URL to a',
            '  running supervisor and start vite normally.',
            '',
            '  See e2e/with-mock-gc.sh and playwright.mock.config.ts for',
            '  the wiring details.',
            '',
        ].join('\n'),
    )
    process.exit(2)
}

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

process.stdout.write(
    [
        '',
        `${RED}============================================================${RESET}`,
        `${RED}  MOCK GC SUPERVISOR (test fixture — NOT a real backend)${RESET}`,
        `${RED}============================================================${RESET}`,
        '',
        `  Port: ${YELLOW}${PORT}${RESET}`,
        `  Version: ${YELLOW}${SUPERVISOR_VERSION}${RESET}`,
        '',
        `  Every response is tagged with ${YELLOW}X-Gc-Mock: 1${RESET} so you`,
        '  can spot this in DevTools. To use a real backend, set',
        '  GC_API_BASE_URL to a running `gc` supervisor and restart vite.',
        '',
    ].join('\n'),
)

type CityPhase = 'running' | 'stopped'
interface CityState {
    name: string
    phase: CityPhase
    path: string
    startedAt?: string
    stoppedAt?: string
    agents: { total: number; running: number; idle: number; suspended: number; error: number }
    sessions: { total: number; running: number; idle: number }
    mail: { total: number; unread: number }
    work: { open: number; closed: number }
}

interface EventRecord {
    id: number
    type: string
    actor?: string
    created_at: string
    payload: Record<string, unknown>
}

interface State {
    supervisorUp: boolean
    city: CityState
    events: EventRecord[]
    nextEventId: number
}

function freshState(): State {
    // Start in a "supervisor down, no city" state so e2e specs can
    // exercise the bootstrap path (start supervisor → start city) from
    // the very first interaction.
    return {
        supervisorUp: false,
        city: {
            name: 'default',
            phase: 'stopped',
            path: '/tmp/gc-mock/default',
            agents: { total: 0, running: 0, idle: 0, suspended: 0, error: 0 },
            sessions: { total: 0, running: 0, idle: 0 },
            mail: { total: 0, unread: 0 },
            work: { open: 0, closed: 0 },
        },
        events: [],
        nextEventId: 1,
    }
}

let state: State = freshState()

function recordEvent(type: string, payload: Record<string, unknown>, actor = 'mock-gc'): EventRecord {
    const e: EventRecord = {
        id: state.nextEventId++,
        type,
        actor,
        created_at: new Date().toISOString(),
        payload,
    }
    state.events.push(e)
    return e
}

function asyncAccepted(req: IncomingMessage, res: ServerResponse, requestType: string, payload: Record<string, unknown> = {}) {
    if (!req.headers['x-gc-request']) {
        res.statusCode = 403
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ detail: 'X-GC-Request header required' }))
        return
    }
    const requestId = randomUUID()
    // Capture the state reference at request time so the deferred
    // completion event lands in the state the caller actually saw.
    // Without this, a `__reset` between request and setTimeout fire
    // would cause the event to land in the NEW state, "promoting"
    // the next test's mock to look like a previous test's request
    // succeeded.
    const capturedState = state
    setTimeout(() => {
        capturedState.events.push({
            id: capturedState.nextEventId++,
            type: `request.result.${requestType}`,
            actor: 'mock-gc',
            created_at: new Date().toISOString(),
            payload: { request_id: requestId, ...payload },
        })
    }, 150)
    res.statusCode = 202
    res.setHeader('content-type', 'application/json')
    res.setHeader('x-gc-mock', '1')
    res.end(JSON.stringify({ event_cursor: String(state.nextEventId), request_id: requestId }))
}

function json(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.setHeader('x-gc-mock', '1')
    res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let buf = ''
        req.on('data', (c) => (buf += c))
        req.on('end', () => resolve(buf))
        req.on('error', reject)
    })
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
    const method = req.method ?? 'GET'
    const route = `${method} ${url.pathname}`

    // Test-only: reset to a clean state between specs.
    if (route === 'POST /__reset') {
        state = freshState()
        return json(res, 200, { ok: true })
    }

    // --- supervisor surface ---
    if (route === 'GET /health') {
        // When the supervisor is down, /health returns 503 so the
        // console's `gcHealth` server function reports `reachable:false`
        // and the panel correctly disables every action button.
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        return json(res, 200, {
            status: 'ok',
            build_id: `mock-${SUPERVISOR_VERSION}`,
            cities_running: state.city.phase === 'running' ? 1 : 0,
            cities_total: 1,
        })
    }
    if (route === 'GET /v0/cities') {
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        return json(res, 200, {
            items: [
                {
                    name: state.city.name,
                    dir: state.city.path,
                    status: state.city.phase,
                    active: state.city.phase === 'running',
                },
            ],
        })
    }
    // Supervisor daemon lifecycle. In production these endpoints don't
    // exist — the daemon is a separate OS process and the console drives
    // it via the `gc` CLI (see `gcSupervisorStart` in gc.functions.ts).
    // The mock exposes them so e2e tests can exercise the bootstrap
    // path end-to-end.
    if (route === 'POST /v0/supervisor/start') {
        if (state.supervisorUp) {
            return json(res, 200, { detail: 'already running' })
        }
        state.supervisorUp = true
        // Drop any leftover city — when the daemon restarts after being
        // fully down, cities re-register on their own. Keeping stale
        // city state here would be misleading.
        state.city.phase = 'stopped'
        state.city.agents = { total: 0, running: 0, idle: 0, suspended: 0, error: 0 }
        state.city.sessions = { total: 0, running: 0, idle: 0 }
        state.city.mail = { total: 0, unread: 0 }
        state.city.work = { open: 0, closed: 0 }
        recordEvent('supervisor.started', { version: SUPERVISOR_VERSION })
        return json(res, 200, { status: 'ok' })
    }
    if (route === 'POST /v0/supervisor/stop') {
        if (!state.supervisorUp) {
            return json(res, 200, { detail: 'already stopped' })
        }
        state.supervisorUp = false
        state.city.phase = 'stopped'
        state.city.agents = { total: 0, running: 0, idle: 0, suspended: 0, error: 0 }
        state.city.sessions = { total: 0, running: 0, idle: 0 }
        recordEvent('supervisor.stopped', {})
        return json(res, 200, { status: 'ok' })
    }
    if (route === 'POST /v0/supervisor/restart') {
        state.supervisorUp = false
        state.city.phase = 'stopped'
        state.city.agents = { total: 0, running: 0, idle: 0, suspended: 0, error: 0 }
        state.city.sessions = { total: 0, running: 0, idle: 0 }
        recordEvent('supervisor.stopped', {})
        // Tiny gap so consumers see the "down" frame between stop and
        // start; mirrors the gap in the real `gc restart` lifecycle.
        setTimeout(() => {
            state.supervisorUp = true
            recordEvent('supervisor.started', { version: SUPERVISOR_VERSION })
        }, 50)
        return json(res, 200, { status: 'ok' })
    }
    if (route === 'POST /v0/city') {
        // Check the anti-CSRF header BEFORE checking supervisor
        // reachability so a missing header returns 403 (the wire-level
        // invariant the console relies on) rather than 503.
        if (!req.headers['x-gc-request']) {
            return json(res, 403, { detail: 'X-GC-Request header required' })
        }
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        if (state.city.phase === 'running') {
            return json(res, 409, { detail: `city "${state.city.name}" already running` })
        }
        state.city.phase = 'running'
        state.city.startedAt = new Date().toISOString()
        state.city.agents = { total: 3, running: 2, idle: 1, suspended: 0, error: 0 }
        state.city.sessions = { total: 3, running: 2, idle: 1 }
        state.city.mail = { total: 5, unread: 2 }
        state.city.work = { open: 4, closed: 12 }
        return asyncAccepted(req, res, 'city.create', { city: state.city.name })
    }
    const unregisterMatch = route.match(/^POST \/v0\/city\/([^/]+)\/unregister$/)
    if (unregisterMatch) {
        // Anti-CSRF header checked first so missing header → 403 (the
        // contract the console relies on), not 503 (which signals
        // "supervisor down").
        if (!req.headers['x-gc-request']) {
            return json(res, 403, { detail: 'X-GC-Request header required' })
        }
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        const name = decodeURIComponent(unregisterMatch[1])
        if (name !== state.city.name) {
            return json(res, 404, { detail: `city "${name}" not registered` })
        }
        if (state.city.phase === 'stopped') {
            return json(res, 409, { detail: `city "${name}" not running` })
        }
        state.city.phase = 'stopped'
        state.city.stoppedAt = new Date().toISOString()
        state.city.agents = { total: 0, running: 0, idle: 0, suspended: 0, error: 0 }
        state.city.sessions = { total: 0, running: 0, idle: 0 }
        state.city.mail = { total: 0, unread: 0 }
        state.city.work = { open: 0, closed: 0 }
        return asyncAccepted(req, res, 'city.unregister', { city: name })
    }
    const statusMatch = route.match(/^GET \/v0\/city\/([^/]+)\/status$/)
    if (statusMatch) {
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        const lite = url.searchParams.get('lite') === 'true'
        return json(res, 200, {
            name: state.city.name,
            path: state.city.path,
            agent_count: state.city.agents.total,
            agents: state.city.agents,
            sessions: state.city.sessions,
            mail: state.city.mail,
            work: state.city.work,
            partial: false,
            ...(lite
                ? {}
                : { beads_version: '0.9.1-mock', dolt_version: '1.30.0-mock' }),
        })
    }
    const healthMatch = route.match(/^GET \/v0\/city\/([^/]+)\/health$/)
    if (healthMatch) {
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        return json(res, 200, {
            status: 'ok',
            agent_count: state.city.agents.total,
            agents: state.city.agents,
        })
    }
    if (route === 'GET /v0/events') {
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        // Cheap history tail. `since` is a Go duration like "1h" – we ignore it
        // and just return the last `limit` events (default 100).
        const limit = Number(url.searchParams.get('limit') ?? '100')
        const tail = state.events.slice(-limit)
        return json(res, 200, { events: tail })
    }
    // City sessions list — drives the sessions table on the home page.
    // Mock returns an empty list unless the city is running, mirroring
    // the real `gc` behaviour where sessions only exist for an active
    // city. Tests that need non-empty data override the city state via
    // `POST /v0/city` (which sets a deterministic session count).
    const sessionsMatch = route.match(/^GET \/v0\/city\/([^/]+)\/sessions$/)
    if (sessionsMatch) {
        if (!state.supervisorUp) {
            return json(res, 503, { detail: 'mock-gc supervisor is down' })
        }
        const name = decodeURIComponent(sessionsMatch[1])
        if (name !== state.city.name) {
            return json(res, 404, { detail: `city "${name}" not registered` })
        }
        if (state.city.phase !== 'running') {
            return json(res, 200, { items: [] })
        }
        const items = Array.from({ length: state.city.sessions.total }).map(
            (_, i) => ({
                name: `mock-session-${i + 1}`,
                agent: 'mock-agent',
                provider: 'mock',
                status: i < state.city.sessions.running ? 'running' : 'idle',
                started_at: state.city.startedAt,
                last_activity_at: new Date().toISOString(),
            }),
        )
        return json(res, 200, { items })
    }

    // Fall-through: everything else is unimplemented (e.g. agent / session
    // / sling / mail endpoints the test doesn't drive). Return 404 rather
    // than crashing the mock — the console's per-handler try/catch degrades.
    json(res, 404, { detail: `mock-gc: ${route} not implemented` })
})

/**
 * Write a small `gc` shim to a temp dir. The shim maps CLI subcommands
 * to the supervisor endpoints above so the console's `gcSupervisorStart`
 * server function (which spawns `gc start` etc.) has a real binary to
 * talk to during e2e tests. The wrapper script sets `GC_BIN` to this
 * path; in production `GC_BIN` defaults to a real `gc` on PATH.
 */
async function writeGcShim(): Promise<string> {
    const { writeFileSync, mkdirSync, chmodSync, mkdtempSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')
    // Mirror the bash convention `${TMPDIR:-/tmp}` exactly: an empty
    // TMPDIR string is treated the same as an unset TMPDIR and
    // resolves to `/tmp`. Using `??` would treat `''` as a real path
    // prefix, producing `/mock-gc-bin` instead of `/tmp/mock-gc-bin`
    // and silently desyncing from the wrapper script's path lookup.
    // Use mkdtemp with os.tmpdir() for secure temporary directory creation
    const tmpDir = mkdtempSync(join(tmpdir(), 'mock-gc-'))
    const dir = join(tmpDir, 'mock-gc-bin')
    mkdirSync(dir, { recursive: true, mode: 0o700 })
    const binPath = `${dir}/gc`
    const script = `#!/usr/bin/env bash
set -euo pipefail
PORT="\${MOCK_GC_PORT:-${PORT}}"
# Map CLI subcommands to the supervisor endpoints above. The
# console's server functions spawn either the bare form
# (\`gc start\`) for legacy operator convenience or the explicit
# \`gc supervisor start\` form (the upstream-canonical shape we use
# now). Handle both.
case "\${1:-}" in
  start)         curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/start"     >/dev/null; echo "gc supervisor started"; exit 0 ;;
  stop)          curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/stop"      >/dev/null; echo "gc supervisor stopped"; exit 0 ;;
  restart)       curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/restart"   >/dev/null; echo "gc supervisor restarted"; exit 0 ;;
  supervisor)
    case "\${2:-}" in
      start)    curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/start"     >/dev/null; echo "gc supervisor started"; exit 0 ;;
      stop)     curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/stop"      >/dev/null; echo "gc supervisor stopped"; exit 0 ;;
      restart)  curl -fsS -X POST "http://127.0.0.1:\${PORT}/v0/supervisor/restart"   >/dev/null; echo "gc supervisor restarted"; exit 0 ;;
      status)   curl -fsS "http://127.0.0.1:\${PORT}/health" || echo "down"; exit 0 ;;
      *)        echo "mock-gc: unknown subcommand supervisor \$2" >&2; exit 2 ;;
    esac
    ;;
  status)        curl -fsS "http://127.0.0.1:\${PORT}/health" || echo "down"; exit 0 ;;
  version)       echo "${SUPERVISOR_VERSION}" ;;
  *)             echo "mock-gc: unknown subcommand \$1" >&2; exit 2 ;;
esac
`
    writeFileSync(binPath, script, { mode: 0o755 })
    chmodSync(binPath, 0o755)
    return binPath
}

server.listen(PORT, '127.0.0.1', async () => {
    console.log(`[mock-gc] listening on http://127.0.0.1:${PORT} (version=${SUPERVISOR_VERSION})`)
    const shim = await writeGcShim()
    console.log(`[mock-gc] gc shim written to ${shim}`)
    console.log(`[mock-gc] set GC_BIN=${shim} to drive the daemon from the console`)
})

// Graceful shutdown so `bun run` doesn't leave zombies.
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
        server.close(() => process.exit(0))
    })
}
