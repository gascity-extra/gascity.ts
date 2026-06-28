/**
 * Minimal TOML parser scoped to the shape of upstream
 * `gastownhall/gascity-packs/registry.toml`.
 *
 * Supports exactly what we need and no more:
 *   - top-level scalars: schema = 1
 *   - array-of-tables: pack tables
 *   - array-of-tables nested under a parent: pack.release tables
 *   - string and integer values, with or without quotes
 *   - line comments and inline comments after values
 *
 * Why not pull in `smol-toml` or `@iarna/toml`? Because (a) we need
 * to parse exactly one known file shape, (b) avoiding the dependency
 * keeps the SSR bundle slim and the audit surface small, and (c) the
 * upstream file is hand-authored and trivial. If the schema ever
 * grows inline tables, dotted keys, multi-line strings, or datetimes,
 * swap in a real TOML parser without changing call sites.
 */

export interface RegistryRelease {
  version: string
  ref?: string
  commit?: string
  hash?: string
  description?: string
}

export interface RegistryPack {
  name: string
  description?: string
  source: string
  sourceKind?: string
  releases: RegistryRelease[]
}

export interface RegistryDocument {
  schema?: number
  packs: RegistryPack[]
}

const SECTION_RE = /^\[\[([^\]]+)\]\]$/
const KV_RE = /^([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*(.+)$/

function stripInlineComment(value: string): string {
  const idx = value.indexOf('#')
  if (idx < 0) return value
  return value.slice(0, idx).trim()
}

function unquote(value: string): string {
  const v = value.trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1)
  }
  return v
}

function coerceScalar(value: string): string | number {
  const v = stripInlineComment(value)
  if (/^-?\d+$/.test(v)) return Number(v)
  return unquote(v)
}

/**
 * Parse a registry.toml string into a structured document. Throws
 * an `Error` whose message contains the 1-based line number when a
 * malformed line is encountered, so the caller can surface a
 * meaningful "registry parse failed at line N" message to the
 * operator.
 */
export function parseRegistryToml(text: string): RegistryDocument {
  const doc: RegistryDocument = { packs: [] }
  // Current section path as an array. Empty array means top-level
  // scalars; a single 'pack' means we are inside a pack table;
  // ['pack', 'release'] means we are inside a pack.release subtable.
  let path: string[] = []
  const packsByName = new Map<string, RegistryPack>()
  // The release we are currently populating, so subsequent key/value
  // lines attach to the most recent pack.release subtable.
  let currentRelease: RegistryRelease | null = null

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) continue

    const sectionMatch = line.match(SECTION_RE)
    if (sectionMatch) {
      const segs = sectionMatch[1].trim().split('.').map((s) => s.trim())
      if (segs.length === 0 || segs.some((s) => s.length === 0)) {
        throw new Error(`registry.toml line ${i + 1}: malformed section header`)
      }
      // Validate: only `pack` and `pack.release` are recognised.
      const isPack = segs[0] === 'pack'
      const isPackRelease =
        segs.length === 2 && segs[0] === 'pack' && segs[1] === 'release'
      if (!isPack && !isPackRelease) {
        throw new Error(
          `registry.toml line ${i + 1}: unsupported section [${segs.join('.')}]`,
        )
      }
      path = segs
      if (isPackRelease) {
        // pack.release — attach to the most recent pack table.
        // This branch is checked BEFORE the bare `pack` branch
        // because `[[pack.release]]` also satisfies `segs[0] === 'pack'`.
        const parent = doc.packs[doc.packs.length - 1]
        if (!parent) {
          throw new Error(
            `registry.toml line ${i + 1}: pack.release outside of any pack table`,
          )
        }
        const release: RegistryRelease = { version: '' }
        parent.releases.push(release)
        currentRelease = release
      } else if (isPack) {
        const pack: RegistryPack = {
          name: '',
          source: '',
          releases: [],
        }
        doc.packs.push(pack)
        currentRelease = null
      }
      continue
    }

    const kv = line.match(KV_RE)
    if (!kv) {
      throw new Error(`registry.toml line ${i + 1}: cannot parse line: ${rawLine}`)
    }
    const key = kv[1]
    const rawValue = kv[2]
    const value = coerceScalar(rawValue)

    if (path.length === 0) {
      // Top-level scalar (e.g. schema = 1).
      if (key === 'schema') {
        if (typeof value !== 'number') {
          throw new Error(`registry.toml line ${i + 1}: schema must be a number`)
        }
        doc.schema = value
      }
      // Unknown top-level keys are ignored for forward-compat.
      continue
    }

    if (path.length === 1 && path[0] === 'pack') {
      const pack = doc.packs[doc.packs.length - 1]
      if (!pack) {
        throw new Error(`registry.toml line ${i + 1}: key outside of a pack table`)
      }
      if (key === 'name') {
        if (typeof value !== 'string' || value.length === 0) {
          throw new Error(`registry.toml line ${i + 1}: pack name must be a non-empty string`)
        }
        if (packsByName.has(value)) {
          throw new Error(`registry.toml line ${i + 1}: duplicate pack name "${value}"`)
        }
        pack.name = value
        packsByName.set(value, pack)
      } else if (key === 'description') {
        if (typeof value !== 'string') {
          throw new Error(`registry.toml line ${i + 1}: description must be a string`)
        }
        pack.description = value
      } else if (key === 'source') {
        if (typeof value !== 'string' || value.length === 0) {
          throw new Error(`registry.toml line ${i + 1}: source must be a non-empty string`)
        }
        pack.source = value
      } else if (key === 'source_kind' || key === 'sourceKind') {
        pack.sourceKind = String(value)
      }
      // Unknown pack-level keys ignored for forward-compat.
      continue
    }

    if (path.length === 2 && path[0] === 'pack' && path[1] === 'release') {
      if (!currentRelease) {
        throw new Error(`registry.toml line ${i + 1}: key outside of a pack.release subtable`)
      }
      if (key === 'version') {
        currentRelease.version = String(value)
      } else if (key === 'ref') {
        currentRelease.ref = String(value)
      } else if (key === 'commit') {
        currentRelease.commit = String(value)
      } else if (key === 'hash') {
        currentRelease.hash = String(value)
      } else if (key === 'description') {
        currentRelease.description = String(value)
      }
      // Unknown release keys ignored for forward-compat.
      continue
    }
  }

  // Filter out any malformed pack (missing name/source) so we don't
  // hand a half-built record to the UI. The upstream file is
  // well-formed, but a hostile mirror might not be.
  doc.packs = doc.packs.filter((p) => p.name && p.source)
  return doc
}

/**
 * Pick the highest-semver release from a pack. Returns undefined
 * when the pack has no released versions, so callers can fall back
 * to "no version" install (which `gc` resolves to HEAD).
 *
 * Lexicographic compare is intentionally NOT used — `0.1.10 < 0.1.2`
 * under `String#localeCompare`. We split on `.`, parse each segment
 * as an integer (falling back to 0), and compare tuple-wise.
 */
export function latestRelease(pack: RegistryPack): RegistryRelease | undefined {
  if (pack.releases.length === 0) return undefined
  let best: RegistryRelease | null = null
  let bestKey: number[] | null = null
  for (const r of pack.releases) {
    const key = r.version
      .split(/[.\-+]/)
      .map((seg) => {
        const n = Number(seg)
        return Number.isFinite(n) ? n : 0
      })
    if (bestKey === null || compareTuple(key, bestKey) > 0) {
      best = r
      bestKey = key
    }
  }
  return best ?? undefined
}

function compareTuple(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    if (ai !== bi) return ai - bi
  }
  return 0
}

/**
 * Heuristic tag derived from pack `name` and `description`. Used by
 * the marketplace UI for grouping + filtering until upstream adds an
 * explicit tags array to the registry. The function is deliberately
 * conservative — unknown packs land in `other`.
 */
export type PackTag =
  | 'methodology'
  | 'slack'
  | 'discord'
  | 'github'
  | 'runtime'
  | 'support'
  | 'agent-context'
  | 'contributor'
  | 'other'

const METHODOLOGY_NAMES = new Set([
  'gascity',
  'bmad',
  'compound-engineering',
  'superpowers',
  'gstack',
  'gastown',
])

export function inferPackTag(pack: RegistryPack): PackTag {
  const n = pack.name.toLowerCase()
  if (METHODOLOGY_NAMES.has(n)) return 'methodology'
  if (n.startsWith('slack')) return 'slack'
  if (n === 'discord') return 'discord'
  if (n === 'github') return 'github'
  if (n.startsWith('runtime')) return 'runtime'
  if (n === 'cass') return 'agent-context'
  if (n === 'oversight-rig') return 'support'
  if (n === 'pr-pipeline' || n === 'contributing') return 'contributor'
  // Fall back to scanning the description for keyword matches.
  const d = (pack.description ?? '').toLowerCase()
  if (d.includes('slack')) return 'slack'
  if (d.includes('discord')) return 'discord'
  if (d.includes('github') && d.includes('webhook')) return 'github'
  if (d.includes('runtime')) return 'runtime'
  return 'other'
}

/**
 * Tier hint for slack-family packs (smallest viable first). Mirrors
 * the upstream README's tier table. Returns undefined for non-slack
 * packs.
 */
export function inferPackTier(pack: RegistryPack): 1 | 2 | 3 | undefined {
  switch (pack.name) {
    case 'slack-mini':
      return 1
    case 'slack-channel':
      return 2
    case 'slack-full':
      return 3
    default:
      return undefined
  }
}
