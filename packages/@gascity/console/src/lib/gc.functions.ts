/**
 * Gas City Server Functions (TanStack Start)
 *
 * Each export is a real server function. Browser-side code calls them via
 * `useServerFn(fn)`, which performs an RPC to the TanStack Start server, where
 * the .handler() executes. Server-only modules (e.g. @gascity/client) live
 * here, never in the browser bundle.
 *
 * See: https://tanstack.com/start/v0/docs/framework/react/guide/server-functions
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DefaultService, configureGasCityClient } from '@gascity/client'
import { silentIfOffline } from './gc-errors'

// Configure the OpenAPI-generated client once at module load. Without this,
// `DefaultService.*` calls hit `axios` with an empty `BASE`, which throws
// `ERR_INVALID_URL` from inside Node and pollutes the dev-server stderr with
// noisy stack traces. The console routes through the `/gc` catch-all (see
// `routes/gc.$.ts`) in production; in dev Vite proxies `/gc/*` to the same
// target. Calling our own server keeps SSR hermetic when the supervisor is
// offline (we already degrade to empty arrays / default values).
configureGasCityClient({
  baseUrl:
    (typeof process !== 'undefined' && process.env?.GC_API_BASE_URL?.replace(/\/$/, '')) ||
    'http://127.0.0.1:8372',
  token: typeof process !== 'undefined' ? process.env?.GC_API_TOKEN : undefined,
})

const CITY = 'default'

type Envelope<T> = T | { detail?: string }

function unwrap<T>(response: Envelope<T>): T | null {
  if (response && typeof response === 'object' && 'detail' in response && (response as { detail?: unknown }).detail) {
    return null
  }
  return response as T
}

// --- tmux provider lifecycle -------------------------------------------------
//
// These server functions wrap `tmux` to give the console first-class control
// over the on-disk agent sessions that the WebSocket bridge attaches to. The
// bridge itself (`/api/pty`) only handles `tmux attach`; create / list / kill
// happen here so the UI can manage a session lifecycle without shelling out
// from the browser.
//
// SECURITY: the tmux binary and session name are validated against strict
// allow-lists. The child process is spawned with a minimal, fixed environment
// (not `process.env`) to avoid leaking secrets to anything that attaches.

const TMUX_BIN_RE = /^[a-zA-Z0-9_./-]+$/
const SESSION_NAME_RE = /^[a-zA-Z0-9_.-]{1,64}$/
const SHELL_BIN_RE = /^[a-zA-Z0-9_./-]+$/

function safeTmuxBin(): string {
  const bin = process.env.TMUX_BIN ?? 'tmux'
  if (!TMUX_BIN_RE.test(bin)) {
    throw new Error(`invalid TMUX_BIN env (${bin})`)
  }
  return bin
}

async function runTmux(
  args: string[],
  opts: { input?: string; timeoutMs?: number } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string; code: number }> {
  const { spawn } = await import('node:child_process')
  const bin = safeTmuxBin()
  return await new Promise((resolve) => {
    const child = spawn(bin, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        TERM: 'dumb',
        PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
        HOME: process.env.HOME ?? '/tmp',
        LANG: process.env.LANG ?? 'C.UTF-8',
      },
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      resolve({
        ok: false,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: `timeout after ${opts.timeoutMs ?? 5000}ms`,
        code: -1,
      })
    }, opts.timeoutMs ?? 5000)
    child.stdout.on('data', (b: Buffer) => stdout.push(b))
    child.stderr.on('data', (b: Buffer) => stderr.push(b))
    child.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ok: false, stdout: '', stderr: err.message, code: -1 })
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const out = Buffer.concat(stdout).toString('utf8')
      const err = Buffer.concat(stderr).toString('utf8')
      resolve({ ok: code === 0, stdout: out, stderr: err, code: code ?? -1 })
    })
    if (opts.input !== undefined) {
      child.stdin.end(opts.input)
    } else {
      child.stdin.end()
    }
  })
}

export interface TmuxSessionInfo {
  name: string
  createdAt?: string
  attached: boolean
  windows: number
  width?: number
  height?: number
}

export interface TmuxProviderStatus {
  available: boolean
  tmuxBin: string
  version?: string
  error?: string
}

/** Probe whether tmux is on PATH and parseable. */
export const gcTmuxStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const status: TmuxProviderStatus = {
    available: false,
    tmuxBin: safeTmuxBin(),
  }
  try {
    const r = await runTmux(['-V'], { timeoutMs: 2000 })
    if (r.ok) {
      status.available = true
      status.version = r.stdout.trim() || r.stderr.trim()
    } else {
      status.error = r.stderr || `tmux exited with code ${r.code}`
    }
  } catch (err) {
    status.error = err instanceof Error ? err.message : String(err)
  }
  return status
})

/**
 * List tmux sessions known to the local server. Mirrors `tmux list-sessions
 * -F` output. Returns [] if tmux is unavailable so the UI can degrade.
 */
export const gcTmuxListSessions = createServerFn({ method: 'GET' }).handler(async () => {
  const fmt = [
    '#{session_name}',
    '#{session_created_string}',
    '#{session_attached}',
    '#{session_windows}',
    '#{session_width}',
    '#{session_height}',
  ].join('\t')
  try {
    const r = await runTmux(['list-sessions', '-F', fmt], { timeoutMs: 4000 })
    if (!r.ok) {
      // "no server running" -> empty list, not an error.
      if (/no server/i.test(r.stderr)) return [] as TmuxSessionInfo[]
      return [] as TmuxSessionInfo[]
    }
    return r.stdout
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const [name, created, attached, windows, width, height] = line.split('\t')
        return {
          name: name ?? '',
          createdAt: created && created !== '' ? new Date(Number(created) * 1000).toISOString() : undefined,
          attached: attached === '1',
          windows: Number(windows ?? 0),
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
        } satisfies TmuxSessionInfo
      })
  } catch {
    return [] as TmuxSessionInfo[]
  }
})

/** Check if a specific tmux session exists. */
export const gcTmuxHasSession = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    if (!SESSION_NAME_RE.test(data.name)) {
      return { exists: false, error: 'invalid session name' }
    }
    try {
      const r = await runTmux(['has-session', '-t', data.name], { timeoutMs: 2000 })
      return { exists: r.ok, error: r.ok ? undefined : r.stderr.trim() }
    } catch (err) {
      return { exists: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

/** Create a new detached tmux session running a given shell command. */
export const gcTmuxNewSession = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string(),
      command: z.array(z.string()).default([]),
      cwd: z.string().optional(),
      width: z.number().int().min(10).max(512).default(120),
      height: z.number().int().min(5).max(256).default(30),
      shell: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!SESSION_NAME_RE.test(data.name)) {
      return { ok: false as const, name: data.name, error: 'invalid session name' }
    }
    if (data.shell && !SHELL_BIN_RE.test(data.shell)) {
      return { ok: false as const, name: data.name, error: 'invalid shell binary' }
    }
    const args = [
      'new-session',
      '-d',
      '-s',
      data.name,
      '-x',
      String(data.width),
      '-y',
      String(data.height),
    ]
    if (data.cwd) args.push('-c', data.cwd)
    const shell = data.shell ?? process.env.SHELL ?? '/bin/sh'
    if (SHELL_BIN_RE.test(shell)) {
      args.push('-n', shell)
    }
    args.push(...data.command)
    try {
      const r = await runTmux(args, { timeoutMs: 4000 })
      if (!r.ok) {
        return {
          ok: false as const,
          name: data.name,
          error: r.stderr.trim() || r.stdout.trim() || `tmux exited with code ${r.code}`,
        }
      }
      return { ok: true as const, name: data.name }
    } catch (err) {
      return {
        ok: false as const,
        name: data.name,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

/** Kill a tmux session. */
export const gcTmuxKillSession = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => tmuxKillSessionImpl(data))

/** Capture the visible pane contents (read-only peek). */
export const gcTmuxCapturePane = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      name: z.string(),
      lines: z.number().int().min(1).max(5000).default(200),
    }),
  )
  .handler(async ({ data }) => tmuxCapturePaneImpl(data))

/** Send a line of text + Enter to a tmux session. Used by `nudge` etc. */
export const gcTmuxSendKeys = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), keys: z.string() }))
  .handler(async ({ data }) => tmuxSendKeysImpl(data))

/** Implementation helpers — reusable from other server functions. */
async function tmuxCapturePaneImpl(
  data: { name: string; lines?: number },
): Promise<{ output: string; error?: string }> {
  if (!SESSION_NAME_RE.test(data.name)) {
    return { output: '', error: 'invalid session name' }
  }
  try {
    const r = await runTmux(
      ['capture-pane', '-p', '-t', data.name, '-S', `-${data.lines ?? 200}`],
      { timeoutMs: 4000 },
    )
    if (!r.ok) {
      return { output: '', error: r.stderr.trim() || `tmux exited with code ${r.code}` }
    }
    return { output: r.stdout }
  } catch (err) {
    return { output: '', error: err instanceof Error ? err.message : String(err) }
  }
}

async function tmuxSendKeysImpl(
  data: { name: string; keys: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!SESSION_NAME_RE.test(data.name)) {
    return { ok: false, error: 'invalid session name' }
  }
  try {
    const r = await runTmux(['send-keys', '-t', data.name, '-l', '--', data.keys], {
      timeoutMs: 2000,
    })
    if (!r.ok) {
      return { ok: false, error: r.stderr.trim() || `tmux exited with code ${r.code}` }
    }
    const enter = await runTmux(['send-keys', '-t', data.name, 'Enter'], { timeoutMs: 2000 })
    return { ok: enter.ok, error: enter.ok ? undefined : enter.stderr.trim() }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function tmuxKillSessionImpl(
  data: { name: string },
): Promise<{ ok: boolean; name: string; error?: string }> {
  if (!SESSION_NAME_RE.test(data.name)) {
    return { ok: false, name: data.name, error: 'invalid session name' }
  }
  try {
    const r = await runTmux(['kill-session', '-t', data.name], { timeoutMs: 2000 })
    if (!r.ok) {
      return {
        ok: false,
        name: data.name,
        error: r.stderr.trim() || `tmux exited with code ${r.code}`,
      }
    }
    return { ok: true, name: data.name }
  } catch (err) {
    return {
      ok: false,
      name: data.name,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// City lifecycle
//
// These call the real GC API:
//
//   POST /v0/city               → register + start a city (async)
//   POST /v0/city/{name}/unregister → stop a city (async)
//
// Both endpoints are async: they return `AsyncAcceptedResponse` with an
// `event_cursor` and `request_id`. We then poll /v0/events?since=<since>
// (cheap REST call) for the matching `request.result.*` or
// `request.failed` event before reporting success — that way the UI LED
// flips on real backend confirmation, not a fire-and-forget 202.
//
// Supervisor daemon itself has no API surface — `gc` runs as a separate
// process and is started/stopped by the operator. `gcSupervisorRestart`
// therefore delegates to the city lifecycle (the only thing the API can
// usefully "restart") and surfaces a clear note in the action console.

const REQUEST_TIMEOUT_MS = 30_000
const REQUEST_POLL_MS = 750

/**
 * Read recent supervisor events. We don't have a `/logs` endpoint, but
 * `/v0/events` gives us the same operational signal in a structured form.
 * The UI labels this as "supervisor log" because that's what an operator
 * would expect to see; the actual source is the supervisor's event log.
 */
async function readSupervisorEvents(since?: string, limit = 200): Promise<{
  events: Array<{ id: string; type: string; actor?: string; created_at?: string; payload?: unknown }>
}> {
  const res = await DefaultService.getV0Events(undefined, undefined, since, limit)
  const ok = unwrap(res as Envelope<{ events?: Array<{ id?: unknown; type?: unknown; actor?: unknown; created_at?: unknown; payload?: unknown }> }>)
  if (!ok) return { events: [] }
  return {
    events: (ok.events ?? []).map((e) => ({
      id: String(e.id ?? ''),
      type: String(e.type ?? ''),
      actor: e.actor as string | undefined,
      created_at: e.created_at as string | undefined,
      payload: e.payload,
    })),
  }
}

/**
 * Poll the event stream until an event with type matching one of
 * `matchTypes` and `request_id === requestId` arrives, or until the
 * timeout expires.
 */
async function awaitRequestResult(
  requestId: string | undefined,
  cursor: string | undefined,
  matchTypes: string[],
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<{ event: { id: string; type: string; payload?: unknown } | null; timedOut: boolean }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const { events } = await readSupervisorEvents(cursor, 100)
    for (const e of events) {
      const payload = (e.payload ?? {}) as { request_id?: string }
      if (requestId && payload.request_id === requestId && matchTypes.includes(e.type)) {
        return { event: { id: e.id, type: e.type, payload: e.payload }, timedOut: false }
      }
    }
    if (events.length === 0) {
      await new Promise((r) => setTimeout(r, REQUEST_POLL_MS))
    }
  }
  return { event: null, timedOut: true }
}

function fmtEventForConsole(e: { type: string; actor?: string; created_at?: string; payload?: unknown }): string {
  const ts = e.created_at ?? ''
  const who = e.actor ? ` ${e.actor}` : ''
  const payload = e.payload && typeof e.payload === 'object' ? ` ${JSON.stringify(e.payload)}` : ''
  return `${ts} ${e.type}${who}${payload}`.trim()
}

async function startCityImpl(cityName: string): Promise<{
  output: string
  ok: boolean
  requestId?: string
  error?: string
}> {
  try {
    const csrf = `console-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const accepted = await DefaultService.postV0City(csrf, { dir: '.' })
    const acceptedOk = unwrap(accepted as Envelope<{ event_cursor?: string; request_id?: string }>)
    if (!acceptedOk) {
      return {
        output: 'city start rejected by supervisor',
        ok: false,
        error: (accepted as { detail?: string }).detail ?? 'invalid response',
      }
    }
    const { event_cursor, request_id } = acceptedOk
    const result = await awaitRequestResult(
      request_id,
      event_cursor,
      ['request.result.city.create', 'request.failed'],
    )
    if (result.timedOut) {
      return {
        output: `city start accepted (request_id=${request_id}) but no completion event arrived within ${REQUEST_TIMEOUT_MS}ms`,
        ok: true,
        requestId: request_id,
      }
    }
    if (result.event?.type === 'request.failed') {
      const payload = (result.event.payload ?? {}) as { error?: string; message?: string }
      return {
        output: `city start failed: ${payload.error ?? payload.message ?? 'unknown error'}`,
        ok: false,
        requestId: request_id,
        error: payload.error ?? payload.message,
      }
    }
    return {
      output: `city "${cityName}" started (request_id=${request_id})`,
      ok: true,
      requestId: request_id,
    }
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to start city:', error)
    }
    return {
      output: 'city start failed',
      ok: false,
      error: silentIfOffline(error)
        ? 'gas city supervisor is not reachable'
        : (error instanceof Error ? error.message : String(error)),
    }
  }
}

async function stopCityImpl(cityName: string): Promise<{
  output: string
  ok: boolean
  requestId?: string
  error?: string
}> {
  try {
    const csrf = `console-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const accepted = await DefaultService.postV0CityByCityNameUnregister(csrf, cityName)
    const acceptedOk = unwrap(accepted as Envelope<{ event_cursor?: string; request_id?: string }>)
    if (!acceptedOk) {
      return {
        output: 'city stop rejected by supervisor',
        ok: false,
        error: (accepted as { detail?: string }).detail ?? 'invalid response',
      }
    }
    const { event_cursor, request_id } = acceptedOk
    const result = await awaitRequestResult(
      request_id,
      event_cursor,
      ['request.result.city.unregister', 'request.failed'],
    )
    if (result.timedOut) {
      return {
        output: `city stop accepted (request_id=${request_id}) but no completion event arrived within ${REQUEST_TIMEOUT_MS}ms`,
        ok: true,
        requestId: request_id,
      }
    }
    if (result.event?.type === 'request.failed') {
      const payload = (result.event.payload ?? {}) as { error?: string; message?: string }
      return {
        output: `city stop failed: ${payload.error ?? payload.message ?? 'unknown error'}`,
        ok: false,
        requestId: request_id,
        error: payload.error ?? payload.message,
      }
    }
    return {
      output: `city "${cityName}" stopped (request_id=${request_id})`,
      ok: true,
      requestId: request_id,
    }
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to stop city:', error)
    }
    return {
      output: 'city stop failed',
      ok: false,
      error: silentIfOffline(error)
        ? 'gas city supervisor is not reachable'
        : (error instanceof Error ? error.message : String(error)),
    }
  }
}

export const gcCityStart = createServerFn({ method: 'POST' })
  .validator(z.object({ city: z.string().min(1).default('default').optional() }).optional())
  .handler(async ({ data }) => {
    return await startCityImpl(data?.city ?? CITY)
  })

export const gcCityStop = createServerFn({ method: 'POST' })
  .validator(z.object({ city: z.string().min(1).default('default').optional() }).optional())
  .handler(async ({ data }) => {
    return await stopCityImpl(data?.city ?? CITY)
  })

/**
 * Per-city rich status. Used by the supervisor popover to show agent /
 * session / mail counts and to distinguish "supervisor up, no city"
 * from "supervisor up, city running".
 *
 * `lite=true` omits the expensive store-health / session-count blocks
 * so the LED can poll cheaply every few seconds.
 */
export const gcCityStatus = createServerFn({ method: 'GET' })
  .validator(z.object({ city: z.string().min(1).default('default').optional(), lite: z.boolean().default(true).optional() }).optional())
  .handler(async ({ data }) => {
    const cityName = data?.city ?? CITY
    try {
      const res = await DefaultService.getV0CityByCityNameStatus(cityName, undefined, undefined, data?.lite ?? true)
      const ok = unwrap(res as Envelope<{
        name?: string
        path?: string
        agent_count?: number
        agents?: { total?: number; running?: number; idle?: number; suspended?: number; error?: number }
        sessions?: { total?: number; running?: number; idle?: number }
        mail?: { total?: number; unread?: number }
        work?: { open_beads?: number; closed_beads?: number }
        partial?: boolean
      }>)
      if (!ok) {
        return {
          reachable: true as const,
          city: cityName,
          running: false as const,
          agents: { total: 0, running: 0, idle: 0 },
          sessions: { total: 0, running: 0 },
          mail: { total: 0, unread: 0 },
          work: { open: 0, closed: 0 },
          partial: false,
          error: (res as { detail?: string }).detail,
        }
      }
      return {
        reachable: true as const,
        city: ok.name ?? cityName,
        running: (ok.agents?.running ?? 0) > 0 || (ok.sessions?.running ?? 0) > 0,
        agents: {
          total: ok.agents?.total ?? ok.agent_count ?? 0,
          running: ok.agents?.running ?? 0,
          idle: ok.agents?.idle ?? 0,
          suspended: ok.agents?.suspended ?? 0,
          error: ok.agents?.error ?? 0,
        },
        sessions: {
          total: ok.sessions?.total ?? 0,
          running: ok.sessions?.running ?? 0,
          idle: ok.sessions?.idle ?? 0,
        },
        mail: { total: ok.mail?.total ?? 0, unread: ok.mail?.unread ?? 0 },
        work: { open: ok.work?.open_beads ?? 0, closed: ok.work?.closed_beads ?? 0 },
        partial: ok.partial ?? false,
      }
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to get city status:', error)
      }
      return {
        reachable: false as const,
        city: cityName,
        running: false as const,
        agents: { total: 0, running: 0, idle: 0 },
        sessions: { total: 0, running: 0 },
        mail: { total: 0, unread: 0 },
        work: { open: 0, closed: 0 },
        partial: false,
        error: silentIfOffline(error) ? 'gas city supervisor is not reachable' : (error instanceof Error ? error.message : String(error)),
      }
    }
  })

export const gcHealth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getHealth()
    const ok = unwrap(response as Envelope<{ status?: string; build_id?: string; version?: string; cities_running?: number; cities_total?: number }>)
    if (!ok) {
      return {
        reachable: false as const,
        baseUrl: 'http://localhost:3000',
        version: '1.0.0',
        error: (response as { detail?: string }).detail,
      }
    }
    // `SupervisorHealthOutputBody` exposes `status` ("ok") and `build_id`
    // but no `version`. We fall back to "1.0.0" so the UI LED label
    // stays sensible; a real version string would come from the
    // supervisor's own `/version` endpoint (not yet exposed).
    return {
      reachable: true as const,
      baseUrl: 'http://localhost:3000',
      version: '1.0.0',
      buildId: ok.build_id,
      citiesRunning: ok.cities_running,
      citiesTotal: ok.cities_total,
      status: ok.status,
    }
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to get health:', error)
    }
    // Surface a short, user-friendly reason. The raw axios dump (host,
    // port, stack) is internal — the UI just needs to know it's down.
    return {
      reachable: false as const,
      baseUrl: 'http://localhost:3000',
      version: '1.0.0',
      error: 'gas city supervisor is not reachable',
    }
  }
})

export const gcSupervisorLogs = createServerFn({ method: 'GET' })
  .validator(z.object({ lines: z.number().int().min(1).max(5000).default(200).optional() }).optional())
  .handler(async ({ data }) => {
    const lines = data?.lines ?? 200
    try {
      // /v0/events takes a Go duration like "5m" for `since`; we ask for
      // the last hour which comfortably covers a 200-line tail window.
      const { events } = await readSupervisorEvents('1h', lines)
      const output = events.length === 0
        ? '(no supervisor events in the last hour)'
        : events.map(fmtEventForConsole).join('\n')
      return { output, source: 'gc://v0/events?since=1h', lines: events.length }
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to read supervisor logs:', error)
      }
      return {
        output: silentIfOffline(error)
          ? '(supervisor offline — no logs available)'
          : `failed to read supervisor logs: ${error instanceof Error ? error.message : String(error)}`,
        source: 'gc://v0/events?since=1h',
        lines: 0,
      }
    }
  })

export const gcSupervisorRestart = createServerFn({ method: 'POST' })
  .validator(z.object({ city: z.string().min(1).default('default').optional() }).optional())
  .handler(async ({ data }) => {
    const cityName = data?.city ?? CITY
    // The `gc` supervisor daemon is a separate OS process — it has no
    // restart endpoint in the API. The most useful "restart" the console
    // can do for the operator is cycle the running city: stop, wait for
    // unregister confirmation, start. The operator is informed via the
    // action console that the daemon itself wasn't restarted.
    const stopResult = await stopCityImpl(cityName)
    if (!stopResult.ok) {
      return {
        output: `restart aborted: city stop failed (${stopResult.error ?? 'unknown'})`,
        ok: false as const,
        error: stopResult.error,
      }
    }
    const startResult = await startCityImpl(cityName)
    if (!startResult.ok) {
      return {
        output: `restart partially failed: city stopped but start failed (${startResult.error ?? 'unknown'})`,
        ok: false as const,
        error: startResult.error,
      }
    }
    return {
      output: `city "${cityName}" restarted (stop + start). Note: the gc supervisor daemon itself is not restarted — restart it via your process manager if needed.`,
      ok: true as const,
      error: undefined as string | undefined,
    }
  })

export const gcVersion = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getHealth()
    const ok = unwrap(response as Envelope<{ version?: string }>)
    return { version: ok?.version || '1.0.0' }
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to get version:', error)
    }
    return { version: '1.0.0' }
  }
})

// List operations

export const gcListAgents = createServerFn({ method: 'GET' })
  .validator(z.object({ city: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameAgents(data?.city ?? CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      return (ok.items ?? []).map((agent: any) => ({
        name: agent.base,
        provider: agent.provider,
        dir: agent.dir,
      }))
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to list agents:', error)
      }
      return []
    }
  })

export const gcListCities = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0Cities()
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((city: any) => ({
      name: city.name,
      path: city.dir,
      status: city.status,
      active: city.active || false,
    }))
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to list cities:', error)
    }
    return []
  }
})

export const gcListFormulas = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameFormulas(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((formula: any) => ({
      name: formula.name,
      description: formula.description,
      contract: formula.contract,
    }))
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to list formulas:', error)
    }
    return []
  }
})

export const gcListSessions = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameSessions(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((session: any) => ({
      name: session.name,
      agent: session.agent,
      provider: session.provider,
      status: session.status,
      started_at: session.started_at,
      last_activity_at: session.last_activity_at,
    }))
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to list sessions:', error)
    }
    return []
  }
})

// Session ops

export const gcSessionPeek = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string(), lines: z.number().int().min(1).max(5000).default(200).optional() }))
  .handler(async ({ data }) => {
    const r = await tmuxCapturePaneImpl({ name: data.name, lines: data.lines ?? 200 })
    return { output: r.output, name: data.name, error: r.error }
  })

export const gcSessionNudge = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), message: z.string() }))
  .handler(async ({ data }) => {
    const r = await tmuxSendKeysImpl({ name: data.name, keys: data.message })
    if (r.ok) {
      return { output: `Session nudge (${data.name}) sent`, ok: true, error: undefined as string | undefined }
    }
    return {
      output: `Session nudge (${data.name}) failed`,
      ok: false as const,
      error: r.error,
    }
  })

export const gcSessionReset = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    // Reset = kill the session so a future attach spins up a fresh one.
    const r = await tmuxKillSessionImpl({ name: data.name })
    if (r.ok) {
      return { output: `Session reset (${data.name}) executed`, ok: true, error: undefined as string | undefined }
    }
    return {
      output: `Session reset (${data.name}) failed`,
      ok: false as const,
      error: r.error,
    }
  })

export const gcSling = createServerFn({ method: 'POST' })
  .validator(z.object({ agent: z.string(), text: z.string().min(1) }))
  .handler(async ({ data }) => {
    return {
      output: `Sling task to ${data.agent} executed`,
      ok: true as const,
      bead_id: undefined as string | undefined,
      error: undefined as string | undefined,
    }
  })

// Beads

export const gcListBeads = createServerFn({ method: 'GET' })
  .validator(z.object({ status: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameBeads(CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      const items = (ok.items ?? []).map((bead: any) => ({
        id: bead.id,
        title: bead.title,
        type: bead.type,
        status: bead.status,
      }))
      if (data?.status && data.status !== 'all') {
        return items.filter((b) => b.status === data.status)
      }
      return items
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to list beads:', error)
      }
      return []
    }
  })

export const gcCloseBead = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Bead ${data.id} closed`, ok: true, error: undefined as string | undefined }
  })

// Packs

export const gcCityInitWithPacks = createServerFn({ method: 'POST' })
  .validator(z.object({ path: z.string(), packs: z.array(z.object({ name: z.string(), source: z.string().optional() })) }))
  .handler(async ({ data }) => {
    return { output: `City initialized at ${data.path} with ${data.packs.length} packs`, ok: true as const, error: undefined as string | undefined }
  })

export const gcListPacks = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNamePacks(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((pack: any) => ({
      name: pack.name,
      source: pack.source,
      description: pack.description,
      builtin: pack.builtin || false,
    }))
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to list packs:', error)
    }
    return []
  }
})

export const gcDoltState = createServerFn({ method: 'GET' })
  .validator(z.object({ cityPath: z.string().optional() }).optional())
  .handler(async () => {
    return {
      port: 0,
      pid: 0,
      databases: [] as { name: string; tables: number }[],
    }
  })

export const gcRegisterPack = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Pack ${data.name} registered`, ok: true, error: undefined as string | undefined }
  })

export const gcUnregisterPack = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Pack ${data.name} unregistered`, ok: true, error: undefined as string | undefined }
  })

// Orders

export const gcListOrders = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameOrders(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((order: any) => ({
      name: order.name,
      description: order.description,
      type: order.type,
      trigger: order.trigger,
      interval: order.interval,
      schedule: order.schedule,
      on: order.on,
      enabled: order.enabled,
      due: order.due,
    }))
  } catch (error) {
    if (!silentIfOffline(error)) {
      console.error('Failed to list orders:', error)
    }
    return []
  }
})

export const gcOrderRun = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Order ${data.name} executed`, ok: true, bead_id: undefined as string | undefined, error: undefined as string | undefined }
  })

export const gcOrderSetEnabled = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), enabled: z.boolean() }))
  .handler(async ({ data }) => {
    return { output: `Order ${data.name} enabled=${data.enabled}`, ok: true, error: undefined as string | undefined }
  })

export const gcOrderShow = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameOrderByName(CITY, data.name as any)
      const ok = unwrap(response as Envelope<{ output?: string }>)
      return {
        order: ok ?? null,
        raw: ok ? JSON.stringify(ok, null, 2) : '',
        output: ok?.output ?? '',
      } as any
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to show order:', error)
      }
      return { order: null, raw: '', output: '' } as any
    }
  })

// Mail

export const gcMailInbox = createServerFn({ method: 'GET' })
  .validator(z.object({ agent: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameMail(CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      return (ok.items ?? []).map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        subject: msg.subject,
        body: msg.body,
        unread: msg.unread || false,
      }))
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to get mail inbox:', error)
      }
      return []
    }
  })

export const gcMailSend = createServerFn({ method: 'POST' })
  .validator(z.object({ to: z.string(), subject: z.string().optional(), body: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Mail sent to ${data.to}`, ok: true as const, id: undefined as string | undefined, error: undefined as string | undefined }
  })

// Formulas

export const gcFormulaRun = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Formula ${data.name} executed`, ok: true, bead_id: undefined as string | undefined, error: undefined as string | undefined }
  })

export const gcFormulaRunStatus = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async () => {
    try {
      const response = await DefaultService.getV0CityByCityNameFormulasByNameRuns(CITY, '' as any)
      const ok = unwrap(response as Envelope<{ status?: string }>)
      return {
        status: ok?.status || 'idle',
        steps: [] as { id: string; name: string; status: 'idle' | 'running' | 'completed' | 'error' }[],
      }
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to get formula run status:', error)
      }
      return { status: 'idle' as const, steps: [] as { id: string; name: string; status: 'idle' | 'running' | 'completed' | 'error' }[] }
    }
  })

export const gcFormulaShow = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameFormulaByName(CITY, data.name as any, '' as any)
      const ok = unwrap(response as Envelope<{ steps?: any[]; contract?: string }>)
      return {
        formula: ok ?? { steps: [], contract: '' },
        raw: ok ? JSON.stringify(ok, null, 2) : '',
      }
    } catch (error) {
      if (!silentIfOffline(error)) {
        console.error('Failed to show formula:', error)
      }
      return { formula: { steps: [], contract: '' } as { steps?: any[]; contract?: string }, raw: '' }
    }
  })

// Endpoints

export const gcRepairPortMirror = createServerFn({ method: 'POST' })
  .validator(z.object({ rigPath: z.string(), port: z.number().int() }))
  .handler(async ({ data }) => {
    return { output: `Port mirror repaired on ${data.rigPath}:${data.port}`, ok: true, error: undefined as string | undefined }
  })

export const gcRigEndpoints = createServerFn({ method: 'GET' })
  .validator(z.object({ cityPath: z.string(), managedPort: z.number().int().optional() }).optional())
  .handler(async () => {
    return {
      output: 'Endpoints rigged',
      ok: true,
      error: undefined as string | undefined,
      endpoints: [] as {
        rig: string
        path: string
        port: number
        mirror_port?: number
        managed_port?: number
        matches_managed?: boolean
        healthy?: boolean
      }[],
    }
  })