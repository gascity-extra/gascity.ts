/**
 * Pack name validation + name-from-source helpers used by the
 * `gc import add/remove` server functions.
 *
 * The Marketplace itself lives in `registry-toml.ts` and consumes
 * the upstream registry document directly — there is no hardcoded
 * catalog array in this codebase.
 */

/**
 * The pack name regex mirrors what `gc import` accepts for local
 * binding names: letters, digits, dot, underscore, dash, and slash
 * (for hierarchical names like `gascity/roles`). It must be a
 * superset of what `gc` itself accepts — otherwise we'd accept input
 * here that `gc` later rejects, which is a confusing UX.
 */
export const PACK_NAME_RE = /^[a-zA-Z0-9._\-/]{1,128}$/

/**
 * Best-effort pack name derived from a source URL/path. Used as a
 * fallback when the caller didn't supply an explicit `name`. Mirrors
 * what `gc import add <source>` itself does internally.
 *
 * Examples:
 *   https://github.com/foo/bar//baz   -> "baz"
 *   https://github.com/foo/bar/tree/main/baz -> "baz"
 *   ./packs/foo                       -> "foo"
 *   /abs/path/foo                     -> "foo"
 */
export function derivePackName(source: string): string {
  const cleaned = source.split('#')[0]?.split('?')[0] ?? source
  // Double-slash subpath (gc's documented form): take everything after `//`.
  const dslIdx = cleaned.indexOf('//')
  let tail = dslIdx >= 0 ? cleaned.slice(dslIdx + 2) : cleaned
  // GitHub tree/<ref>/<path> form.
  const TREE_RE = /\/tree\/[^/]+\/(.+)$/
  const treeMatch = TREE_RE.exec(tail)
  if (treeMatch) tail = treeMatch[1]
  // Drop trailing slashes.
  // NOSONAR: Simple regex for path normalization
  tail = tail.replace(/\/+$/, '')
  // Last path segment.
  const segs = tail.split('/').filter((s) => s.length > 0)
  return segs.length > 0 ? segs.at(-1)! : source
}
