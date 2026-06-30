import { describe, it, expect } from 'vitest';
import {
  _isValidBeadIdForTest,
  _isValidAgentNameForTest,
} from '../../src/lib/gc.functions';

// Unit tests for the argv allow-lists used by `gcSling` and
// `gcCloseBead`. Both handlers validate their inputs before shelling
// out to `gc`, so these regexes are the only thing standing between
// an HTTP request and arbitrary-argv execution. Coverage here is the
// safety net — a regression here is a shell-injection regression.

describe('isValidBeadId', () => {
  it('accepts canonical gd- prefixed lowercase alnum ids', () => {
    expect(_isValidBeadIdForTest('gd-abc123')).toBe(true)
    expect(_isValidBeadIdForTest('gd-0')).toBe(true)
    expect(_isValidBeadIdForTest('gd-a-b-c')).toBe(true)
  })

  it('accepts upstream per-rig prefixes (BL-, FE-, WP-, HQ-, agent.)', () => {
    // Per `gastownhall/gascity` `internal/sling/sling.go:BeadPrefixForCity`,
    // bead ids use whatever prefix the rig's TOML declares — commonly
    // uppercase short codes, multi-segment slugs, or HQ defaults.
    expect(_isValidBeadIdForTest('BL-42')).toBe(true)
    expect(_isValidBeadIdForTest('FE-1')).toBe(true)
    expect(_isValidBeadIdForTest('WP-99')).toBe(true)
    expect(_isValidBeadIdForTest('hq-abc123')).toBe(true)
    expect(_isValidBeadIdForTest('agent-diagnostics-7')).toBe(true)
    expect(_isValidBeadIdForTest('W-7')).toBe(true)
    // bd- prefix (older upstream builds) is still allowed.
    expect(_isValidBeadIdForTest('bd-abc123')).toBe(true)
  })

  it('rejects empty and malformed ids', () => {
    expect(_isValidBeadIdForTest('')).toBe(false)
    expect(_isValidBeadIdForTest('gd-')).toBe(false) // no suffix
    expect(_isValidBeadIdForTest('-abc')).toBe(false) // no prefix
    expect(_isValidBeadIdForTest('gd-abc 123')).toBe(false) // whitespace
    expect(_isValidBeadIdForTest('gd-abc; rm -rf /')).toBe(false) // injection
    expect(_isValidBeadIdForTest('gd-abc$(echo)')).toBe(false)
    expect(_isValidBeadIdForTest('gd-abc`echo`')).toBe(false)
    expect(_isValidBeadIdForTest('gd-abc"x"')).toBe(false)
    expect(_isValidBeadIdForTest("gd-abc'x'")).toBe(false)
  })
})

describe('isValidAgentName', () => {
  it('accepts typical rig/agent names', () => {
    expect(_isValidAgentNameForTest('mayor')).toBe(true)
    expect(_isValidAgentNameForTest('hello-world/polecat')).toBe(true)
    expect(_isValidAgentNameForTest('agent.v2')).toBe(true)
    expect(_isValidAgentNameForTest('a_b')).toBe(true)
  })

  it('rejects shell metacharacters and whitespace', () => {
    expect(_isValidAgentNameForTest('')).toBe(false)
    expect(_isValidAgentNameForTest('agent name')).toBe(false)
    expect(_isValidAgentNameForTest('agent;rm')).toBe(false)
    expect(_isValidAgentNameForTest('agent$(x)')).toBe(false)
    expect(_isValidAgentNameForTest('agent`x`')).toBe(false)
    expect(_isValidAgentNameForTest('agent"x"')).toBe(false)
    expect(_isValidAgentNameForTest("agent'x'")).toBe(false)
  })
})
