import { describe, it, expect } from 'vitest';
import { _parseSlingOutputForTest } from '../../src/lib/gc.functions';

// Tests for the sling output parser. The parser runs after `gc sling`
// exits and pulls the bead id out of either a `--json` envelope or a
// free-text stdout/stderr. We don't spawn `gc` from a unit test — the
// parsing layer is pure, and `runGc` is exercised by the e2e suite.

describe('parseSlingOutput', () => {
  it('parses JSON envelope with top-level bead_id', () => {
    const out = _parseSlingOutputForTest(
      JSON.stringify({ ok: true, bead_id: 'gd-abc123' }),
      '',
    )
    expect(out.bead_id).toBe('gd-abc123')
    expect(out.output).toContain('gd-abc123')
  })

  it('parses JSON envelope with nested bead.id', () => {
    const out = _parseSlingOutputForTest(
      JSON.stringify({ ok: true, bead: { id: 'gd-nested1' } }),
      '',
    )
    expect(out.bead_id).toBe('gd-nested1')
  })

  it('parses JSON envelope with result.bead_id', () => {
    const out = _parseSlingOutputForTest(
      JSON.stringify({ result: { bead_id: 'gd-result1' } }),
      '',
    )
    expect(out.bead_id).toBe('gd-result1')
  })

  it('parses JSON envelope with beads[0].id', () => {
    const out = _parseSlingOutputForTest(
      JSON.stringify({ beads: [{ id: 'gd-list0' }] }),
      '',
    )
    expect(out.bead_id).toBe('gd-list0')
  })

  it('falls back to "Created gd-X" regex on plain stdout', () => {
    const out = _parseSlingOutputForTest('Created gd-plain1 — write a README', '')
    expect(out.bead_id).toBe('gd-plain1')
  })

  it('falls back to "Slung gd-X" regex on plain stdout', () => {
    const out = _parseSlingOutputForTest('Slung gd-slung1 → my-rig/claude', '')
    expect(out.bead_id).toBe('gd-slung1')
  })

  it('falls back to bd- prefix regex when gd- is absent', () => {
    const out = _parseSlingOutputForTest('dispatched bd-legacy42 to claude', '')
    expect(out.bead_id).toBe('bd-legacy42')
  })

  it('returns generic message when no bead id is present', () => {
    const out = _parseSlingOutputForTest('', '')
    expect(out.bead_id).toBeUndefined()
    expect(out.output).toMatch(/no bead id/)
  })

  it('treats invalid JSON as non-JSON and falls back to regex', () => {
    const out = _parseSlingOutputForTest('{not valid json Slung gd-bonus1', '')
    expect(out.bead_id).toBe('gd-bonus1')
  })

  it('returns stderr text when stdout has no id and no JSON', () => {
    const out = _parseSlingOutputForTest('garbled output', 'something failed somewhere')
    // No id, no JSON — falls through to the generic message.
    expect(out.bead_id).toBeUndefined()
  })

  it('parses upstream per-rig prefix "Created BL-42 — ..." on stdout', () => {
    const out = _parseSlingOutputForTest(
      'Created BL-42 — "write a README"',
      '',
    )
    expect(out.bead_id).toBe('BL-42')
  })

  it('parses upstream per-rig prefix "Slung FE-1 → ..." on stdout', () => {
    const out = _parseSlingOutputForTest(
      'Slung FE-1 → my-rig/devin',
      '',
    )
    expect(out.bead_id).toBe('FE-1')
  })

  it('parses "Started workflow W-7 ..." form', () => {
    const out = _parseSlingOutputForTest(
      'Started workflow W-7 (formula "loop") → my-rig/devin',
      '',
    )
    expect(out.bead_id).toBe('W-7')
  })

  it('extracts the id when the marker appears mid-multiline-output', () => {
    const out = _parseSlingOutputForTest(
      [
        'note: routing bead',
        'Created agent-diagnostics-7 — "diagnose the rig"',
        'OK',
      ].join('\n'),
      '',
    )
    expect(out.bead_id).toBe('agent-diagnostics-7')
  })
})
