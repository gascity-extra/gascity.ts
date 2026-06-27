#!/usr/bin/env bun
/**
 * Mock GC supervisor server for e2e tests.
 *
 * Speaks just enough of the GC OpenAPI surface to drive the console
 * supervisor panel (start / stop / restart / status / logs / health).
 * Not a complete implementation — anything we don't need for the panel
 * returns 404. Designed to run as a background process for mock-e2e
 * and to be replaceable by the real `gc` daemon for real-e2e.
 *
 * Usage:
 *   bun run e2e/mock-gc-supervisor.ts           # listens on $MOCK_GC_PORT or 8372
 *   MOCK_GC_PORT=9001 bun run ...               # custom port
 *   bun run e2e/mock-gc-supervisor.ts --reset   # POST /__reset clears state
 *
 * State model: a single mutable city `default`. start/stop transitions
 * the city between `stopped` and `running`. Each successful transition
 * appends a `request.result.*` event so the supervisor popover's polling
 * loop in `gcCityStart`/`gcCityStop` receives the completion event.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.MOCK_GC_PORT ?? 8372)
const SUPERVISOR_VERSION = '1.4.2-mock'

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
    res.end(JSON.stringify({ event_cursor: String(state.nextEventId), request_id: requestId }))
}

function json(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
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
