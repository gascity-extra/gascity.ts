import { describe, it, expect } from 'vitest';
import { summariseRegistryCommand } from '../../src/lib/registry-feedback';

describe('summariseRegistryCommand (refresh)', () => {
  it('renders a single-registry refresh with pack count and pruned cache', () => {
    const stdout = JSON.stringify({
      ok: true,
      refreshed: [{ name: 'main', pack_count: 11 }],
      failures: [],
      pruned_caches: true,
      schema_version: '1',
    })
    expect(summariseRegistryCommand('refresh', stdout)).toBe(
      'refreshed 1 registry (11 packs); pruned cache',
    )
  })

  it('renders pluralised registries when more than one is refreshed', () => {
    const stdout = JSON.stringify({
      ok: true,
      refreshed: [
        { name: 'a', pack_count: 3 },
        { name: 'b', pack_count: 5 },
      ],
      failures: [],
      pruned_caches: false,
      schema_version: '1',
    })
    expect(summariseRegistryCommand('refresh', stdout)).toBe(
      'refreshed 2 registries (8 packs)',
    )
  })

  it('flags failures count when present', () => {
    const stdout = JSON.stringify({
      ok: false,
      refreshed: [{ name: 'a', pack_count: 1 }],
      failures: [{ name: 'b', error: 'timeout' }],
      pruned_caches: false,
    })
    expect(summariseRegistryCommand('refresh', stdout)).toBe(
      'refreshed 1 registry (1 pack); 1 failure',
    )
  })

  it('uses the targeted registry name when present', () => {
    const stdout = JSON.stringify({
      ok: true,
      refreshed: [{ name: 'internal', pack_count: 4 }],
      failures: [],
      pruned_caches: false,
      target: 'internal',
    })
    expect(summariseRegistryCommand('refresh', stdout)).toBe(
      'refreshed registry "internal" (4 packs)',
    )
  })

  it('handles zero refreshed with a no-changes message', () => {
    const stdout = JSON.stringify({
      ok: true,
      refreshed: [],
      failures: [],
      pruned_caches: true,
    })
    expect(summariseRegistryCommand('refresh', stdout)).toBe(
      'refreshed 0 registries (no changes); pruned cache',
    )
  })
})

describe('summariseRegistryCommand (add)', () => {
  it('renders an add success', () => {
    const stdout = JSON.stringify({
      ok: true,
      name: 'internal',
      source: 'https://example.com/registry.toml',
      cached: false,
      validated: true,
      schema_version: '1',
    })
    expect(summariseRegistryCommand('add', stdout)).toBe(
      'registry "internal" added',
    )
  })

  it('renders a cached/already-configured add', () => {
    const stdout = JSON.stringify({
      ok: true,
      name: 'internal',
      source: 'https://example.com/registry.toml',
      cached: true,
      validated: true,
    })
    expect(summariseRegistryCommand('add', stdout)).toBe(
      'registry "internal" already configured',
    )
  })

  it('returns null when the envelope has no name (defensive)', () => {
    const stdout = JSON.stringify({ ok: true })
    expect(summariseRegistryCommand('add', stdout)).toBeNull()
  })
})

describe('summariseRegistryCommand (remove)', () => {
  it('renders a remove success', () => {
    const stdout = JSON.stringify({
      ok: true,
      name: 'internal',
      removed: true,
      schema_version: '1',
    })
    expect(summariseRegistryCommand('remove', stdout)).toBe(
      'registry "internal" removed',
    )
  })

  it('renders a not-removed outcome', () => {
    const stdout = JSON.stringify({
      ok: true,
      name: 'internal',
      removed: false,
    })
    expect(summariseRegistryCommand('remove', stdout)).toBe(
      'registry "internal" not removed',
    )
  })
})

describe('summariseRegistryCommand (fallbacks)', () => {
  it('returns null on non-JSON input (caller falls back to raw stdout)', () => {
    expect(summariseRegistryCommand('refresh', 'refreshed ok\n')).toBeNull()
    expect(summariseRegistryCommand('add', '')).toBeNull()
  })

  it('returns null on JSON without the expected envelope shape', () => {
    // Looks like JSON but missing the `refreshed` array.
    expect(
      summariseRegistryCommand('refresh', JSON.stringify({ ok: true })),
    ).toBeNull()
  })

  it('returns null on arrays at the top level', () => {
    expect(summariseRegistryCommand('add', '[]')).toBeNull()
  })
})
