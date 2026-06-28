/**
 * Human-readable summary for `gc pack registry …` JSON envelopes.
 *
 * `gc` emits its CLI results as JSON envelopes on stdout. Surfacing
 * the raw envelope in the console's status banner is noise — the
 * operator cares about "which registries were refreshed" or "did the
 * prune run", not the schema_version. This module detects the
 * envelope shapes we know about and renders one-line summaries.
 *
 * Unknown / non-JSON input is returned verbatim (trimmed) so we
 * never lose information — the operator still sees what `gc` said.
 */

interface JsonObject {
  [k: string]: unknown
}

function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tryParseJson(text: string): JsonObject | null {
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed[0] !== '{') return null
  try {
    const v: unknown = JSON.parse(trimmed)
    return isJsonObject(v) ? v : null
  } catch {
    return null
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/**
 * `gc pack registry refresh [name] --json` envelope:
 *   { ok, refreshed: [{name, pack_count}], failures: [{name, error?}],
 *     pruned_caches: boolean, target?: string }
 *
 * Example:
 *   { "ok": true, "refreshed": [{"name": "main", "pack_count": 11}],
 *     "failures": [], "pruned_caches": true }
 *
 *   → "refreshed 1 registry (11 packs); pruned cache"
 */
function summariseRefresh(obj: JsonObject, raw: string): string | null {
  const refreshed = Array.isArray(obj.refreshed) ? obj.refreshed : null
  if (!refreshed) return null
  const failures = Array.isArray(obj.failures) ? obj.failures : []
  const refreshedCount = refreshed.length
  const totalPacks = refreshed.reduce(
    (acc: number, r: unknown) =>
      acc + (asNumber(isJsonObject(r) ? r.pack_count : undefined) ?? 0),
    0,
  )
  const pruned = obj.pruned_caches === true
  const failureCount = failures.length
  const target = asString(obj.target)
  const pieces: string[] = []
  const scope = target ? `registry "${target}"` : `${refreshedCount} ${refreshedCount === 1 ? 'registry' : 'registries'}`
  pieces.push(
    refreshedCount > 0
      ? `refreshed ${scope}${totalPacks > 0 ? ` (${totalPacks} pack${totalPacks === 1 ? '' : 's'})` : ''}`
      : `refreshed ${scope} (no changes)`,
  )
  if (failureCount > 0) {
    pieces.push(`${failureCount} failure${failureCount === 1 ? '' : 's'}`)
  }
  if (pruned) pieces.push('pruned cache')
  return pieces.join('; ')
}

/**
 * `gc pack registry add <name> <source> --json` envelope:
 *   { ok, name, source, cached, validated }
 *
 * Example:
 *   { "ok": true, "name": "internal", "source": "https://…/registry.toml",
 *     "cached": false, "validated": false }
 *   → 'registry "internal" added'
 */
function summariseAdd(obj: JsonObject, raw: string): string | null {
  const name = asString(obj.name)
  if (!name) return null
  const cached = obj.cached === true
  if (cached) return `registry "${name}" already configured`
  return `registry "${name}" added`
}

/**
 * `gc pack registry remove <name> --json` envelope:
 *   { ok, name, removed }
 *
 * Example:
 *   { "ok": true, "name": "internal", "removed": true }
 *   → 'registry "internal" removed'
 */
function summariseRemove(obj: JsonObject, raw: string): string | null {
  const name = asString(obj.name)
  if (!name) return null
  if (obj.removed === false) return `registry "${name}" not removed`
  return `registry "${name}" removed`
}

/**
 * Pick a summary line from the stdout produced by one of the
 * `gc pack registry …` subcommands. Returns `null` if the text
 * doesn't look like a recognised envelope — callers should fall
 * back to the raw output then.
 */
export function summariseRegistryCommand(
  subcommand: 'refresh' | 'add' | 'remove',
  stdout: string,
): string | null {
  const obj = tryParseJson(stdout)
  if (!obj) return null
  switch (subcommand) {
    case 'refresh':
      return summariseRefresh(obj, stdout)
    case 'add':
      return summariseAdd(obj, stdout)
    case 'remove':
      return summariseRemove(obj, stdout)
  }
}
