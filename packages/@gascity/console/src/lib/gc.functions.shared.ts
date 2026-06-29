/**
 * Shared utilities and constants for GC server functions.
 */

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

export const CITY = 'default'

export type Envelope<T> = T | { detail?: string }

export function unwrap<T>(response: Envelope<T>): T | null {
  if (response && typeof response === 'object' && 'detail' in response && (response as { detail?: unknown }).detail) {
    return null
  }
  return response as T
}

// tmux constants
export const TMUX_BIN_RE = /^[a-zA-Z0-9_./-]+$/
export const SESSION_NAME_RE = /^[a-zA-Z0-9_.-]{1,64}$/
export const SHELL_BIN_RE = /^[a-zA-Z0-9_./-]+$/

export function safeTmuxBin(): string {
  const bin = process.env.TMUX_BIN ?? 'tmux'
  if (!TMUX_BIN_RE.test(bin)) {
    throw new Error(`invalid TMUX_BIN env (${bin})`)
  }
  return bin
}

export async function runTmux(
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
