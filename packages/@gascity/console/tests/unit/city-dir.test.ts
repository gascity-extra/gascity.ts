import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { _resolveCityDirForTest } from '../../src/lib/gc.functions';

// Tests for the city directory allow-list. We can't drive the server
// functions from a unit test (they require the TanStack Start runtime),
// so we exercise the pure resolver directly. The server functions
// delegate to this helper for every CLI spawn, so the security model
// is covered here.

describe('resolveCityDir (allow-list)', () => {
    let workdir: string;
    let originalCityRoot: string | undefined;
    let originalHome: string | undefined;
    let originalCityDir: string | undefined;

    beforeEach(() => {
        workdir = mkdtempSync(join(tmpdir(), 'gc-city-allow-'));
        originalCityRoot = process.env.GC_CITY_ROOT;
        originalHome = process.env.HOME;
        originalCityDir = process.env.GC_CITY_DIR;
        process.env.GC_CITY_ROOT = workdir;
        process.env.HOME = workdir;
        delete process.env.GC_CITY_DIR;
    });

    afterEach(() => {
        if (originalCityRoot === undefined) delete process.env.GC_CITY_ROOT;
        else process.env.GC_CITY_ROOT = originalCityRoot;
        if (originalHome === undefined) delete process.env.HOME;
        else process.env.HOME = originalHome;
        if (originalCityDir === undefined) delete process.env.GC_CITY_DIR;
        else process.env.GC_CITY_DIR = originalCityDir;
        rmSync(workdir, { recursive: true, force: true });
    });

    it('accepts a path inside the allow-list', () => {
        const inside = join(workdir, 'my-city');
        const resolved = _resolveCityDirForTest(inside);
        expect(resolved).toBe(inside);
    });

    it('collapses .. segments before checking the allow-list', () => {
        // workdir/../escape resolves to the parent of workdir, which is
        // outside the allow-list. The resolver should reject based on the
        // canonical path, not the literal string the operator typed.
        const sneaky = join(workdir, '..', 'escape');
        expect(() => _resolveCityDirForTest(sneaky)).toThrow(/outside allowed roots/);
    });

    it('rejects /etc even though it exists', () => {
        expect(() => _resolveCityDirForTest('/etc')).toThrow(/outside allowed roots/);
    });

    it('falls back to GC_CITY_DIR when override is empty', () => {
        const target = join(workdir, 'env-city');
        process.env.GC_CITY_DIR = target;
        const resolved = _resolveCityDirForTest('');
        expect(resolved).toBe(target);
    });

    it('throws when GC_CITY_DIR is empty and cwd is outside the allow-list', () => {
        // Sanity-check that the "narrow allow-list" actually rejects the
        // test runner's own cwd. This is the same code path that protects
        // us from a hostile operator typing an absolute path that lands
        // somewhere we don't want them to.
        process.env.GC_CITY_DIR = '';
        expect(() => _resolveCityDirForTest('')).toThrow(/outside allowed roots/);
    });

    it('falls back to cwd when allow-list is widened enough to include it', () => {
        process.env.GC_CITY_DIR = '';
        // Widen the allow-list to / so the test runner's cwd is permitted.
        // We also clear HOME so the default fallback root doesn't pin us
        // to a tmpdir.
        process.env.GC_CITY_ROOT = '/';
        process.env.HOME = '/';
        const resolved = _resolveCityDirForTest('');
        expect(resolved).toBe(process.cwd());
    });

    it('rejects an explicit override outside the allow-list', () => {
        expect(() => _resolveCityDirForTest('/tmp')).toThrow(/outside allowed roots/);
    });
});