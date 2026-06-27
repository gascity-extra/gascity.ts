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

const MOCK_GC_PORT = Number(process.env.MOCK_GC_PORT ?? 8372);
const GC_API_BASE_URL = `http://127.0.0.1:${MOCK_GC_PORT}`;
const E2E_PORT = Number(process.env.MOCK_E2E_PORT ?? 3100);
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
        timeout: 60_000,
        stdout: "pipe",
        stderr: "pipe",
    },
    metadata: {
        gcBackend: GC_API_BASE_URL,
        isMock: true,
    },
});
