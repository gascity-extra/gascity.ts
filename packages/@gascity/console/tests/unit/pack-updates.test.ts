import { describe, it, expect } from 'vitest';
import { computePackUpdates } from '../../src/lib/gc.functions';

// Minimal MarketplaceEntry shape — we only need the fields the
// updater actually reads. Keeps the test independent of the full
// interface so changes elsewhere don't break this file.
function entry(overrides: Partial<{
  name: string
  source: string
  latestVersion: string
  latestRef: string
  registryName: string
}> = {}) {
  return {
    name: 'bmad',
    source: 'https://github.com/foo/bar//bmad',
    latestVersion: '0.1.6',
    latestRef: 'abc123',
    registryName: 'upstream',
    ...overrides,
  }
}

describe('computePackUpdates', () => {
  it('returns update_available when installed ref does not match catalog ref', () => {
    const result = computePackUpdates(
      [{ name: 'bmad', ref: 'oldcommit', source: 'https://github.com/foo/bar//bmad' }],
      [entry({ latestRef: 'newcommit' })],
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('update_available')
    expect(result[0]?.latestRef).toBe('newcommit')
  })

  it('returns up_to_date when installed ref matches catalog ref', () => {
    const result = computePackUpdates(
      [{ name: 'bmad', ref: 'abc123', source: 'https://github.com/foo/bar//bmad' }],
      [entry({ latestRef: 'abc123' })],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })

  it('treats .git suffix as equivalent when comparing sources', () => {
    const result = computePackUpdates(
      [
        {
          name: 'bmad',
          ref: 'abc123',
          source: 'https://github.com/foo/bar.git//bmad',
        },
      ],
      [entry({ latestRef: 'abc123', source: 'https://github.com/foo/bar//bmad' })],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })

  it('returns not_in_catalog when installed pack has no catalog entry', () => {
    const result = computePackUpdates(
      [{ name: 'mystery', ref: 'whatever' }],
      [entry({ name: 'bmad' })],
    )
    expect(result[0]?.status).toBe('not_in_catalog')
    expect(result[0]?.name).toBe('mystery')
  })

  it('marks update_available when source URLs differ and refs do not match', () => {
    // The operator installed from a fork whose commit history diverged
    // from the upstream catalog. Without a matching ref, the only
    // signal we have is that the source URL doesn't match — so we
    // err on the side of "update available" and let the operator
    // decide via `gc import upgrade`.
    const result = computePackUpdates(
      [
        {
          name: 'bmad',
          ref: 'forkcommit',
          source: 'https://github.com/my-fork/bmad-fork.git//bmad',
        },
      ],
      [entry({ latestRef: 'abc123', source: 'https://github.com/foo/bar//bmad' })],
    )
    expect(result[0]?.status).toBe('update_available')
  })

  it('returns up_to_date when refs match even if source URL is a fork', () => {
    // The operator pinned the same commit, just from a fork. Refs
    // matching means we don't need to nudge an upgrade — `gc import
    // upgrade` is a no-op for matching refs.
    const result = computePackUpdates(
      [
        {
          name: 'bmad',
          ref: 'abc123',
          source: 'https://github.com/my-fork/bmad-fork.git//bmad',
        },
      ],
      [entry({ latestRef: 'abc123', source: 'https://github.com/foo/bar//bmad' })],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })

  it('preserves registryName from the catalog entry', () => {
    const result = computePackUpdates(
      [{ name: 'bmad', ref: 'old' }],
      [entry({ registryName: 'internal' })],
    )
    expect(result[0]?.registryName).toBe('internal')
  })

  it('handles empty installed list', () => {
    const result = computePackUpdates([], [entry()])
    expect(result).toEqual([])
  })

  it('handles empty catalog', () => {
    const result = computePackUpdates(
      [{ name: 'x', ref: 'r' }, { name: 'y' }],
      [],
    )
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.status === 'not_in_catalog')).toBe(true)
  })

  it('passes through installedRef and installedSource verbatim', () => {
    const result = computePackUpdates(
      [
        {
          name: 'bmad',
          ref: 'oldcommit',
          source: 'https://github.com/foo/bar//bmad',
        },
      ],
      [entry({ latestRef: 'newcommit' })],
    )
    expect(result[0]?.installedRef).toBe('oldcommit')
    expect(result[0]?.installedSource).toBe('https://github.com/foo/bar//bmad')
  })

  it('falls back to path when source is absent', () => {
    const result = computePackUpdates(
      [{ name: 'bmad', ref: 'r', path: '/srv/packs/bmad' }],
      [entry({ name: 'bmad' })],
    )
    expect(result[0]?.installedSource).toBe('/srv/packs/bmad')
  })

  it('joins multiple packs without aliasing', () => {
    const result = computePackUpdates(
      [
        { name: 'bmad', ref: 'r1' },
        { name: 'gascity', ref: 'r2' },
      ],
      [
        entry({ name: 'bmad', latestRef: 'r1' }),
        entry({ name: 'gascity', latestRef: 'r3' }),
      ],
    )
    expect(result.find((r) => r.name === 'bmad')?.status).toBe('up_to_date')
    expect(result.find((r) => r.name === 'gascity')?.status).toBe('update_available')
  })

  it('matches by source URL when binding name differs (renamed import)', () => {
    // Operator ran `gc import add https://…/bmad --name my-bmad` so
    // the installed pack's name is `my-bmad` but the catalog entry
    // for `bmad` points at the same source. The installer must not
    // mark this as `not_in_catalog`.
    const result = computePackUpdates(
      [
        {
          name: 'my-bmad',
          ref: 'oldcommit',
          source: 'https://github.com/foo/bar//bmad',
        },
      ],
      [entry({ name: 'bmad', latestRef: 'newcommit' })],
    )
    expect(result[0]?.status).toBe('update_available')
    expect(result[0]?.registryName).toBe('upstream')
  })

  it('matches by source even when catalog ref is unchanged', () => {
    const result = computePackUpdates(
      [
        {
          name: 'my-bmad',
          ref: 'abc123',
          source: 'https://github.com/foo/bar//bmad',
        },
      ],
      [entry({ latestRef: 'abc123' })],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })

  it('treats .git suffix as equivalent when matching by source', () => {
    const result = computePackUpdates(
      [
        {
          name: 'my-bmad',
          ref: 'r',
          source: 'https://github.com/foo/bar.git//bmad',
        },
      ],
      [entry({ latestRef: 'r' })],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })

  it('prefers name match over source match when both keys exist', () => {
    // If the operator happens to have an installed pack with a
    // name that exactly matches a catalog entry AND the source
    // would also match a different catalog entry, the name match
    // wins (it's the more specific signal).
    const result = computePackUpdates(
      [{ name: 'bmad', ref: 'r1', source: 'https://github.com/foo/bar//cass' }],
      [
        entry({ name: 'bmad', latestRef: 'r1' }),
        entry({ name: 'cass', latestRef: 'r2' }),
      ],
    )
    expect(result[0]?.status).toBe('up_to_date')
  })
})
