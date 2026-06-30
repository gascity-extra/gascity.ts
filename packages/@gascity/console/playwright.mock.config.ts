/**
 * Playwright config for the @gascity/console supervisor-lifecycle
 * mock-end-to-end run.
 *
 * Unlike `playwright.config.ts` (which exercises UI smoke + scenarios
 * against a real or absent `gc` supervisor), this config drives the
 * supervisor panel against an in-process mock started by
 * `e2e/with-mock-gc.sh` so the lifecycle can be tested without any
 * external daemon.
 *
 * Run:
 *   bun x playwright test --config=playwright.mock.config.ts
 *   # or via the package script:
 *   bun run test:e2e:mock
 */

import { defineConfig, devices } from "@playwright/test";
import { parsePort } from "./playwright-utils";

// Mock listens on 8780 by default — NOT 8372 — so it can never
// silently shadow a real `gc` daemon on the operator's machine. The
// e2e wrapper sets ALLOW_GC_MOCK=1 because the mock itself refuses
// to run without that opt-in flag.
const MOCK_GC_PORT = parsePort(process.env.MOCK_GC_PORT, 8780);
const GC_API_BASE_URL = `http://127.0.0.1:${MOCK_GC_PORT}`;
const E2E_PORT = parsePort(process.env.E2E_PORT, 3100);
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
    testDir: "./e2e",
    // Only run the supervisor-lifecycle flow here.
    testMatch: /mock\/supervisor-lifecycle\.spec\.ts/,
    timeout: 30_000,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
    },
    projects: [
        {
            name: "mock-gc",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    // The wrapper brings up the mock-gc supervisor, waits for /health,
    // then execs Vite in the foreground pointed at the mock.
    webServer: {
        command: `./e2e/with-mock-gc.sh`,
        url: BASE_URL,
        reuseExistingServer: false,
        // Mock webServer boots faster than the real devcontainer one
        // (no Dolt / no supervisor reconcile), but Vite still cold-loads
        // gc.functions.ts ~10-15s on first compile. Bump to 90s to
        // avoid flakes on slow CI.
        timeout: 90_000,
        stdout: "pipe",
        stderr: "pipe",
    },
    metadata: {
        gcBackend: GC_API_BASE_URL,
        isMock: true,
    },
});
