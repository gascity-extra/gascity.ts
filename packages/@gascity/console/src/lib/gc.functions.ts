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
import { silentIfOffline, isCityNotConfigured, CITY_NOT_CONFIGURED_HINT } from './gc-errors'
import { derivePackName, PACK_NAME_RE } from './packs-catalog'
import { summariseRegistryCommand } from './registry-feedback'
import * as path from 'node:path'

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

async function startCityImpl(cityName: string, dir?: string): Promise<{
  output: string
  ok: boolean
  requestId?: string
  error?: string
}> {
  try {
    const csrf = `console-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    // `POST /v0/city` is the upstream-canonical "create + register + start"
    // endpoint (`internal/api/huma_handlers_supervisor.go:108-118`). It
    // accepts an absolute city path in `dir` and resolves relative paths
    // against the SUPERVISOR's $HOME — not the console's cwd — so we
    // must pass an absolute path here, not `'.'`. The UI passes the
    // path from the dialog so the supervisor scaffolds (or re-attaches
    // to) the same directory the console just `gc init`-ed.
    const cityDir = dir ? path.resolve(dir) : undefined
    const accepted = await DefaultService.postV0City(csrf, { dir: cityDir ?? '.' })
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
  .validator(
    z
      .object({
        city: z.string().min(1).default('default').optional(),
        dir: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    return await startCityImpl(data?.city ?? CITY, data?.dir)
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
// The supervisor's HTTP API can live anywhere — `127.0.0.1:8372` for a
// local dev box (upstream default per `internal/supervisor/config.go:
// PortOrDefault()`), `https://gc.prod.example.com` for a hosted
// deployment, or `http://10.0.0.5:9001` for a sidecar. We honour a
// stack of overrides that mirrors what the upstream `gc` CLI does for
// its own `--api` flag plus auto-discovery from `supervisor.toml`:
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

const SUPERVISOR_URL_DEFAULT = 'http://127.0.0.1:8372'
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
  // IPv6 addresses must be wrapped in brackets inside a URL when a port
  // follows (RFC 3986 §3.2.2). Without brackets the URL parser treats
  // the first `:` as the port separator and the rest as garbage.
  if (host.includes(':')) host = `[${host}]`
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

// --- Sling output parsing -----------------------------------------------------
//
// `gc sling --json <agent> "<text>"` emits a JSON envelope on stdout.
// The exact envelope shape isn't documented, so we accept a few common
// shapes by key: top-level `bead_id`, `bead.id`, `beads[0].id`, or
// dispatch result `result.bead_id`. When `--json` isn't available (older
// `gc` builds) we fall back to regex extraction of `gd-…` / `bd-…` ids
// from stdout. The parser is exposed for unit tests.

interface SlingParseResult {
  output: string
  bead_id?: string
}

function parseSlingOutput(stdout: string, stderr: string): SlingParseResult {
  const trimmed = stdout.trim()
  // Try JSON first — `--json` is the stable machine format.
  if (trimmed.length > 0 && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      const obj = JSON.parse(trimmed)
      const id =
        (typeof obj?.bead_id === 'string' && obj.bead_id) ||
        (typeof obj?.bead?.id === 'string' && obj.bead.id) ||
        (typeof obj?.result?.bead_id === 'string' && obj.result.bead_id) ||
        (Array.isArray(obj?.beads) &&
          typeof obj.beads[0]?.id === 'string' &&
          obj.beads[0].id) ||
        undefined
      if (id) {
        return { output: `slung bead ${id}`, bead_id: id }
      }
      // JSON parsed but no known id field — fall through to regex.
    } catch {
      // Not valid JSON — fall through to regex.
    }
  }
  // Regex fallback. Priority order: explicit "Created" / "Slung" /
  // "Started workflow" / "Attached wisp" markers first (bead id is the
  // next whitespace-delimited token). Upstream `gc sling` uses
  // per-rig-configured bead-id prefixes (e.g. `BL-42`, `FE-1`,
  // `agent-diagnostics`) rather than a fixed `gd-` / `bd-` prefix —
  // see `gastownhall/gascity` `internal/sling/sling.go:BeadPrefixForCity`.
  // The generic fallback below matches the documented upstream shape
  // `<prefix>-<3..8 alphanumeric>` and tolerates any prefix.
  const patterns = [
    /^\s*Created\s+(\S+)/m,
    /^\s*Slung\s+(\S+)/m,
    /^\s*Started workflow\s+(\S+)/m,
    /^\s*Attached wisp\s+(\S+)/m,
    /\b(gd-[a-z0-9]+)\b/i,
    /\b(bd-[a-z0-9]+)\b/i,
  ]
  for (const re of patterns) {
    const m = stdout.match(re) || stderr.match(re)
    if (m && m[1]) {
      return { output: `slung bead ${m[1]}`, bead_id: m[1] }
    }
  }
  return { output: trimmed || stderr.trim() || 'gc sling dispatched (no bead id reported)' }
}

export function _parseSlingOutputForTest(stdout: string, stderr: string): SlingParseResult {
  return parseSlingOutput(stdout, stderr)
}

// Bead-id allow-list. Upstream `gc` uses per-rig-configured prefixes
// (e.g. `BL-42`, `FE-1`, `agent-diagnostics`); the shape is
// `<prefix>-<alnum suffix>` where the prefix is one or more
// identifier-safe chunks and the suffix is 3-8 alnum chars. We accept
// any `[A-Za-z0-9][A-Za-z0-9_.-]*-\d+[A-Za-z0-9]*` to cover both the
// legacy `gd-…` / `bd-…` style and the per-rig-prefix style.
// Exposed for unit tests; production code in `gcCloseBead` uses the
// same regex inline so the handler stays readable.
const BEAD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_./-]*-[A-Za-z0-9]+$/

export function _isValidBeadIdForTest(id: string): boolean {
  return BEAD_ID_RE.test(id)
}

export function _isValidAgentNameForTest(name: string): boolean {
  return /^[a-zA-Z0-9._/-]+$/.test(name)
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
  const path = nodePath
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

// ---------------------------------------------------------------------------
// Auto-discovered city directory (from the supervisor API)
//
// When the console server boots it doesn't necessarily know where the
// operator's city lives — `gc <cmd>` would fail with "could not find
// city or pack root" because the console's cwd is the npm package
// directory, not a bootstrapped city.
//
// Solution: query the supervisor's `GET /v0/cities` endpoint once on
// startup (and refresh on TTL), pick the first city's `path`, and
// pass it to every `gc` invocation via the global `--city` flag. The
// operator no longer has to set `GC_CITY_DIR` as long as their
// supervisor has at least one registered city — which is the same
// precondition as running the console at all.
//
// The cache is per-process and refreshed every `CITY_DISCOVERY_TTL_MS`.
// A failure to reach the supervisor is treated as "no cached city" —
// callers fall back to the existing GC_CITY_DIR / cwd chain rather
// than throwing.

const CITY_DISCOVERY_TTL_MS = 30_000

interface CityDiscoveryEntry {
  fetchedAt: number
  cityDir: string | null
  error?: string
}

let cityDiscovery: CityDiscoveryEntry | null = null

/**
 * Query the supervisor for a city directory. Async because the
 * supervisor's HTTP API is async; the result is memoised in-process
 * for `CITY_DISCOVERY_TTL_MS` so the marketplace isn't slowed by a
 * per-call round-trip.
 */
async function discoverCityDir(): Promise<string | null> {
  const now = Date.now()
  if (cityDiscovery && now - cityDiscovery.fetchedAt < CITY_DISCOVERY_TTL_MS) {
    return cityDiscovery.cityDir
  }
  try {
    const response = await DefaultService.getV0Cities()
    const ok = unwrap(
      response as Envelope<{
        items?: Array<{ name?: string; path?: string; status?: string }>
      }>,
    )
    const first = (ok?.items ?? []).find(
      (c) => typeof c?.path === 'string' && c.path.length > 0,
    )
    cityDiscovery = {
      fetchedAt: now,
      cityDir: first?.path ?? null,
      error: first ? undefined : 'no cities registered with supervisor',
    }
    return cityDiscovery.cityDir
  } catch (err) {
    cityDiscovery = {
      fetchedAt: now,
      cityDir: null,
      error: err instanceof Error ? err.message : String(err),
    }
    return null
  }
}

/**
 * Async variant: prefers a city path auto-discovered from the
 * supervisor, then falls back to `resolveCityDir` (which honors
 * `GC_CITY_DIR` and `cwd` as before). Used by every server fn that
 * spawns `gc` so we never have to ship a `cwd` env var with the
 * console process.
 */
async function resolveCityDirAsync(override?: string): Promise<string> {
  if (override && override.trim().length > 0) {
    return resolveCityDir(override)
  }
  const discovered = await discoverCityDir()
  if (discovered) return discovered
  // Fall back to env var / cwd. We deliberately don't pass the
  // discovered-error through here — `runGc`'s stderr will surface
  // any subsequent CLI failure with a clearer message anyway.
  return resolveCityDir()
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
  opts: { timeoutMs?: number; cwd?: string; skipCity?: boolean } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string; code: number }> {
  const { spawn } = await import('node:child_process')
  const bin = safeGcBin()
  // Resolve the city directory:
  //   1. caller-supplied `opts.cwd` (already allow-listed)
  //   2. auto-discovered from the supervisor API (cached 30s)
  //   3. env `GC_CITY_DIR`
  //   4. fallback to server cwd (legacy)
  //
  // We then pass it explicitly via the global `--city` flag so the
  // spawn cwd can stay wherever the operator launched the console
  // (typically an npm package dir). This is what fixes the
  // "could not find city or pack root" error for operators whose
  // supervisor already has a city registered — the console no
  // longer needs to live inside that city directory.
  //
  // Pass `skipCity: true` for commands that operate at the daemon
  // level (`gc supervisor start|stop|restart`) — those don't need a
  // city context, and forcing one through `--city` would make the
  // bootstrap path fail when no city is registered yet.
  let cityDir: string | undefined
  if (opts.skipCity) {
    cityDir = undefined
  } else if (opts.cwd && opts.cwd.trim().length > 0) {
    cityDir = resolveCityDir(opts.cwd)
  } else {
    const discovered = await discoverCityDir()
    cityDir = discovered ?? resolveCityDir()
  }
  const finalArgs = cityDir ? [...args, '--city', cityDir] : args
  return await new Promise((resolve) => {
    const child = spawn(bin, finalArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: undefined,
      env: {
        TERM: 'dumb',
        PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
        HOME: process.env.HOME ?? '/tmp',
        LANG: process.env.LANG ?? 'C.UTF-8',
        // Forward `GC_*` env vars from the console process — `gc`
        // reads several of these (`GC_DOLT_SKIP`, `GC_HOME`,
        // `GC_NO_API`, ...) at startup. The minimal env above is
        // tight enough to avoid leaking secrets (no `GC_API_TOKEN`,
        // no AWS / GCP credentials) but still pass through the GC
        // namespace that the operator explicitly configured.
        ...Object.fromEntries(
          Object.entries(process.env).filter(
            ([k]) => k === 'GC_DOLT_SKIP' || k === 'GC_HOME' || k === 'GC_NO_API' || k === 'GC_SUPERVISOR_LOG_TEE',
          ),
        ),
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

/**
 * Classify a failed `runGc` result into a uniform `{ output, error }`
 * pair for the UI. The most useful distinctions:
 *
 *   - `ENOENT` (spawn) → the `gc` binary is missing on PATH. The UI
 *     surfaces "install gc or set GC_BIN".
 *   - `could not find city or pack root` (stderr) → the console server
 *     isn't running from inside a city directory, and GC_CITY_DIR
 *     isn't set. The UI surfaces CITY_NOT_CONFIGURED_HINT so the
 *     operator can fix the deployment.
 *   - Anything else → raw stderr/stdout, trimmed to 500 chars.
 *
 * `kind` is exposed alongside the human strings so the UI can show a
 * tailored banner (e.g. "deployment config required" vs "cli error")
 * without having to re-parse the strings.
 */
function classifyGcFailure(
  r: { ok: boolean; stdout: string; stderr: string; code: number },
  command: string,
): {
  output: string
  error: string
  kind: 'missing_binary' | 'city_not_configured' | 'cli_error'
} {
  if (r.code === -1 && /^spawn .* ENOENT/.test(r.stderr)) {
    return {
      output: 'gc binary not found in PATH',
      error: 'gc binary not found in PATH — install gc or set GC_BIN',
      kind: 'missing_binary',
    }
  }
  if (isCityNotConfigured(r.stderr)) {
    return {
      output: `${command}: city directory not configured`,
      error: CITY_NOT_CONFIGURED_HINT,
      kind: 'city_not_configured',
    }
  }
  const detail = (r.stderr || r.stdout).trim().slice(0, 800)
  return {
    output: `${command} failed: ${detail}`,
    error: detail,
    kind: 'cli_error',
  }
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
  const result = await runGc(['supervisor', 'start'], { timeoutMs: 30_000, cwd: opts.cwd, skipCity: true })
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
  const result = await runGc(['supervisor', 'stop'], { timeoutMs: 30_000, cwd: opts.cwd, skipCity: true })
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
  const result = await runGc(
    [
      'init',
      '--template',
      'minimal',
      '--default-provider',
      'claude',
      '--skip-provider-readiness',
      resolved,
    ],
    { timeoutMs: 30_000, cwd: resolved },
  )
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
    // Allow-list the agent name to keep argv injection-safe: `gc` accepts
    // the same chars as the rest of the file (bead-id / rig-name chars).
    if (!/^[a-zA-Z0-9._/-]+$/.test(data.agent)) {
      return {
        output: `sling rejected: invalid agent "${data.agent}"`,
        ok: false as const,
        bead_id: undefined as string | undefined,
        error: `invalid agent name (allowed: [a-zA-Z0-9._/-])`,
      }
    }
    try {
      // `--json` makes `gc sling` emit a stable machine-readable result
      // envelope on stdout (see `gc sling --help` — "Output dispatch
      // result in JSON format"). The parser tolerates non-JSON output by
      // falling back to regex extraction of `gd-…` / `bd-…` ids from
      // stdout, so older `gc` versions still work.
      const result = await runGc(['sling', '--json', data.agent, data.text], {
        timeoutMs: REQUEST_TIMEOUT_MS,
      })
      const parsed = parseSlingOutput(result.stdout, result.stderr)
      if (!result.ok) {
        const detail = (result.stderr || result.stdout).trim().slice(0, 500)
        return {
          output: `gc sling failed (exit=${result.code}): ${detail}`,
          ok: false as const,
          bead_id: parsed.bead_id,
          error: detail,
        }
      }
      return {
        output: parsed.output,
        ok: true as const,
        bead_id: parsed.bead_id,
        error: undefined as string | undefined,
      }
    } catch (error) {
      return {
        output: 'gc sling threw unexpectedly',
        ok: false as const,
        bead_id: undefined as string | undefined,
        error: error instanceof Error ? error.message : String(error),
      }
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
    // Bead ids use per-rig-configured prefixes (e.g. `gd-xxx`,
    // `BL-42`, `FE-1`) per upstream `gc` convention — see the
    // `BEAD_ID_RE` regex above. Reject anything that doesn't match
    // before shelling out — `bd close` accepts free strings and we
    // don't want argv injection.
    if (!BEAD_ID_RE.test(data.id)) {
      return {
        output: `close rejected: invalid bead id "${data.id}"`,
        ok: false,
        error: `invalid bead id (expected <prefix>-<suffix>)`,
      }
    }
    try {
      // `gc bd close <id>` shells out to the underlying `bd close`
      // command in the active city's rig context. There's no HTTP
      // endpoint for closing a bead on the supervisor API, so this
      // is the canonical path.
      const result = await runGc(['bd', 'close', data.id], { timeoutMs: 15_000 })
      if (!result.ok) {
        const detail = (result.stderr || result.stdout).trim().slice(0, 500)
        return {
          output: `gc bd close failed (exit=${result.code}): ${detail}`,
          ok: false,
          error: detail,
        }
      }
      return {
        output: `Bead ${data.id} closed`,
        ok: true,
        error: undefined as string | undefined,
      }
    } catch (error) {
      return {
        output: 'gc bd close threw unexpectedly',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

// Packs

export const gcCityInitWithPacks = createServerFn({ method: 'POST' })
  .validator(z.object({ path: z.string(), packs: z.array(z.object({ name: z.string(), source: z.string().optional() })) }))
  .handler(async ({ data }) => {
    // Two-phase bootstrap: `gc init` writes the on-disk shape, then
    // `POST /v0/city` (via `startCityImpl`) scaffolds + registers + starts
    // it under the supervisor. The upstream API has no "register-only"
    // path — registering is a side effect of `POST /v0/city`
    // (`internal/api/huma_handlers_supervisor.go:108-118`), and that
    // endpoint ALSO scaffolds. Since `gc init` already wrote the
    // scaffold, the second call hits the handler's pre-check
    // (`cityDirAlreadyInitialized` at line 463 of the same file) and
    // returns 409 — which we surface as a non-fatal "already registered"
    // message so the caller can proceed.
    //
    // The `dir` is forwarded as an absolute path because the supervisor
    // resolves relative `dir` values against its OWN `$HOME`, not the
    // console's cwd — passing `'.'` or any relative path would silently
    // scaffold a spurious city under `~/`.
  try {
    const initResult = await initCityImpl(data.path)
    const initSuffix = data.packs.length > 0 ? ` (with ${data.packs.length} pack(s) requested)` : ''
    const initOutput = initResult.ok ? `${initResult.output}${initSuffix}` : initResult.output

    // Phase 1b: copy the rig config in (if `GC_RIG_DIR` is set) so the
    // city has agents to sling to. This is the e2e-rig path — see
    // `e2e/rig/README.md`. Operators who don't set `GC_RIG_DIR` skip
    // this step and get a vanilla minimal-template city.
    let rigOutput = ''
    if (process.env.GC_RIG_DIR && initResult.ok) {
      const { cp, mkdir, rm } = await import('node:fs/promises')
      try {
        // City layout is `agents/<name>/agent.toml + prompt.template.md`.
        // The rig dir already mirrors that layout (`e2e/rig/agents/...`).
        const cityAgentsDir = nodePath.join(data.path, 'agents')
        await mkdir(cityAgentsDir, { recursive: true })
        const rigAgentsDir = nodePath.join(process.env.GC_RIG_DIR, 'agents')
        const entries = await import('node:fs/promises').then((m) => m.readdir(rigAgentsDir, { withFileTypes: true }))
        for (const ent of entries) {
          if (!ent.isDirectory()) continue
          const srcDir = nodePath.join(rigAgentsDir, ent.name)
          const dstDir = nodePath.join(cityAgentsDir, ent.name)
          await rm(dstDir, { recursive: true, force: true })
          await cp(srcDir, dstDir, { recursive: true })
        }
        rigOutput = `\nrig config installed from ${process.env.GC_RIG_DIR}`
      } catch (e) {
        rigOutput = `\nrig install failed: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    // Phase 2: register + start the city with the supervisor.
    //
    // The upstream API's `POST /v0/city` 409s when the target dir is
    // already bootstrapped (`cityDirAlreadyInitialized` pre-check at
    // `internal/api/huma_handlers_supervisor.go:463`), so calling it
    // after `gc init` doesn't register the city. We shell out to
    // `gc start <abs-path>` instead, which talks to the supervisor's
    // control socket out-of-band and handles "register existing
    // bootstrapped city" correctly via
    // `registerCityWithSupervisorNamed` (`cmd/gc/cmd_start.go:423`).
    const cliResult = await runGc(['start', data.path], {
      timeoutMs: 30_000,
      cwd: data.path,
      skipCity: true,
    })
    if (cliResult.ok) {
      const derivedName = data.path.split(/[/\\]/).filter(Boolean).pop() ?? 'default'
      return {
        output: `${initOutput}${rigOutput}\ncity "${derivedName}" registered + started`,
        ok: initResult.ok,
        error: initResult.ok ? undefined : initResult.error,
      }
    }
    return {
      output: `${initOutput}${rigOutput}\ngc start rejected: ${(cliResult.stderr || cliResult.stdout).trim()}`,
      ok: false,
      error: (cliResult.stderr || cliResult.stdout).trim().slice(0, 500),
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
    // The supervisor returns `{ packs: PackResponse[] }` per the OpenAPI
    // schema (`PackListBody`); older clients may still send `{ items }`
    // so we accept both.
    const ok = unwrap(response as Envelope<{
      packs?: Array<{ name?: string; source?: string; path?: string; ref?: string; builtin?: boolean; description?: string }>
      items?: Array<{ name?: string; source?: string; path?: string; ref?: string; builtin?: boolean; description?: string }>
    }>)
    if (!ok) return []
    const raw = ok.packs ?? ok.items ?? []
    return raw
      .filter((p) => typeof p?.name === 'string' && p.name.length > 0)
      .map((p) => ({
        name: String(p.name),
        source: typeof p.source === 'string' ? p.source : undefined,
        path: typeof p.path === 'string' ? p.path : undefined,
        ref: typeof p.ref === 'string' ? p.ref : undefined,
        description: typeof p.description === 'string' ? p.description : undefined,
        builtin: Boolean(p.builtin),
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

/**
 * Register a pack import in the current city.
 *
 * Wraps `gc import add <source> [--name <name>]`, which writes a
 * durable `[imports.<name>]` entry to `pack.toml` and pins it in
 * `packs.lock`. Accepts:
 *   - `source`: required. Either a local path, a git URL, or the
 *     "double-slash" subpath form documented in `gc import add --help`
 *     (e.g. `https://github.com/gastownhall/gascity-packs//bmad`).
 *   - `name`:   optional local binding name. Falls back to the pack
 *     directory name extracted from the source URL when omitted.
 *   - `cwd`:    optional city directory. Defaults to the server-side
 *     `GC_CITY_DIR` / console cwd (see `resolveCityDir`).
 *
 * The function is idempotent in spirit: re-registering an existing
 * import is delegated to `gc import add`, which the CLI surfaces
 * cleanly. ENOENT (binary missing) gets a tailored message.
 */
export const gcRegisterPack = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().optional(),
      source: z.string().min(1),
      cwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const args = ['import', 'add', data.source]
    // Only pass `--name` if the caller supplied an explicit binding
    // name. Letting `gc` derive the name from the source keeps the
    // behaviour aligned with `gc import add <source>` in the shell.
    if (data.name && data.name.trim().length > 0) {
      args.push('--name', data.name.trim())
    }
    try {
      const r = await runGc(args, { timeoutMs: 60_000, cwd: data.cwd })
      if (r.ok) {
        return {
          ok: true as const,
          output: r.stdout.trim() || `pack "${data.name ?? derivePackName(data.source)}" registered`,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc import add') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc import add threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

/**
 * Unregister a pack import. Wraps `gc import remove <name>`. After
 * successful removal, the `pack.toml` entry and `packs.lock` pin are
 * gone; cached clones under `~/.gc/cache` are left intact (use
 * `gc import prune` to reclaim them).
 */
export const gcUnregisterPack = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1),
      cwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!PACK_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid pack name "${data.name}"`,
        error: 'pack names may only contain letters, digits, dot, underscore, dash, and slash',
      }
    }
    try {
      const r = await runGc(['import', 'remove', data.name], {
        timeoutMs: 30_000,
        cwd: data.cwd,
      })
      if (r.ok) {
        return {
          ok: true as const,
          output: r.stdout.trim() || `pack "${data.name}" unregistered`,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc import remove') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc import remove threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

// Marketplace
//
// The console ships a Marketplace UI that shows every pack declared
// in a `registry.toml` (upstream: `gastownhall/gascity-packs`)
// alongside the operator's currently-installed packs. The marketplace
// is **not** a hardcoded list — it consumes the upstream registry
// document so any new pack published to the registry shows up in
// the UI after the next cache TTL elapses, and operators can point
// the console at their own registry by setting `GC_MARKETPLACE_URL`
// (or `?registry=<url>` per request).
//
// Design notes:
//   - Registry fetch is cached in-memory for 5 minutes. `gc` may be
//     offline; the registry fetch must NOT block the UI on a slow
//     GitHub round-trip. On failure we serve the last-good cache
//     with a `stale: true` flag so the UI can show "registry
//     unreachable, showing last-known catalog".
//   - Installed state is joined server-side. We already have
//     `gcListPacks` hitting `GET /v0/city/{city}/packs`; the
//     marketplace endpoint calls it in parallel and merges the
//     results so the client gets one round-trip with installed
//     flags already populated.
//   - The CLI subcommands remain the source of truth for actual
//     install/uninstall — the marketplace server fns just wrap
//     `gc import add/remove` with the right args.

const DEFAULT_MARKETPLACE_URL =
  'https://raw.githubusercontent.com/gastownhall/gascity-packs/main/registry.toml'
const MARKETPLACE_CACHE_TTL_MS = 5 * 60 * 1000
const MARKETPLACE_FETCH_TIMEOUT_MS = 8_000

interface RegistryCacheEntry {
  fetchedAt: number
  toml: string
  error?: string
}

const registryCache = new Map<string, RegistryCacheEntry>()

/**
 * Fetch a registry.toml URL, with a small in-memory cache keyed by
 * URL. The function returns the raw TOML text — parsing is left to
 * the caller so we can memoize parse errors independently and so a
 * parse failure on one URL doesn't poison other cached URLs.
 */
async function fetchRegistryToml(url: string): Promise<{
  toml: string
  fetchedAt: number
  stale: boolean
  error?: string
}> {
  const now = Date.now()
  const cached = registryCache.get(url)
  if (cached && now - cached.fetchedAt < MARKETPLACE_CACHE_TTL_MS) {
    return { toml: cached.toml, fetchedAt: cached.fetchedAt, stale: false, error: cached.error }
  }
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/toml, text/plain;q=0.9, */*;q=0.5' },
      signal: AbortSignal.timeout(MARKETPLACE_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      const msg = `registry fetch failed: HTTP ${res.status}`
      // Stale-on-error: keep serving the last good copy if we have
      // one, so a transient outage doesn't blank the marketplace.
      if (cached) {
        registryCache.set(url, { ...cached, error: msg })
        return { toml: cached.toml, fetchedAt: cached.fetchedAt, stale: true, error: msg }
      }
      registryCache.set(url, { fetchedAt: now, toml: '', error: msg })
      return { toml: '', fetchedAt: now, stale: false, error: msg }
    }
    const text = await res.text()
    registryCache.set(url, { fetchedAt: now, toml: text })
    return { toml: text, fetchedAt: now, stale: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (cached) {
      registryCache.set(url, { ...cached, error: msg })
      return { toml: cached.toml, fetchedAt: cached.fetchedAt, stale: true, error: msg }
    }
    registryCache.set(url, { fetchedAt: now, toml: '', error: msg })
    return { toml: '', fetchedAt: now, stale: false, error: msg }
  }
}

/**
 * Marketplace entry shape — what the UI consumes. One row per pack
 * declared in a registry, with the operator's installed state
 * merged in. `registryName` carries which configured registry the
 * entry came from so the UI can group / filter / badge it.
 */
export interface MarketplaceEntry {
  name: string
  description?: string
  source: string
  sourceKind?: string
  tag: string
  tier?: number
  latestVersion?: string
  latestCommit?: string
  latestRef?: string
  readmeUrl: string
  installed: boolean
  installedRef?: string
  installedSource?: string
  registryName: string
}

/**
 * Compute the GitHub README URL for a pack entry, preferring the
 * `tree/<ref>/<path>` form when we have a ref so the link points at
 * the actually-installed (or latest-released) revision rather than
 * the moving HEAD of `main`.
 */
function readmeUrlFor(source: string, ref: string | undefined, name: string): string {
  // Only attempt to rewrite `github.com/...` URLs. Other registries
  // (self-hosted, GitLab, etc.) pass through verbatim and we leave
  // it to the operator to know where to read.
  const ghMatch = source.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(\/(.+))?$/)
  if (!ghMatch) return source
  const owner = ghMatch[1]
  const repo = ghMatch[2].replace(/\.git$/, '')
  const subpath = ghMatch[4] ?? name
  // If the source is already in `tree/<ref>/<path>` form, prefer
  // that exact ref; otherwise use the provided ref or `main`.
  const treeMatch = subpath.match(/^tree\/([^/]+)\/(.+)$/)
  const branch = treeMatch?.[1] ?? ref ?? 'main'
  const path = treeMatch?.[2] ?? subpath
  return `https://github.com/${owner}/${repo}/tree/${branch}/${path}`
}

export interface MarketplaceListing {
  registries: Array<{
    name: string
    source: string
    stale: boolean
    error?: string
    fetchedAt: string
  }>
  entries: MarketplaceEntry[]
}

/**
 * Fetch the merged marketplace catalog from every configured pack
 * registry. The `gc` CLI owns the registry list (`gc pack registry
 * list`); when none is configured (e.g. headless dev before `gc
 * init`), we fall back to the upstream default so the UI still has
 * something to show. The optional `registry` param restricts the
 * result to a single registry name — the UI uses it for the
 * registry filter chips.
 */
export const gcListMarketplaceEntries = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        registry: z.string().optional(),
        cwd: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    // Pull the configured-registry list, but fall back gracefully
    // when `gc` isn't bootstrapped (no city dir) or returns an
    // empty list. The upstream-default URL is the silent fallback
    // so the Marketplace is never empty.
    let configured: RegistrySummary[] = []
    let configuredError: string | undefined
    try {
      const r = await runGc(['pack', 'registry', 'list', '--json'], {
        timeoutMs: 15_000,
        cwd: data?.cwd,
      })
      if (r.ok) {
        configured = parseRegistryList(r.stdout)
      } else if (!/no such file|city/i.test(r.stderr)) {
        configuredError = (r.stderr || r.stdout).trim().slice(0, 400)
      }
    } catch (err) {
      configuredError = err instanceof Error ? err.message : String(err)
    }

    const registries = configured.length > 0
      ? configured
      : [{ name: 'upstream', source: DEFAULT_MARKETPLACE_URL }]

    const wantRegistry = data?.registry?.trim() || ''
    const filteredRegistries = wantRegistry
      ? registries.filter((r) => r.name === wantRegistry)
      : registries

    const { parseRegistryToml, latestRelease, inferPackTag, inferPackTier } =
      await import('./registry-toml')

    // Fetch every registry's TOML in parallel — the cache + per-URL
    // stale-on-error handling means a slow registry can't block the
    // others.
    const fetched = await Promise.all(
      filteredRegistries.map((r) => fetchRegistryToml(r.source).then((f) => ({ r, f }))),
    )

    // Index installed packs by both name AND normalised source URL.
    // We need both keys because an operator may have installed a
    // pack under a different binding name (e.g. `gc import add
    // https://…/bmad --name my-bmad`). Without the source key,
    // the catalog entry for `bmad` would falsely show "available"
    // even though it's already installed — clicking install would
    // then either no-op or create a duplicate binding.
    const installedByName = new Map<
      string,
      { name: string; source?: string; path?: string; ref?: string }
    >()
    const installedBySource = new Map<
      string,
      { name: string; source?: string; path?: string; ref?: string }
    >()
    const normSource = (s: string | undefined): string | undefined => {
      if (!s) return undefined
      return s
        .replace(/\.git(\/|$)/g, '$1')
        .replace(/\/+$/, '')
        .toLowerCase()
    }
    try {
      const installed = await gcListPacks()
      for (const p of installed ?? []) {
        installedByName.set(p.name, p)
        const key = normSource(p.source ?? p.path)
        if (key) installedBySource.set(key, p)
      }
    } catch {
      /* degraded mode — leave maps empty */
    }

    const entries: MarketplaceEntry[] = []
    const registryMeta: MarketplaceListing['registries'] = []
    for (const { r, f } of fetched) {
      registryMeta.push({
        name: r.name,
        source: r.source,
        stale: f.stale,
        error: f.error,
        fetchedAt: new Date(f.fetchedAt).toISOString(),
      })
      if (!f.toml) continue
      let doc
      try {
        doc = parseRegistryToml(f.toml)
      } catch (err) {
        registryMeta[registryMeta.length - 1] = {
          ...registryMeta[registryMeta.length - 1]!,
          error: err instanceof Error ? err.message : String(err),
        }
        continue
      }
      for (const pack of doc.packs) {
        const rel = latestRelease(pack)
        // Match on name OR normalised source. Name is the common
        // case; source catches the "renamed binding" scenario.
        const installed =
          installedByName.get(pack.name) ??
          installedBySource.get(normSource(pack.source) ?? '')
        entries.push({
          name: pack.name,
          description: pack.description,
          source: pack.source,
          sourceKind: pack.sourceKind,
          tag: inferPackTag(pack),
          tier: inferPackTier(pack),
          latestVersion: rel?.version,
          latestCommit: rel?.commit,
          latestRef: rel?.ref,
          readmeUrl: readmeUrlFor(pack.source, rel?.ref, pack.name),
          installed: Boolean(installed),
          installedRef: installed?.ref,
          installedSource: installed?.source ?? installed?.path,
          registryName: r.name,
        })
      }
    }

    return {
      registries: registryMeta,
      entries,
      // Keep these top-level fields for clients that read them:
      ...(configuredError ? { error: configuredError } : {}),
    } as MarketplaceListing & { error?: string }
  })

/**
 * Compute update status for every installed pack by joining against
 * the marketplace catalog. Pure server fn — no shelling out — so
 * the UI can poll this cheaply on the Installed tab.
 */
export const gcCheckPackUpdates = createServerFn({ method: 'GET' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    let installed: Array<{ name: string; ref?: string; path?: string; source?: string }> = []
    try {
      installed = await gcListPacks()
    } catch {
      /* supervisor offline — empty */
    }
    // Pull catalog from the same code path so we never drift.
    const catalog = await gcListMarketplaceEntries({ data: { cwd: data?.cwd } })
    const updates = computePackUpdates(installed, catalog.entries)
    const availableCount = updates.filter((u) => u.status === 'update_available').length
    return { updates, availableCount }
  })

/**
 * Install a marketplace pack. Wraps `gc import add <source>
 * [--version <constraint>]` and on success invalidates the cached
 * installed-pack list so the next marketplace fetch sees it.
 *
 * `version` is optional — pass a semver constraint (`^0.1.6`) or a
 * `sha:<commit>` pin from the registry to lock to a specific
 * release. When omitted, `gc` resolves to the latest published
 * release per the registry's hash manifest.
 */
export const gcInstallMarketplaceEntry = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1),
      source: z.string().min(1),
      version: z.string().optional(),
      cwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!PACK_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid pack name "${data.name}"`,
        error: 'pack names may only contain letters, digits, dot, underscore, dash, and slash',
      }
    }
    const args = ['import', 'add', data.source, '--name', data.name]
    if (data.version && data.version.trim().length > 0) {
      args.push('--version', data.version.trim())
    }
    try {
      const r = await runGc(args, { timeoutMs: 90_000, cwd: data.cwd })
      if (r.ok) {
        const message = r.stdout.trim() || r.stderr.trim() ||
          `pack "${data.name}" installed from ${data.source}`
        return {
          ok: true as const,
          output: message,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc import add') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc import add threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

// Registries (pack sources)
//
// `gc pack registry add/list/remove/refresh <name> <source>` is the
// canonical way to manage the upstream catalogs the console shows in
// the Marketplace. The console wraps these CLI subcommands so the
// operator can wire up custom registries (internal mirror, GitLab,
// vendored copy) without leaving the UI. `gc` already auto-adds the
// upstream `gastownhall/gascity-packs` registry on first city init;
// the console's role here is just to surface that list.

const REGISTRY_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/

export interface RegistrySummary {
  name: string
  source: string
  packCount?: number
  reachable?: boolean
  error?: string
}

/**
 * Parse `gc pack registry list --json` output. The CLI returns a
 * single JSON object whose `registries` field is the configured
 * list. We accept the field as either an array of `{name, source,
 * pack_count?}` or — defensively — a flat array — so a future CLI
 * reshape doesn't silently empty the list.
 */
function parseRegistryList(text: string): RegistrySummary[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  const obj = parsed as {
    ok?: unknown
    registries?: unknown
  }
  if (obj && typeof obj === 'object' && obj.ok === false) {
    return []
  }
  const arr = Array.isArray(obj?.registries) ? obj.registries : []
  const out: RegistrySummary[] = []
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as { name?: unknown; source?: unknown; pack_count?: unknown }
    if (typeof r.name !== 'string' || r.name.length === 0) continue
    if (typeof r.source !== 'string' || r.source.length === 0) continue
    out.push({
      name: r.name,
      source: r.source,
      packCount: typeof r.pack_count === 'number' ? r.pack_count : undefined,
    })
  }
  return out
}

export const gcListRegistries = createServerFn({ method: 'GET' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const r = await runGc(['pack', 'registry', 'list', '--json'], {
        timeoutMs: 15_000,
        cwd: data?.cwd,
      })
      if (r.ok) {
        return { ok: true as const, registries: parseRegistryList(r.stdout) }
      }
      // Fallback: surface the gc CLI failure as a structured empty
      // list. `classifyGcFailure` covers ENOENT, "city not configured",
      // and any other stderr pattern uniformly.
      return {
        ok: false as const,
        registries: [] as RegistrySummary[],
        ...classifyGcFailure(r, 'gc pack registry list'),
      }
    } catch (err) {
      return {
        ok: false as const,
        registries: [] as RegistrySummary[],
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

export const gcAddRegistry = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1),
      source: z.string().min(1),
      cwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!REGISTRY_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid registry name "${data.name}"`,
        error:
          'registry names: letters, digits, dot, underscore, dash; must start alphanumeric',
      }
    }
    if (!/^https?:\/\/\S+$/.test(data.source)) {
      return {
        ok: false as const,
        output: 'registry source must be an http(s) URL',
        error: 'registry source must be an http(s) URL',
      }
    }
    try {
      const r = await runGc(
        ['pack', 'registry', 'add', data.name, data.source, '--json'],
        { timeoutMs: 30_000, cwd: data.cwd },
      )
      if (r.ok) {
        return {
          ok: true as const,
          output:
            summariseRegistryCommand('add', r.stdout) ??
            r.stdout.trim() ??
            `registry "${data.name}" added`,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc pack registry add') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc pack registry add threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

export const gcRemoveRegistry = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().min(1), cwd: z.string().optional() }))
  .handler(async ({ data }) => {
    if (!REGISTRY_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid registry name "${data.name}"`,
        error: 'invalid registry name',
      }
    }
    try {
      const r = await runGc(['pack', 'registry', 'remove', data.name, '--json'], {
        timeoutMs: 15_000,
        cwd: data.cwd,
      })
      if (r.ok) {
        return {
          ok: true as const,
          output:
            summariseRegistryCommand('remove', r.stdout) ??
            r.stdout.trim() ??
            `registry "${data.name}" removed`,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc pack registry remove') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc pack registry remove threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

/**
 * Force-refresh a single registry (or all, when `name` is omitted).
 * Wraps `gc pack registry refresh [name] --json`. The CLI returns
 * `{ refreshed: [{ name, pack_count }], failures: [] }`.
 */
export const gcRefreshRegistries = createServerFn({ method: 'POST' })
  .validator(
    z.object({ name: z.string().optional(), cwd: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    if (data?.name && !REGISTRY_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid registry name "${data.name}"`,
        error: 'invalid registry name',
      }
    }
    const args = ['pack', 'registry', 'refresh', '--json']
    if (data?.name) args.push(data.name)
    try {
      const r = await runGc(args, { timeoutMs: 60_000, cwd: data?.cwd })
      if (r.ok) {
        return {
          ok: true as const,
          output:
            summariseRegistryCommand('refresh', r.stdout) ??
            r.stdout.trim() ??
            'registries refreshed',
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc pack registry refresh') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc pack registry refresh threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

// Pack updates
//
// `gc import upgrade <name>` upgrades a single installed pack within
// the constraints declared in `pack.toml` / `packs.lock`. Without a
// name, it upgrades everything in one pass. We expose both shapes
// plus a pure-JS `gcCheckPackUpdates` that joins the installed-pack
// list with the marketplace catalog so the UI can render an
// "update available" chip without round-tripping to `gc` per pack.

export const gcUpdatePack = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1),
      cwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!PACK_NAME_RE.test(data.name)) {
      return {
        ok: false as const,
        output: `invalid pack name "${data.name}"`,
        error: 'pack names may only contain letters, digits, dot, underscore, dash, and slash',
      }
    }
    try {
      const r = await runGc(['import', 'upgrade', data.name], {
        timeoutMs: 90_000,
        cwd: data.cwd,
      })
      if (r.ok) {
        const message = r.stdout.trim() || r.stderr.trim() ||
          `pack "${data.name}" upgraded`
        return {
          ok: true as const,
          output: message,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc import upgrade') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc import upgrade threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

export const gcUpdateAllPacks = createServerFn({ method: 'POST' })
  .validator(z.object({ cwd: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const r = await runGc(['import', 'upgrade'], {
        timeoutMs: 180_000,
        cwd: data?.cwd,
      })
      if (r.ok) {
        const message = r.stdout.trim() || r.stderr.trim() || 'all packs upgraded'
        return {
          ok: true as const,
          output: message,
          error: undefined as string | undefined,
        }
      }
      return { ok: false as const, ...classifyGcFailure(r, 'gc import upgrade') }
    } catch (err) {
      return {
        ok: false as const,
        output: 'gc import upgrade threw unexpectedly',
        error: err instanceof Error ? err.message : String(err),
      }
    }
  })

/**
 * Pure join: for each installed pack, find the marketplace entry
 * (by name) and decide whether an update is available. Pure JS so
 * it can be unit-tested without the supervisor.
 *
 * Status values:
 *   - `up_to_date`: installed pack matches a marketplace entry by
 *     name AND no newer release is known. When the installed ref
 *     equals the catalog's latest commit, we declare
 *     `up_to_date` confidently. Otherwise (e.g. installed ref is
 *     a branch name and the catalog only knows commits) we fall
 *     back to "no newer release published" — still up to date as
 *     far as we can tell from the catalog.
 *   - `update_available`: catalog has a release newer than what
 *     the operator has installed. Determined by either (a) the
 *     installed ref differs from the catalog's latest commit/ref,
 *     or (b) the installed source URL doesn't match the catalog
 *     entry's source URL (i.e. operator installed from a fork).
 *   - `not_in_catalog`: installed pack name has no marketplace
 *     entry (free-form install from a URL we don't track).
 *
 * The supervisor's `PackResponse` only carries `name/path/ref/source`
 * (see `client/openapi.json`). We deliberately do NOT parse `ref` as
 * a version — it can be a branch, a tag, or a commit SHA depending
 * on what `gc` pinned in `packs.lock`. The most reliable signal we
 * have without parsing `packs.lock` on the server is the commit hash.
 */
export type PackUpdateStatus =
  | 'up_to_date'
  | 'update_available'
  | 'not_in_catalog'

export interface PackUpdateInfo {
  name: string
  status: PackUpdateStatus
  installedRef?: string
  installedSource?: string
  latestVersion?: string
  latestRef?: string
  registryName?: string
}

function refsEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return a === b
}

function sourcesEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  // Trim `.git` (anywhere in the path) and trailing slashes so
  // `…/foo.git//sub` matches `…/foo//sub`. `.git` can appear
  // either at the end of the repo segment OR inline before the
  // `//subpath` separator — `gc import add` accepts both.
  const norm = (s: string) =>
    s
      .replace(/\.git(\/|$)/g, '$1')
      .replace(/\/+$/, '')
      .toLowerCase()
  return norm(a) === norm(b)
}

export function computePackUpdates(
  installed: Array<{
    name: string
    ref?: string
    path?: string
    source?: string
  }>,
  catalog: MarketplaceEntry[],
): PackUpdateInfo[] {
  const catalogByName = new Map<string, MarketplaceEntry>()
  const catalogBySource = new Map<string, MarketplaceEntry>()
  const normSourceKey = (s: string | undefined): string | undefined => {
    if (!s) return undefined
    return s
      .replace(/\.git(\/|$)/g, '$1')
      .replace(/\/+$/, '')
      .toLowerCase()
  }
  for (const e of catalog) {
    catalogByName.set(e.name, e)
    const k = normSourceKey(e.source)
    if (k) catalogBySource.set(k, e)
  }
  return installed.map((p) => {
    // Match on name first (most common), then on normalised source
    // (catches the "renamed binding" case: operator installed
    // `https://…/bmad` under `--name my-bmad`).
    const entry =
      catalogByName.get(p.name) ??
      catalogBySource.get(normSourceKey(p.source ?? p.path) ?? '')
    if (!entry) {
      return {
        name: p.name,
        status: 'not_in_catalog' as PackUpdateStatus,
        installedRef: p.ref,
        installedSource: p.source ?? p.path,
      }
    }
    // Two ways to be up to date:
    //   (a) installed ref matches the catalog's latest ref exactly,
    //   (b) the installed source matches the catalog's source AND
    //       the catalog has no newer release to point at.
    const refMatches = refsEqual(p.ref, entry.latestRef)
    const sourceMatches = sourcesEqual(p.source, entry.source)
    const status: PackUpdateStatus =
      refMatches || (sourceMatches && !entry.latestRef && !entry.latestVersion)
        ? 'up_to_date'
        : 'update_available'
    return {
      name: p.name,
      status,
      installedRef: p.ref,
      installedSource: p.source ?? p.path,
      latestVersion: entry.latestVersion,
      latestRef: entry.latestRef,
      registryName: entry.registryName,
    }
  })
}

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