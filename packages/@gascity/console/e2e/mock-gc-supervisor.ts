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
            path: '/tmp/gc-mock/default', // NOSONAR: safe for mock e2e test server
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

    const handler = getRouteHandler(route)
    if (handler) {
        return handler(req, res, url)
    }

    return json(res, 404, { detail: `mock-gc: ${route} not implemented` })
})

function getRouteHandler(route: string): ((req: IncomingMessage, res: ServerResponse, url: URL) => Promise<void>) | null {
    if (route === 'POST /__reset') return handleReset
    if (route === 'GET /health') return handleHealth
    if (route === 'GET /v0/cities') return handleGetCities
    if (route === 'POST /v0/supervisor/start') return handleSupervisorStart
    if (route === 'POST /v0/supervisor/stop') return handleSupervisorStop
    if (route === 'POST /v0/supervisor/restart') return handleSupervisorRestart
    if (route === 'POST /v0/city') return handlePostCity
    if (route === 'GET /v0/events') return handleGetEvents

    const UNREGISTER_RE = /^POST \/v0\/city\/([^/]+)\/unregister$/
    const unregisterMatch = UNREGISTER_RE.exec(route)
    if (unregisterMatch) {
        return (req, res, url) => handleUnregisterCity(req, res, unregisterMatch[1])
    }

    const STATUS_RE = /^GET \/v0\/city\/([^/]+)\/status$/
    const statusMatch = STATUS_RE.exec(route)
    if (statusMatch) {
        return (req, res, url) => handleGetCityStatus(req, res, url, statusMatch[1])
    }

    const HEALTH_RE = /^GET \/v0\/city\/([^/]+)\/health$/
    const healthMatch = HEALTH_RE.exec(route)
    if (healthMatch) {
        return (req, res, url) => handleGetCityHealth(req, res)
    }

    const SESSIONS_RE = /^GET \/v0\/city\/([^/]+)\/sessions$/
    const sessionsMatch = SESSIONS_RE.exec(route)
    if (sessionsMatch) {
        return (req, res, url) => handleGetCitySessionsList(req, res, sessionsMatch[1])
    }

    return null
}

async function handleReset(req: IncomingMessage, res: ServerResponse): Promise<void> {
    state = freshState()
    return json(res, 200, { ok: true })
}

async function handleHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

async function handleGetCities(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

async function handleSupervisorStart(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (state.supervisorUp) {
        return json(res, 200, { detail: 'already running' })
    }
    state.supervisorUp = true
    resetCityState()
    recordEvent('supervisor.started', { version: SUPERVISOR_VERSION })
    return json(res, 200, { status: 'ok' })
}

async function handleSupervisorStop(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!state.supervisorUp) {
        return json(res, 200, { detail: 'already stopped' })
    }
    state.supervisorUp = false
    state.city.phase = 'stopped'
    resetCityState()
    recordEvent('supervisor.stopped', {})
    return json(res, 200, { status: 'ok' })
}

async function handleSupervisorRestart(req: IncomingMessage, res: ServerResponse): Promise<void> {
    state.supervisorUp = false
    state.city.phase = 'stopped'
    resetCityState()
    recordEvent('supervisor.stopped', {})
    setTimeout(() => {
        state.supervisorUp = true
        recordEvent('supervisor.started', { version: SUPERVISOR_VERSION })
    }, 50)
    return json(res, 200, { status: 'ok' })
}

function resetCityState(): void {
    state.city.phase = 'stopped'
    state.city.agents = { total: 0, running: 0, idle: 0, suspended: 0, error: 0 }
    state.city.sessions = { total: 0, running: 0, idle: 0 }
    state.city.mail = { total: 0, unread: 0 }
    state.city.work = { open: 0, closed: 0 }
}

async function handlePostCity(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

async function handleUnregisterCity(req: IncomingMessage, res: ServerResponse, name: string): Promise<void> {
    if (!req.headers['x-gc-request']) {
        return json(res, 403, { detail: 'X-GC-Request header required' })
    }
    if (!state.supervisorUp) {
        return json(res, 503, { detail: 'mock-gc supervisor is down' })
    }
    if (name !== state.city.name) {
        return json(res, 404, { detail: `city "${name}" not registered` })
    }
    if (state.city.phase === 'stopped') {
        return json(res, 409, { detail: `city "${name}" not running` })
    }
    state.city.phase = 'stopped'
    state.city.stoppedAt = new Date().toISOString()
    resetCityState()
    return asyncAccepted(req, res, 'city.unregister', { city: name })
}

async function handleGetCityStatus(req: IncomingMessage, res: ServerResponse, url: URL, name: string): Promise<void> {
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
        ...(lite ? {} : { beads_version: '0.9.1-mock', dolt_version: '1.30.0-mock' }),
    })
}

async function handleGetCityHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!state.supervisorUp) {
        return json(res, 503, { detail: 'mock-gc supervisor is down' })
    }
    return json(res, 200, {
        status: 'ok',
        agent_count: state.city.agents.total,
        agents: state.city.agents,
    })
}

async function handleGetEvents(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!state.supervisorUp) {
        return json(res, 503, { detail: 'mock-gc supervisor is down' })
    }
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
    const limit = Number(url.searchParams.get('limit') ?? '100')
    const tail = state.events.slice(-limit)
    return json(res, 200, { events: tail })
}

async function handleGetCitySessionsList(req: IncomingMessage, res: ServerResponse, name: string): Promise<void> {
    if (!state.supervisorUp) {
        return json(res, 503, { detail: 'mock-gc supervisor is down' })
    }
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

/**
 * Write a small `gc` shim to a temp dir. The shim maps CLI subcommands
 * to the supervisor endpoints above so the console's `gcSupervisorStart`
 * server function (which spawns `gc start` etc.) has a real binary to
 * talk to during e2e tests. The wrapper script sets `GC_BIN` to this
 * path; in production `GC_BIN` defaults to a real `gc` on PATH.
 */
async function writeGcShim(): Promise<string> {
    const { writeFileSync, mkdirSync, chmodSync } = await import('node:fs')
    const { join } = await import('node:path')
    // Mirror the bash convention `${TMPDIR:-/tmp}` exactly: an empty
    // TMPDIR string is treated the same as an unset TMPDIR and
    // resolves to `/tmp`. Using `??` would treat `''` as a real path
    // prefix, producing `/mock-gc-bin` instead of `/tmp/mock-gc-bin`
    // and silently desyncing from the wrapper script's path lookup.
    // Use a fixed path under /tmp for this mock e2e test server
    // This is safe because it's a mock server running in a controlled test environment
    const dir = join('/tmp', 'mock-gc-bin')
    // Ensure directory is safely writable - use 0o700 for user-only access
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
      *)        echo "mock-gc: unknown subcommand supervisor $2" >&2; exit 2 ;;
    esac
    ;;
  status)        curl -fsS "http://127.0.0.1:\${PORT}/health" || echo "down"; exit 0 ;;
  version)       echo "${SUPERVISOR_VERSION}" ;;
  *)             echo "mock-gc: unknown subcommand $1" >&2; exit 2 ;;
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
