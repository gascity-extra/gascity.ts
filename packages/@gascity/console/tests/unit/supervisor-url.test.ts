import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    _buildSupervisorUrlFromTomlForTest,
    _parseSupervisorTomlForTest,
    _resolveSupervisorUrlForTest,
    isSupervisorApiDisabled,
} from '../../src/lib/gc.functions';

// Tests for the supervisor URL resolution stack. We can't drive the
// server functions from a unit test (they require the TanStack Start
// runtime), so we exercise the pure helpers directly. The server
// functions delegate to these for every HTTP call, so the contract is
// covered here.

describe('parseSupervisorToml', () => {
    it('reads bind and port from [supervisor] section', () => {
        const out = _parseSupervisorTomlForTest(`
# upstream default
[supervisor]
bind = "127.0.0.1"
port = 9443
`)
        expect(out.bind).toBe('127.0.0.1')
        expect(out.port).toBe(9443)
    });

    it('ignores sections other than [supervisor]', () => {
        const out = _parseSupervisorTomlForTest(`
[city]
bind = "10.0.0.1"
port = 9999

[supervisor]
bind = "0.0.0.0"
port = 9000
`)
        expect(out.bind).toBe('0.0.0.0')
        expect(out.port).toBe(9000)
    });

    it('strips inline comments and quotes', () => {
        const out = _parseSupervisorTomlForTest(`
[supervisor]
bind = "0.0.0.0"  # listen on all interfaces
port = 9000 # any port
`)
        expect(out.bind).toBe('0.0.0.0')
        expect(out.port).toBe(9000)
    });

    it('rejects invalid port values', () => {
        const out = _parseSupervisorTomlForTest(`
[supervisor]
port = "not-a-number"
`)
        expect(out.port).toBeUndefined();
    });

    it('handles unquoted scalar values', () => {
        const out = _parseSupervisorTomlForTest(`
[supervisor]
bind = 127.0.0.1
port = 9443
`)
        expect(out.bind).toBe('127.0.0.1')
        expect(out.port).toBe(9443)
    });
});

describe('buildSupervisorUrlFromToml', () => {
    it('constructs http://host:port', () => {
        expect(_buildSupervisorUrlFromTomlForTest('127.0.0.1', 9443)).toBe(
            'http://127.0.0.1:9443',
        )
    })

    it('normalises 0.0.0.0 wildcard to loopback', () => {
        expect(_buildSupervisorUrlFromTomlForTest('0.0.0.0', 9000)).toBe(
            'http://127.0.0.1:9000',
        )
    })

    it('normalises :: to ::1', () => {
        expect(_buildSupervisorUrlFromTomlForTest('::', 9000)).toBe(
            'http://::1:9000',
        )
    })

    it('strips brackets from an IPv6 literal', () => {
        expect(_buildSupervisorUrlFromTomlForTest('[::1]', 9000)).toBe(
            'http://::1:9000',
        )
    })

    it('returns null when bind or port is missing', () => {
        expect(_buildSupervisorUrlFromTomlForTest(undefined, 9000)).toBeNull()
        expect(_buildSupervisorUrlFromTomlForTest('127.0.0.1', undefined)).toBeNull()
    })
})

describe('resolveSupervisorUrl', () => {
    let originalApiBase: string | undefined
    let originalSupervisorUrl: string | undefined

    beforeEach(() => {
        originalApiBase = process.env.GC_API_BASE_URL
        originalSupervisorUrl = process.env.GC_SUPERVISOR_URL
        delete process.env.GC_API_BASE_URL
        delete process.env.GC_SUPERVISOR_URL
    })

    afterEach(() => {
        if (originalApiBase === undefined) delete process.env.GC_API_BASE_URL
        else process.env.GC_API_BASE_URL = originalApiBase
        if (originalSupervisorUrl === undefined)
            delete process.env.GC_SUPERVISOR_URL
        else process.env.GC_SUPERVISOR_URL = originalSupervisorUrl
    })

    it('prefers explicit override over env', () => {
        process.env.GC_API_BASE_URL = 'https://env.example.com'
        const out = _resolveSupervisorUrlForTest('https://override.example.com')
        expect(out.source).toBe('override')
        expect(out.url).toBe('https://override.example.com')
    })

    it('honours GC_API_BASE_URL (console-side convention)', () => {
        // We intentionally do NOT read GC_SUPERVISOR_URL — the upstream
        // `gc` Go CLI does not define it (verified against
        // `gastownhall/gascity`), and inventing our own would mislead
        // operators into thinking the upstream `gc` understands it.
        process.env.GC_API_BASE_URL = 'https://supervisor.example.com'
        const out = _resolveSupervisorUrlForTest()
        expect(out.source).toBe('env')
        expect(out.url).toBe('https://supervisor.example.com')
    })

    it('does not read GC_SUPERVISOR_URL even if set', () => {
        // Guard rail: if anyone reintroduces GC_SUPERVISOR_URL handling
        // by accident, this test will catch it.
        process.env.GC_SUPERVISOR_URL = 'https://should-be-ignored.example.com'
        const out = _resolveSupervisorUrlForTest()
        expect(out.url).not.toBe('https://should-be-ignored.example.com')
        expect(out.source).toBe('default')
    })

    it('rejects malformed override and falls through to env / default', () => {
        process.env.GC_API_BASE_URL = 'https://env.example.com'
        const out = _resolveSupervisorUrlForTest('not a url')
        expect(out.source).toBe('env')
        expect(out.url).toBe('https://env.example.com')
    })

    it('falls back to upstream default port (9443) when nothing is configured', () => {
        // Upstream `gc` Go CLI defaults to port 9443 in supervisor.toml
        // (PortOrDefault), not 8372. We mirror that default.
        const out = _resolveSupervisorUrlForTest()
        expect(out.source).toBe('default')
        expect(out.url).toBe('http://127.0.0.1:9443')
    })

    it('strips trailing slash from override', () => {
        const out = _resolveSupervisorUrlForTest('https://x.example.com/')
        expect(out.url).toBe('https://x.example.com')
    })
})

describe('isSupervisorApiDisabled (GC_NO_API escape hatch)', () => {
    let original: string | undefined

    beforeEach(() => {
        original = process.env.GC_NO_API
        delete process.env.GC_NO_API
    })

    afterEach(() => {
        if (original === undefined) delete process.env.GC_NO_API
        else process.env.GC_NO_API = original
    })

    it('returns false when unset', () => {
        expect(isSupervisorApiDisabled()).toBe(false)
    })

    it('returns true for "1"', () => {
        process.env.GC_NO_API = '1'
        expect(isSupervisorApiDisabled()).toBe(true)
    })

    it('returns true for "true", "yes", "on" (case-insensitive)', () => {
        for (const v of ['true', 'TRUE', 'True', 'yes', 'YES', 'on', 'On']) {
            process.env.GC_NO_API = v
            expect(isSupervisorApiDisabled()).toBe(true)
        }
    })

    it('returns false for empty string or other values', () => {
        process.env.GC_NO_API = ''
        expect(isSupervisorApiDisabled()).toBe(false)
        process.env.GC_NO_API = '0'
        expect(isSupervisorApiDisabled()).toBe(false)
        process.env.GC_NO_API = 'false'
        expect(isSupervisorApiDisabled()).toBe(false)
    })
})

// Smoke test for the full supervisor.toml shape. The upstream `gc`
// Go CLI writes a file with `[supervisor] bind` and `port` — we
// parse it the same way and confirm the URL we build matches what
// `supervisorAPIBaseURL()` would return.
describe('supervisor.toml end-to-end shape', () => {
    it('parses a representative supervisor.toml the upstream CLI writes', () => {
        const workdir = mkdtempSync(join(tmpdir(), 'gc-sup-toml-'))
        try {
            const toml = `# Generated by 'gc supervisor install'
[supervisor]
bind = "127.0.0.1"
port = 9443
log_level = "info"
`
            writeFileSync(join(workdir, 'supervisor.toml'), toml)
            const { readFileSync } = require('node:fs') as typeof import('node:fs')
            const text = readFileSync(join(workdir, 'supervisor.toml'), 'utf8')
            const parsed = _parseSupervisorTomlForTest(text)
            const url = _buildSupervisorUrlFromTomlForTest(parsed.bind, parsed.port)
            expect(url).toBe('http://127.0.0.1:9443')
        } finally {
            rmSync(workdir, { recursive: true, force: true })
        }
    })
})