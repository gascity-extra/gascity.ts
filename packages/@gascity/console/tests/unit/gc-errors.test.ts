import { describe, it, expect } from 'vitest';
import {
  isCityNotConfigured,
  CITY_NOT_CONFIGURED_HINT,
} from '../../src/lib/gc-errors';

describe('isCityNotConfigured', () => {
  it('matches the upstream "could not find city or pack root" stderr', () => {
    expect(
      isCityNotConfigured(
        'gc import add: could not find city or pack root from /workspaces/gascity.ts/packages/@gascity/console',
      ),
    ).toBe(true)
  })

  it('matches the same message from a different gc subcommand', () => {
    expect(
      isCityNotConfigured(
        'gc pack registry list: could not find city or pack root from /home/op/proj',
      ),
    ).toBe(true)
  })

  it('matches case-insensitively (defensive against gc CLI variations)', () => {
    expect(isCityNotConfigured('COULD NOT FIND CITY OR PACK ROOT from /x')).toBe(true)
    expect(isCityNotConfigured('Could Not Find City or Pack Root from /x')).toBe(true)
  })

  it('does not match unrelated stderr', () => {
    expect(isCityNotConfigured('permission denied')).toBe(false)
    expect(isCityNotConfigured('registry fetch failed: HTTP 500')).toBe(false)
    expect(isCityNotConfigured(undefined)).toBe(false)
    expect(isCityNotConfigured('')).toBe(false)
  })
})

describe('CITY_NOT_CONFIGURED_HINT', () => {
  it('mentions the actionable env var (GC_CITY_DIR)', () => {
    expect(CITY_NOT_CONFIGURED_HINT).toContain('GC_CITY_DIR')
  })

  it('explains the alternative (run from inside the city directory)', () => {
    expect(CITY_NOT_CONFIGURED_HINT).toMatch(/city\.toml|\.gc\//i)
  })
})
