import { describe, it, expect } from 'vitest';
import {
  parseRegistryToml,
  latestRelease,
  inferPackTag,
  inferPackTier,
} from '../../src/lib/registry-toml';

const FIXTURE = `schema = 1

[[pack]]
  name = "alpha"
  description = "First pack."
  source = "https://github.com/example/packs//alpha"
  source_kind = "git"

  [[pack.release]]
    version = "0.1.0"
    ref = "main"
    commit = "aaaaaaa"
    hash = "sha256:111"
    description = "initial"

  [[pack.release]]
    version = "0.1.10"
    ref = "main"
    commit = "bbbbbbb"
    hash = "sha256:222"
    description = "lexicographic-trap"

[[pack]]
  name = "beta"
  description = "Second pack."
  source = "https://github.com/example/packs/tree/main/beta"
  source_kind = "git"

  [[pack.release]]
    version = "1.2.3"
    ref = "main"
    commit = "ccccccc"
    hash = "sha256:333"
`;

describe('parseRegistryToml', () => {
  it('parses schema, packs, and nested releases', () => {
    const doc = parseRegistryToml(FIXTURE);
    expect(doc.schema).toBe(1);
    expect(doc.packs.map((p) => p.name)).toEqual(['alpha', 'beta']);
    expect(doc.packs[0]?.description).toBe('First pack.');
    expect(doc.packs[0]?.source).toBe(
      'https://github.com/example/packs//alpha',
    );
    expect(doc.packs[1]?.source).toBe(
      'https://github.com/example/packs/tree/main/beta',
    );
  });

  it('attaches releases to the parent pack', () => {
    const doc = parseRegistryToml(FIXTURE);
    expect(doc.packs[0]?.releases.map((r) => r.version)).toEqual([
      '0.1.0',
      '0.1.10',
    ]);
    expect(doc.packs[0]?.releases[0]?.commit).toBe('aaaaaaa');
    expect(doc.packs[0]?.releases[0]?.hash).toBe('sha256:111');
    expect(doc.packs[1]?.releases).toHaveLength(1);
  });

  it('drops malformed packs (missing name or source)', () => {
    const doc = parseRegistryToml(`
[[pack]]
  description = "missing name"
  source = "x"

[[pack]]
  name = "ok"
  source = "y"
`);
    expect(doc.packs.map((p) => p.name)).toEqual(['ok']);
  });

  it('rejects pack.release outside of any pack table', () => {
    expect(() =>
      parseRegistryToml(`[[pack.release]]
  version = "0.1.0"`),
    ).toThrow(/pack\.release outside of any pack table/);
  });

  it('rejects duplicate pack names', () => {
    expect(() =>
      parseRegistryToml(`
[[pack]]
  name = "dup"
  source = "a"
[[pack]]
  name = "dup"
  source = "b"
`),
    ).toThrow(/duplicate pack name "dup"/);
  });

  it('rejects unsupported sections', () => {
    expect(() =>
      parseRegistryToml(`[[weird]]
  name = "x"`),
    ).toThrow(/unsupported section/);
  });

  it('ignores unknown keys for forward-compat', () => {
    const doc = parseRegistryToml(`
schema = 1
top_level_future = "ok"

[[pack]]
  name = "alpha"
  source = "x"
  future_key = 42

  [[pack.release]]
    version = "0.1.0"
    future_release_key = true
`);
    expect(doc.packs[0]?.releases[0]?.version).toBe('0.1.0');
  });

  it('round-trips against the upstream gastownhall/gascity-packs registry shape', async () => {
    // Inline a small slice that mirrors the upstream structure: top-level
    // scalars + nested array-of-tables. We can't fetch from network in unit
    // tests, so this is a representative sample.
    const sample = `schema = 1

[[pack]]
  name = "gascity"
  description = "Gas City planning and implementation workflow pack."
  source = "https://github.com/gastownhall/gascity-packs//gascity"
  source_kind = "git"

  [[pack.release]]
    version = "0.1.6"
    ref = "main"
    commit = "3b3b89f2011e06d84459aa7bea1552382f13930a"
    hash = "sha256:149772065f9f2862965146e74d853d17e432628f57d25a4386bbef0fb6744e33"
    description = "Release graph.v2 review/build prompt fixes validated by gascity RC gates."

[[pack]]
  name = "slack-mini"
  description = "Minimal Slack mention bridge and outbound message pack for Gas City."
  source = "https://github.com/gastownhall/gascity-packs//slack-mini"
  source_kind = "git"

  [[pack.release]]
    version = "0.1.0"
    ref = "main"
    commit = "788b6e8ec224a8951c728ef6da74dab8bc04d474"
    hash = "sha256:fff2523a9ab32e0812815c8d2addb08e6349d3885052d095bd76600eec87921a"
    description = "Initial Slack mini pack release with canonical content hash."
`;
    const doc = parseRegistryToml(sample);
    expect(doc.packs).toHaveLength(2);
    expect(doc.packs[0]?.name).toBe('gascity');
    expect(doc.packs[1]?.name).toBe('slack-mini');
  });
});

describe('latestRelease', () => {
  it('picks the numerically highest version, not lexicographic', () => {
    const doc = parseRegistryToml(FIXTURE);
    const alpha = doc.packs[0];
    if (!alpha) throw new Error('fixture missing alpha pack');
    const latest = latestRelease(alpha);
    expect(latest?.version).toBe('0.1.10');
    expect(latest?.commit).toBe('bbbbbbb');
  });

  it('returns undefined when a pack has no releases', () => {
    const doc = parseRegistryToml(`
[[pack]]
  name = "alpha"
  source = "x"
`);
    expect(latestRelease(doc.packs[0]!)).toBeUndefined();
  });
});

describe('inferPackTag', () => {
  it('classifies the known methodology set', () => {
    for (const name of [
      'gascity',
      'bmad',
      'compound-engineering',
      'superpowers',
      'gstack',
      'gastown',
    ]) {
      expect(inferPackTag({ name, source: 'x' })).toBe('methodology');
    }
  });

  it('classifies slack tiers and falls through to other', () => {
    expect(inferPackTag({ name: 'slack-mini', source: 'x' })).toBe('slack');
    expect(inferPackTag({ name: 'slack-full', source: 'x' })).toBe('slack');
    expect(inferPackTag({ name: 'cass', source: 'x' })).toBe('agent-context');
    expect(inferPackTag({ name: 'contributing', source: 'x' })).toBe(
      'contributor',
    );
    expect(inferPackTag({ name: 'my-unknown-pack', source: 'x' })).toBe('other');
  });
});

describe('inferPackTier', () => {
  it('numbers the slack tiers and returns undefined otherwise', () => {
    expect(inferPackTier({ name: 'slack-mini', source: 'x' })).toBe(1);
    expect(inferPackTier({ name: 'slack-channel', source: 'x' })).toBe(2);
    expect(inferPackTier({ name: 'slack-full', source: 'x' })).toBe(3);
    expect(inferPackTier({ name: 'bmad', source: 'x' })).toBeUndefined();
  });
});
