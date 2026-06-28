import { describe, it, expect } from 'vitest';
import {
  PACK_CATALOG,
  derivePackName,
  PACK_NAME_RE,
} from '../../src/lib/packs-catalog';

describe('PACK_NAME_RE', () => {
  it('accepts normal names and hierarchical ones', () => {
    for (const ok of ['bmad', 'slack-mini', 'gascity/roles', 'foo.bar_baz-qux']) {
      expect(PACK_NAME_RE.test(ok)).toBe(true);
    }
  });

  it('rejects empty and over-long names', () => {
    expect(PACK_NAME_RE.test('')).toBe(false);
    expect(PACK_NAME_RE.test('   ')).toBe(false);
    expect(PACK_NAME_RE.test('a'.repeat(129))).toBe(false);
  });

  it('rejects names with shell metacharacters', () => {
    for (const bad of ['foo;rm -rf /', 'foo bar', 'foo$bar', 'foo|bar']) {
      expect(PACK_NAME_RE.test(bad)).toBe(false);
    }
  });
});

describe('derivePackName', () => {
  it('extracts the subpath from the canonical double-slash form', () => {
    expect(derivePackName('https://github.com/foo/bar//baz')).toBe('baz');
    expect(derivePackName('https://github.com/foo/bar//slack-mini')).toBe(
      'slack-mini',
    );
  });

  it('handles the github tree/<ref>/<path> form', () => {
    expect(
      derivePackName('https://github.com/foo/bar/tree/main/superpowers'),
    ).toBe('superpowers');
    expect(
      derivePackName(
        'https://github.com/foo/bar/tree/master/packs/compound-engineering',
      ),
    ).toBe('compound-engineering');
  });

  it('falls back to the last path segment for local paths', () => {
    expect(derivePackName('./packs/foo')).toBe('foo');
    expect(derivePackName('/abs/path/to/my-pack')).toBe('my-pack');
  });

  it('strips trailing slashes, query strings, and fragments', () => {
    expect(derivePackName('https://github.com/foo/bar//gstack/')).toBe('gstack');
    expect(derivePackName('https://github.com/foo/bar//bmad?foo=bar')).toBe(
      'bmad',
    );
    expect(derivePackName('https://github.com/foo/bar//bmad#readme')).toBe(
      'bmad',
    );
  });

  it('returns the original source when there is no path', () => {
    expect(derivePackName('')).toBe('');
    expect(derivePackName('just-a-name')).toBe('just-a-name');
  });
});

// Touch the constant to keep tree-shakers honest if someone refactors.
void PACK_CATALOG;
