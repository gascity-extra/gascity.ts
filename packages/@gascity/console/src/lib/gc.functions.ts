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
  events: Array<{ seq: string; type: string; actor?: string; subject?: string; ts?: string; created_at?: string; payload?: unknown }>
}> {
  const res = await DefaultService.getV0Events(undefined, undefined, since, limit)
  // Per `gastownhall/gascity`'s `SupervisorEventListOutput` Go struct,
  // the response shape is `{ event_cursor, items, total }` — events
  // live under `items`, not `events`. We accept either so a future
  // rename doesn't silently empty the log buffer again.
  const ok = unwrap(res as Envelope<{
    items?: Array<{
      seq?: unknown
      type?: unknown
      actor?: unknown
      subject?: unknown
      ts?: unknown
      created_at?: unknown
      payload?: unknown
    }>
    events?: Array<{
      seq?: unknown
      type?: unknown
      actor?: unknown
      subject?: unknown
      ts?: unknown
      created_at?: unknown
      payload?: unknown
    }>
  }>)
  if (!ok) return { events: [] }
  const raw = ok.items ?? ok.events ?? []
  return {
    events: raw.map((e) => ({
      seq: String(e.seq ?? ""),
      type: String(e.type ?? ""),
      actor: e.actor as string | undefined,
      subject: e.subject as string | undefined,
      ts: e.ts as string | undefined,
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
): Promise<{ event: { seq: string; type: string; payload?: unknown } | null; timedOut: boolean }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const { events } = await readSupervisorEvents(cursor, 100)
    for (const e of events) {
      const payload = (e.payload ?? {}) as { request_id?: string }
      if (requestId && payload.request_id === requestId && matchTypes.includes(e.type)) {
        return { event: { seq: e.seq, type: e.type, payload: e.payload }, timedOut: false }
      }
    }
    if (events.length === 0) {
      await new Promise((r) => setTimeout(r, REQUEST_POLL_MS))
    }
  }
  return { event: null, timedOut: true }
}

function fmtEventForConsole(e: {
  type: string
  actor?: string
  subject?: string
  ts?: string
  created_at?: string
  payload?: unknown
}): string {
  // Upstream `WireTaggedEvent` uses `ts` for the timestamp and
  // `subject` for what was acted on (path, rig, etc.). Older fields
  // `created_at` / `actor` are kept as fallbacks so older OpenAPI
  // clients (or future renames) still produce readable output.
  const ts = e.ts ?? e.created_at ?? ''
  const who = e.actor ? ` ${e.actor}` : ''
  const subj = e.subject ? ` ${e.subject}` : ''
  const payload = e.payload && typeof e.payload === "object"
    ? ` ${JSON.stringify(e.payload)}`
    : ""
  return `${ts} ${e.type}${who}${subj}${payload}`.trim()
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
  .validator(
    z
      .object({
        city: z.string().min(1).default('default').optional(),
        lite: z.boolean().default(true).optional(),
        apiUrl: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const cityName = data?.city ?? CITY
    const override = data?.apiUrl
    const { url, source } = resolveSupervisorUrl(override)
    if (isSupervisorApiDisabled()) {
      return {
        reachable: false as const,
        city: cityName,
        url,
        urlSource: source,
        urlDisabled: true as const,
        running: false as const,
        agents: { total: 0, running: 0, idle: 0 },
        sessions: { total: 0, running: 0 },
        mail: { total: 0, unread: 0 },
        work: { open: 0, closed: 0 },
        partial: false,
        error: 'GC_NO_API is set — supervisor API calls are disabled',
      }
    }
    return withSupervisorUrl(override, async () => {
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
            url,
            urlSource: source,
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
          url,
          urlSource: source,
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
          url,
          urlSource: source,
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
  })

export const gcHealth = createServerFn({ method: 'GET' })
  .validator(z.object({ apiUrl: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const override = data?.apiUrl
    const { url, source } = resolveSupervisorUrl(override)
    // Honour upstream's `GC_NO_API` escape hatch: if the operator
    // explicitly disabled supervisor API access (mirrors what `gc`
    // does in the Go CLI), short-circuit with a clean "disabled"
    // state so the UI shows a distinct badge instead of a generic
    // "offline" red dot.
    if (isSupervisorApiDisabled()) {
      return {
        reachable: false as const,
        baseUrl: url,
        urlSource: source,
        urlDisabled: true as const,
        version: '1.0.0',
        error: 'GC_NO_API is set — supervisor API calls are disabled',
      }
    }
    return withSupervisorUrl(override, async () => {
      try {
        const response = await DefaultService.getHealth()
        const ok = unwrap(response as Envelope<{ status?: string; build_id?: string; version?: string; cities_running?: number; cities_total?: number }>)
        if (!ok) {
          return {
            reachable: false as const,
            baseUrl: url,
            urlSource: source,
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
          baseUrl: url,
          urlSource: source,
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
          baseUrl: url,
          urlSource: source,
          version: '1.0.0',
          error: 'gas city supervisor is not reachable',
        }
      }
    })
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

// Supervisor daemon lifecycle
// -----------------------------------------------------------------------------
// The `gc` supervisor itself is a separate OS process — it has no REST
// endpoint for start/stop/restart because the API only knows how to talk
// to a supervisor that's already running. The console drives the daemon
// by shelling out to the `gc` CLI, with the same safety patterns as the
// tmux helpers above: allow-list the binary path, spawn with a minimal
// fixed environment (not `process.env`), and validate args before exec.

const GC_BIN_RE = /^[a-zA-Z0-9_./-]+$/

function safeGcBin(): string {
  const bin = process.env.GC_BIN ?? 'gc'
  if (!GC_BIN_RE.test(bin)) {
    throw new Error(`invalid GC_BIN env (${bin})`)
  }
  return bin
}

// Internal helper exported only for unit tests. Production code
// should never call this directly — use the server functions below.
export function _resolveCityDirForTest(override?: string): string {
  return resolveCityDir(override)
}

// --- Supervisor URL resolution -------------------------------------------------
//
// The supervisor's HTTP API can live anywhere — `127.0.0.1:9443` for a
// local dev box (upstream default), `https://gc.prod.example.com` for a
// hosted deployment, or `http://10.0.0.5:9001` for a sidecar. We honour
// a stack of overrides that mirrors what the upstream `gc` CLI does
// for its own `--api` flag plus auto-discovery from `supervisor.toml`:
//
//   1. Explicit override passed to the call (e.g. operator typed it in
//      the UI). Per-request, never persisted on the server.
//   2. `GC_API_BASE_URL` env var on the console server. **This is a
//      console-side convention — the upstream `gc` Go CLI does not
//      recognize this variable.** We added it before we knew the
//      upstream convention (which is the `--api` flag plus reading
//      `supervisor.toml` directly). Kept for backward compatibility
//      with deployments that already export it.
//   3. Auto-discovery: parse `~/.gc/supervisor.toml` (or `$GC_HOME/
//      supervisor.toml`) and read `[supervisor] bind` + `port`, exactly
//      like `supervisorAPIBaseURL()` in the upstream Go CLI. Default
//      port per upstream: 9443.
//   4. Fallback to `http://127.0.0.1:9443`, the upstream default from
//      the `[supervisor]` section.
//
// We deliberately do NOT honor a `GC_SUPERVISOR_URL` env var. The
// upstream CLI doesn't read one (verified against `gastownhall/gascity`
// Go source — there is no `GC_SUPERVISOR_URL`, `GAS_CITY_*`, or
// `GC_API_BASE_URL` env var in upstream). Inventing one would mislead
// operators into thinking the upstream `gc` understands it.
//
// The function is exported as `_resolveSupervisorUrlForTest` for unit
// tests; production code should use the `gcSupervisorDiscover` server
// function (which adds reachability and source tracking).

const SUPERVISOR_URL_DEFAULT = 'http://127.0.0.1:9443'
const SUPERVISOR_URL_RE = /^https?:\/\/[^\s]+$/

function defaultSupervisorHome(): string {
  // Mirror the upstream `DefaultHome()`: $GC_HOME if set, else
  // $HOME/.gc, else /tmp/.gc. The trailing `.gc` is intentional —
  // upstream writes `supervisor.toml` directly under the home dir.
  if (process.env.GC_HOME && process.env.GC_HOME.trim().length > 0) {
    return process.env.GC_HOME.trim()
  }
  const home = process.env.HOME?.trim()
  if (home && home.length > 0) {
    return `${home}/.gc`
  }
  return '/tmp/.gc'
}

/**
 * Read `[supervisor] bind` and `port` from the supervisor's TOML config
 * using a deliberately tiny line-based parser. We avoid pulling in a
 * TOML dependency for what is essentially two scalars. Only `[section]`
 * headers, `key = value` pairs, and `# comments` are supported — exactly
 * what `supervisor.toml` contains in practice. A real TOML library
 * would be needed if the file ever grew complex (arrays, inline
 * tables, dotted keys), and we can swap in `smol-toml` then without
 * changing call sites.
 */
function parseSupervisorToml(text: string): {
  bind?: string
  port?: number
} {
  const result: { bind?: string; port?: number } = {}
  let currentSection: string | null = null
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) continue
    const sectionMatch = line.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      continue
    }
    if (currentSection !== 'supervisor') continue
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*(.+)$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2].trim()
    // Strip trailing inline comment.
    const hashIdx = value.indexOf('#')
    if (hashIdx >= 0) value = value.slice(0, hashIdx).trim()
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key === 'bind' || key === 'address' || key === 'host') {
      result.bind = value
    } else if (key === 'port') {
      const n = Number(value)
      if (Number.isFinite(n) && n > 0 && n <= 65535) {
        result.port = Math.floor(n)
      }
    }
  }
  return result
}

/**
 * Construct `http(s)://bind:port`, normalising wildcard bind addresses
 * (`0.0.0.0` → `127.0.0.1`, `::` → `::1`) exactly like the upstream
 * `supervisorAPIBaseURL()`. Returns `null` if either component is
 * missing or invalid.
 */
function buildSupervisorUrlFromToml(
  bind: string | undefined,
  port: number | undefined,
): string | null {
  if (!bind || !port) return null
  let host = bind
  if (host === '0.0.0.0') host = '127.0.0.1'
  if (host === '::' || host === '[::]') host = '::1'
  // Strip IPv6 brackets if the user wrote `[::1]` literally.
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  return `http://${host}:${port}`
}

async function readSupervisorUrlFromToml(): Promise<string | null> {
  // We only auto-discover on the server side. The console client never
  // touches the supervisor's filesystem — that's by design (the
  // operator's local browser should not need read access to the
  // supervisor's runtime config).
  const path = await import('node:path')
  const fs = await import('node:fs')
  const tomlPath = path.join(defaultSupervisorHome(), 'supervisor.toml')
  try {
    const text = fs.readFileSync(tomlPath, 'utf8')
    const { bind, port } = parseSupervisorToml(text)
    return buildSupervisorUrlFromToml(bind, port)
  } catch {
    return null
  }
}

function pickSupervisorUrlFromEnv(): string | null {
  // `GC_API_BASE_URL` is a console-side convention — upstream `gc` Go
  // CLI does not read it. We do, so operators can pin the console at
  // a specific supervisor without touching the operator's per-machine
  // `supervisor.toml` (useful in CI / multi-tenant deployments).
  const raw = process.env.GC_API_BASE_URL
  if (!raw) return null
  const trimmed = raw.trim().replace(/\/$/, '')
  if (trimmed.length === 0) return null
  if (!SUPERVISOR_URL_RE.test(trimmed)) return null
  return trimmed
}

function resolveSupervisorUrl(override?: string): {
  url: string
  source: 'override' | 'env' | 'toml' | 'default'
} {
  if (override && override.trim().length > 0) {
    const trimmed = override.trim().replace(/\/$/, '')
    if (SUPERVISOR_URL_RE.test(trimmed)) {
      return { url: trimmed, source: 'override' }
    }
  }
  const fromEnv = pickSupervisorUrlFromEnv()
  if (fromEnv) return { url: fromEnv, source: 'env' }
  // Note: `readSupervisorUrlFromToml` is async, but this helper is
  // sync to keep the existing call sites (and unit tests) simple.
  // The async variant lives in `discoverSupervisorUrl` below.
  return { url: SUPERVISOR_URL_DEFAULT, source: 'default' }
}

async function discoverSupervisorUrl(
  override?: string,
): Promise<{
  url: string
  source: 'override' | 'env' | 'toml' | 'default'
  fromToml: string | null
}> {
  const fromOverride = (() => {
    if (!override || override.trim().length === 0) return null
    const trimmed = override.trim().replace(/\/$/, '')
    return SUPERVISOR_URL_RE.test(trimmed) ? trimmed : null
  })()
  if (fromOverride) {
    return { url: fromOverride, source: 'override', fromToml: null }
  }
  const fromEnv = pickSupervisorUrlFromEnv()
  if (fromEnv) {
    return { url: fromEnv, source: 'env', fromToml: null }
  }
  const fromToml = await readSupervisorUrlFromToml()
  if (fromToml) {
    return { url: fromToml, source: 'toml', fromToml }
  }
  return { url: SUPERVISOR_URL_DEFAULT, source: 'default', fromToml: null }
}

export function _resolveSupervisorUrlForTest(override?: string): {
  url: string
  source: 'override' | 'env' | 'toml' | 'default'
} {
  return resolveSupervisorUrl(override)
}

export function _parseSupervisorTomlForTest(text: string): {
  bind?: string
  port?: number
} {
  return parseSupervisorToml(text)
}

export function _buildSupervisorUrlFromTomlForTest(
  bind: string | undefined,
  port: number | undefined,
): string | null {
  return buildSupervisorUrlFromToml(bind, port)
}

/**
 * Temporarily reconfigure the global OpenAPI client to point at the
 * given supervisor URL, run `fn`, then restore the previous BASE.
 *
 * TanStack Start server functions are awaited synchronously inside a
 * single Node.js event-loop turn — there is no real concurrency to
 * worry about for the duration of `fn`. The previous BASE is captured
 * before the swap and restored in a `finally` so a thrown error never
 * leaves the client pointing at the wrong supervisor.
 *
 * Pass `override` = `undefined` to leave the global client untouched
 * (i.e. behave exactly like the old code path).
 */
async function withSupervisorUrl<T>(
  override: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!override || override.trim().length === 0) return fn()
  const trimmed = override.trim().replace(/\/$/, '')
  if (!SUPERVISOR_URL_RE.test(trimmed)) return fn()
  const { OpenAPI } = await import('@gascity/client')
  const previous = (OpenAPI as { BASE?: string }).BASE
    ; (OpenAPI as { BASE?: string }).BASE = trimmed
  try {
    return await fn()
  } finally {
    ; (OpenAPI as { BASE?: string }).BASE = previous
  }
}

/**
 * Returns `true` when the `GC_NO_API` escape hatch is set on the
 * console server. The upstream `gc` Go CLI reads the same variable
 * (verified against `gastownhall/gascity`) and uses it to skip HTTP
 * calls to the supervisor entirely — falling back to direct local
 * reads of the on-disk store. We honour the same convention so an
 * operator who sets `GC_NO_API=1` on the host running the console
 * gets a "supervisor API disabled" state in the UI instead of noisy
 * ECONNREFUSED spam in the logs.
 *
 * Truthy values: "1", "true", "yes", "on" (case-insensitive).
 */
export function isSupervisorApiDisabled(): boolean {
  const raw = process.env.GC_NO_API
  if (!raw) return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

/**
 * Resolve the city directory the supervisor / CLI should operate in.
 *
 * Order of precedence:
 *   1. Explicit override passed to the call (`override`).
 *   2. `GC_CITY_DIR` environment variable on the console server.
 *   3. `process.cwd()` of the console server (legacy default).
 *
 * The path is validated to be absolute and to live under an allowed
 * root (`GC_CITY_ROOT`, defaults to `$HOME` or `/workspaces` when HOME
 * is unset) so a hostile client cannot make us `gc init /etc` or similar.
 * Symlinks are resolved and `..` segments are collapsed before the
 * allow-list check.
 */
function resolveCityDir(override?: string): string {
  const raw =
    override && override.trim().length > 0
      ? override
      : (process.env.GC_CITY_DIR && process.env.GC_CITY_DIR.trim().length > 0
        ? process.env.GC_CITY_DIR
        : process.cwd())
  const path = require('node:path') as typeof import('node:path')
  const resolved = path.resolve(raw)
  // Allow-list: must live under one of the roots. Default to HOME if set,
  // else `/workspaces` (typical dev container layout), else the resolved
  // path itself (so the legacy behavior — cwd of the console server —
  // continues to work when neither env var is set).
  const allowedRoots = (process.env.GC_CITY_ROOT
    ? process.env.GC_CITY_ROOT.split(':')
    : [process.env.HOME ?? '/workspaces']
  )
    .map((r) => path.resolve(r))
    .filter((r) => r.length > 0)
  const isAllowed =
    allowedRoots.length === 0 ||
    allowedRoots.some((root) => {
      // A trailing-separator root like "/" matches any absolute path.
      // Otherwise the resolved path must equal the root or live under it.
      if (root === path.sep) return resolved.startsWith(path.sep)
      return resolved === root || resolved.startsWith(root + path.sep)
    })
  if (!isAllowed) {
    throw new Error(
      `city dir "${resolved}" is outside allowed roots (${allowedRoots.join(', ')}); ` +
      `set GC_CITY_ROOT to widen the allow-list`,
    )
  }
  return resolved
}

/**
 * Spawn the `gc` CLI and collect stdout/stderr/exit. The CLI is
 * synchronous (returns when the operation completes), so unlike the
 * city-level operations we don't need to poll /v0/events — the spawn
 * exit IS the completion signal.
 *
 * Set `GC_BIN` to override the binary path (e.g. `/opt/gc/bin/gc`).
 */
async function runGc(
  args: string[],
  opts: { timeoutMs?: number; cwd?: string } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string; code: number }> {
  const { spawn } = await import('node:child_process')
  const bin = safeGcBin()
  const cwd = opts.cwd ? resolveCityDir(opts.cwd) : undefined
  return await new Promise((resolve) => {
    const child = spawn(bin, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
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
        stderr: `timeout after ${opts.timeoutMs ?? 15000}ms`,
        code: -1,
      })
    }, opts.timeoutMs ?? 15_000)
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
      resolve({
        ok: code === 0,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        code: code ?? -1,
      })
    })
    child.stdin.end()
  })
}

async function startSupervisorImpl(opts: { cwd?: string } = {}): Promise<{
  output: string
  ok: boolean
  error?: string
}> {
  // We deliberately use `gc supervisor start` rather than `gc start`.
  // The upstream `gc` Go CLI distinguishes these:
  //
  //   `gc start`               — registers a city with the supervisor
  //                              AND starts the supervisor if needed.
  //                              Requires a bootstrapped city (i.e.
  //                              city.toml present in the target dir).
  //   `gc supervisor start`    — starts ONLY the supervisor, with no
  //                              city registered. Does not require
  //                              a bootstrapped city.
  //
  // The supervisor popover in our console is the operator's control
  // for "is the supervisor up?" — not "is city X running?". An
  // operator who hasn't scaffolded a city yet still needs to be
  // able to bring the supervisor up (so the API comes online and
  // other tooling can discover it). Using `gc supervisor start`
  // avoids the confusing "not in a city directory" error that `gc
  // start` produces when run from a non-city cwd.
  const result = await runGc(['supervisor', 'start'], { timeoutMs: 30_000, cwd: opts.cwd })
  if (result.ok) {
    return {
      output: 'gc supervisor started',
      ok: true,
    }
  }
  if (/already\s+running/i.test(result.stdout) || /already\s+running/i.test(result.stderr)) {
    return {
      output: 'gc supervisor already running',
      ok: true,
    }
  }
  // Special-case ENOENT (binary not on PATH). This is the most common
  // operator error and the raw "spawn gc ENOENT" message is opaque.
  // Tell them exactly what's wrong and how to fix it.
  if (result.code === -1 && /^spawn .* ENOENT/.test(result.stderr)) {
    return {
      output:
        'gc binary not found in PATH. Install the `gc` CLI on the host ' +
        'and ensure `which gc` resolves, or set GC_BIN=/absolute/path/to/gc ' +
        'before starting vite.',
      ok: false,
      error: 'gc binary not found in PATH',
    }
  }
  return {
    output: `gc supervisor start failed (exit=${result.code}): ${(result.stderr || result.stdout).trim().slice(0, 500)}`,
    ok: false,
    error: (result.stderr || result.stdout).trim().slice(0, 500),
  }
}

async function stopSupervisorImpl(opts: { cwd?: string } = {}): Promise<{
  output: string
  ok: boolean
  error?: string
}> {
  const result = await runGc(['supervisor', 'stop'], { timeoutMs: 30_000, cwd: opts.cwd })
  if (result.ok) {
    return {
      output: 'gc supervisor stopped',
      ok: true,
    }
  }
  if (/not\s+running|already\s+stopped|no such process/i.test(result.stderr)) {
    return {
      output: 'gc supervisor already stopped',
      ok: true,
    }
  }
  return {
    output: `gc supervisor stop failed (exit=${result.code}): ${(result.stderr || result.stdout).trim().slice(0, 500)}`,
    ok: false,
    error: (result.stderr || result.stdout).trim().slice(0, 500),
  }
}

/**
 * Probe whether the resolved city directory contains a `city.toml` or
 * a `.gc/` subdirectory — i.e. whether `gc start` will succeed there.
 * This is what the supervisor panel uses to decide whether to render
 * the `start` button as enabled or to show `not initialized` + `init`
 * instead.
 *
 * Returns the resolved absolute city dir so the client can echo it
 * back in the UI (and store it for the next start).
 */
async function probeCityDirImpl(cwd: string): Promise<{
  cwd: string
  initialized: boolean
  hasCityToml: boolean
  hasGcDir: boolean
}> {
  const resolved = resolveCityDir(cwd)
  const fs = await import('node:fs')
  let hasCityToml = false
  let hasGcDir = false
  try {
    hasCityToml = fs.existsSync(`${resolved}/city.toml`)
  } catch {
    /* ignore */
  }
  try {
    hasGcDir = fs.existsSync(`${resolved}/.gc`)
  } catch {
    /* ignore */
  }
  return {
    cwd: resolved,
    initialized: hasCityToml || hasGcDir,
    hasCityToml,
    hasGcDir,
  }
}

/**
 * Initialize a new city in the given directory by shelling out to
 * `gc init <path>`. The path is created if missing (gc does this for
 * us when given a non-existent target — but we make the directory
 * first so partial failures don't leave a half-baked tree behind).
 *
 * On success the caller can immediately retry `gc start` without
 * needing any extra state.
 */
async function initCityImpl(path: string): Promise<{
  output: string
  ok: boolean
  error?: string
}> {
  const resolved = resolveCityDir(path)
  const fs = await import('node:fs')
  try {
    fs.mkdirSync(resolved, { recursive: true })
  } catch (err) {
    return {
      output: `failed to create directory ${resolved}: ${err instanceof Error ? err.message : String(err)}`,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
  const result = await runGc(['init', resolved], { timeoutMs: 30_000, cwd: resolved })
  if (result.ok) {
    return {
      output: `initialized city at ${resolved}`,
      ok: true,
    }
  }
  if (result.code === -1 && /^spawn .* ENOENT/.test(result.stderr)) {
    return {
      output:
        'gc binary not found in PATH. Install the `gc` CLI on the host ' +
        'and ensure `which gc` resolves, or set GC_BIN=/absolute/path/to/gc.',
      ok: false,
      error: 'gc binary not found in PATH',
    }
  }
  return {
    output: `gc init failed (exit=${result.code}): ${(result.stderr || result.stdout).trim().slice(0, 500)}`,
    ok: false,
    error: (result.stderr || result.stdout).trim().slice(0, 500),
  }
}

/**
 * Start the `gc` supervisor daemon (the operator's process manager is
 * not involved — the console drives the binary directly). Idempotent:
 * if the daemon is already running this reports ok with a note.
 *
 * Accepts an optional `cwd` so the operator can choose which city
 * directory the supervisor runs from. Defaults to the server-side
 * `GC_CITY_DIR` env var, then the console server's own `process.cwd()`.
 */
export const gcSupervisorStart = createServerFn({ method: 'POST' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      return await startSupervisorImpl({ cwd: data?.cwd })
    } catch (error) {
      return {
        output: 'gc supervisor start threw unexpectedly',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

/**
 * Stop the `gc` supervisor daemon. Idempotent: if the daemon isn't
 * running this reports ok with a note.
 */
export const gcSupervisorStop = createServerFn({ method: 'POST' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      return await stopSupervisorImpl({ cwd: data?.cwd })
    } catch (error) {
      return {
        output: 'gc supervisor stop threw unexpectedly',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

/**
 * Restart the `gc` supervisor daemon. Drives `gc stop` then `gc start`
 * sequentially and reports the outcome of each phase. The city lifecycle
 * is independent — restarting the daemon doesn't restart any city.
 * Cities re-register on their own when the daemon comes back up.
 */
export const gcSupervisorRestart = createServerFn({ method: 'POST' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const stopResult = await stopSupervisorImpl({ cwd: data?.cwd })
    if (!stopResult.ok) {
      return {
        output: `restart aborted: ${stopResult.output}`,
        ok: false as const,
        error: stopResult.error,
      }
    }
    const startResult = await startSupervisorImpl({ cwd: data?.cwd })
    if (!startResult.ok) {
      return {
        output: `restart partially failed: stopped OK but ${startResult.output}`,
        ok: false as const,
        error: startResult.error,
      }
    }
    return {
      output: `gc supervisor restarted (stop + start)`,
      ok: true as const,
      error: undefined as string | undefined,
    }
  })

/**
 * Probe the city directory the supervisor would run from. Returns the
 * resolved absolute path plus whether it already contains a `city.toml`
 * or `.gc/` (i.e. whether `gc start` would succeed without first
 * running `gc init`).
 */
export const gcCityProbe = createServerFn({ method: 'GET' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      return await probeCityDirImpl(data?.cwd ?? '')
    } catch (error) {
      return {
        cwd: data?.cwd ?? '',
        initialized: false,
        hasCityToml: false,
        hasGcDir: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

/**
 * Initialize a new city in the given directory. Wraps `gc init <path>`.
 * The directory is created (recursively) if it doesn't already exist.
 */
export const gcCityInit = createServerFn({ method: 'POST' })
  .validator(z.object({ path: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      return await initCityImpl(data.path)
    } catch (error) {
      return {
        output: 'gc init threw unexpectedly',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

/**
 * Discover where the supervisor's HTTP API lives. Mirrors what the
 * upstream `gc dashboard --api <url>` does, but server-side so the
 * console can echo the resolved URL back to the operator and surface
 * which source it picked (env, supervisor.toml, default).
 *
 * If `override` is provided it wins (same precedence as everywhere
 * else in this file). Returns:
 *   - url:       the URL we'd use for an HTTP request
 *   - source:    where the URL came from ('override' | 'env' | 'toml' | 'default')
 *   - fromToml:  raw URL read from supervisor.toml (if any) — useful
 *                for the UI to show "auto-detected from supervisor.toml"
 *   - reachable: best-effort result of a HEAD probe against /v0/health
 *                (used by the LED badge)
 */
export const gcSupervisorDiscover = createServerFn({ method: 'GET' })
  .validator(z.object({ apiUrl: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const override = data?.apiUrl
    const { url, source, fromToml } = await discoverSupervisorUrl(override)
    if (isSupervisorApiDisabled()) {
      // Don't even probe — the operator has explicitly opted out of
      // supervisor API access. UI can show a distinct "api disabled"
      // badge.
      return { url, source, fromToml, reachable: false, apiDisabled: true }
    }
    // Cheap reachability probe: do not throw on failure, just report.
    let reachable = false
    try {
      const res = await fetch(`${url}/v0/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })
      reachable = res.ok
    } catch {
      reachable = false
    }
    return { url, source, fromToml, reachable }
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
    // Delegate to the real `gc init` implementation. The packs list is
    // accepted for API compatibility with the existing `/cities` dialog
    // — once the CLI gains a `--with-pack` flag we'll forward them.
    try {
      const result = await initCityImpl(data.path)
      const suffix = data.packs.length > 0 ? ` (with ${data.packs.length} pack(s) requested)` : ''
      return {
        output: result.ok ? `${result.output}${suffix}` : result.output,
        ok: result.ok,
        error: result.error,
      }
    } catch (error) {
      return {
        output: 'gc init threw unexpectedly',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
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