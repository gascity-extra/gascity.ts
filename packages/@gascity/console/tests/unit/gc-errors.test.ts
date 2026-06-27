import { describe, it, expect, vi } from 'vitest';
import { silentIfOffline } from '../../src/lib/gc-errors';

describe('silentIfOffline', () => {
    it('classifies ECONNREFUSED (the typical offline-supervisor error) as silent', () => {
        const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:8372'), {
            code: 'ECONNREFUSED',
        });
        expect(silentIfOffline(err)).toBe(true);
    });

    it('classifies the rest of the network failure codes as silent', () => {
        for (const code of [
            'ECONNRESET',
            'ENOTFOUND',
            'ETIMEDOUT',
            'EAI_AGAIN',
            'EHOSTUNREACH',
            'ENETUNREACH',
            'EPIPE',
            'ERR_CANCELED',
            'ABORTED',
        ]) {
            const err = Object.assign(new Error('network'), { code });
            expect(silentIfOffline(err)).toBe(true);
        }
    });

    it('peeks into axios-style nested `cause` errors', () => {
        const inner = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
        const outer = Object.assign(new Error('Request failed'), { code: 'ERR_BAD_RESPONSE', cause: inner });
        expect(silentIfOffline(outer)).toBe(true);
    });

    it('does NOT silence 5xx responses (those are real GC problems to surface)', () => {
        const err = Object.assign(new Error('Request failed with status 500'), {
            code: 'ERR_BAD_RESPONSE',
            response: { status: 500 },
        });
        expect(silentIfOffline(err)).toBe(false);
    });

    it('does NOT silence JSON parse failures from the GC response', () => {
        const err = new SyntaxError('Unexpected token < in JSON at position 0');
        expect(silentIfOffline(err)).toBe(false);
    });

    it('does NOT silence TypeErrors that indicate a code bug', () => {
        expect(silentIfOffline(new TypeError('Cannot read properties of undefined'))).toBe(false);
    });

    it('returns false for non-error values', () => {
        expect(silentIfOffline(null)).toBe(false);
        expect(silentIfOffline(undefined)).toBe(false);
        expect(silentIfOffline('just a string')).toBe(false);
        expect(silentIfOffline(42)).toBe(false);
    });

    it('terminates when `cause` is the error itself (cycle protection)', () => {
        const err: any = new Error('loop');
        err.code = 'ECONNREFUSED';
        err.cause = err;
        expect(silentIfOffline(err)).toBe(true);
    });
});
