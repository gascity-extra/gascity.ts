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
    running: boolean
    city: CityState
    events: EventRecord[]
    nextEventId: number
}

function freshState(): State {
    const now = new Date().toISOString()
    return {
        running: true, // supervisor itself is "running" the moment the mock starts
        city: {
            name: 'default',
            phase: 'stopped', // but no city yet
            path: '/tmp/gc-mock/default',
            agents: { total: 0, running: 0, idle: 0, suspended: 0, error: 0 },
            sessions: { total: 0, running: 0, idle: 0 },
            mail: { total: 0, unread: 0 },
            work: { open: 0, closed: 0 },
        },
        events: [
            {
                id: 1,
                type: 'supervisor.started',
                actor: 'mock-gc',
                created_at: now,
                payload: { version: SUPERVISOR_VERSION },
            },
        ],
        nextEventId: 2,
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
    // Emit the corresponding request.result.* after a short delay so
    // the console's `awaitRequestResult` poller observes it.
    setTimeout(() => {
        recordEvent(`request.result.${requestType}`, { request_id: requestId, ...payload })
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
        return json(res, 200, {
            status: 'ok',
            build_id: `mock-${SUPERVISOR_VERSION}`,
            cities_running: state.city.phase === 'running' ? 1 : 0,
            cities_total: 1,
        })
    }
    if (route === 'GET /v0/cities') {
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
    if (route === 'POST /v0/city') {
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
        return asyncAccepted(req, res, 'city.unregister', { city: name })
    }
    const statusMatch = route.match(/^GET \/v0\/city\/([^/]+)\/status$/)
    if (statusMatch) {
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
        return json(res, 200, {
            status: 'ok',
            agent_count: state.city.agents.total,
            agents: state.city.agents,
        })
    }
    if (route === 'GET /v0/events') {
        // Cheap history tail. `since` is a Go duration like "1h" – we ignore it
        // and just return the last `limit` events (default 100).
        const limit = Number(url.searchParams.get('limit') ?? '100')
        const tail = state.events.slice(-limit)
        return json(res, 200, { events: tail })
    }

    // Fall-through: everything else is unimplemented (e.g. agent / session
    // / sling / mail endpoints the test doesn't drive). Return 404 rather
    // than crashing the mock — the console's per-handler try/catch degrades.
    json(res, 404, { detail: `mock-gc: ${route} not implemented` })
})

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[mock-gc] listening on http://127.0.0.1:${PORT} (version=${SUPERVISOR_VERSION})`)
})

// Graceful shutdown so `bun run` doesn't leave zombies.
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
        server.close(() => process.exit(0))
    })
}
