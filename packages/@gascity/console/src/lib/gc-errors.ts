/**
 * Error classification helpers for the Gas City API client surface.
 *
 * When the `gc` supervisor is offline (operator hasn't started it yet, or
 * it crashed), every `DefaultService.*` call rejects with an Axios-shaped
 * error whose `code` is one of Node's network failure codes
 * (`ECONNREFUSED`, `ENOTFOUND`, …). These are **expected** runtime state,
 * not bugs in our code, and the console degrades to empty results.
 *
 * Without filtering, dev servers flood stderr with 50-line axios stack
 * traces on every page load. Use `silentIfOffline(err)` as a guard around
 * any `console.error` for a failed GC call — only log if the error is
 * something we genuinely want to know about (5xx body, parse failure,
 * unexpected TypeError).
 */

// Codes that mean "the supervisor is unreachable / not responding".
// Sourced from Node's `net`, `dns`, and axios's normalized error codes.
const SILENT_NET_CODES = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EPIPE',
    'ERR_CANCELED',
    'ABORTED',
])

/**
 * Returns `true` when the error should be treated as "the GC supervisor
 * is offline" and silently swallowed by callers. Returns `false` for
 * anything that might be a real bug we want to investigate.
 *
 * Recurses into `cause` because axios nests the underlying network error
 * under the top-level request error.
 */
export function silentIfOffline(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && SILENT_NET_CODES.has(code)) return true
    const cause = (error as { cause?: unknown }).cause
    if (cause && cause !== error) return silentIfOffline(cause)
    return false
}
