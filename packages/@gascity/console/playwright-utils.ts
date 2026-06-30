/**
 * Parse a port string from environment variables, with validation and fallback.
 * Throws a clear error instead of silently building `http://localhost:NaN`.
 */
export function parsePort(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > 65535) {
        throw new Error(
            `Invalid port value: ${JSON.stringify(raw)} (expected integer 1-65535)`,
        );
    }
    return n;
}
