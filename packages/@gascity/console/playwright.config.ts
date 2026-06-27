/**
 * Playwright config for the @gascity/console package.
 *
 * Three kinds of end-to-end tests:
 *
 *   1. UI smoke tests in `e2e/tests/` — render checks. Work without a
 *      GC backend; the server functions gracefully degrade.
 *
 *   2. Workflow scenarios in `e2e/scenarios/` — exercise sling → session
 *      → agent flow against a live `gc` supervisor. Skipped unless one
 *      is reachable on GC_API_BASE_URL.
 *
 *   3. Supervisor lifecycle in `e2e/mock/` — drives the start/stop/
 *      restart/LED state machine end-to-end. By default it intercepts
 *      the GC endpoints with Playwright route handlers, so it runs
 *      without any external backend. When `MOCK_GC=0` and a real
 *      `gc` supervisor is reachable, the same spec body exercises the
 *      real API for integration coverage.
 *
 * Run:
 *   bun run test:e2e                                # UI + scenarios (if reachable)
 *   bun run test:e2e -- e2e/tests                  # UI-only
 *   SKIP_E2E_SCENARIOS=1 bun run test:e2e          # skip scenarios
 *   bun run test:e2e:mock                          # mock supervisor flow
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const SKIP_SCENARIOS = process.env.SKIP_E2E_SCENARIOS === "1";
const GC_BACKEND = process.env.GC_API_BASE_URL ?? "http://127.0.0.1:8372";

export default defineConfig({
  testDir: "./e2e",
  // Skip scenarios (require live supervisor) and mock/ (lives in its
  // own config). Run `bun run test:e2e:mock` to exercise the mock
  // supervisor lifecycle.
  testIgnore: ["**/scenarios/**", "**/mock/**"],
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
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  metadata: {
    gcBackend: GC_BACKEND,
    skipScenarios: SKIP_SCENARIOS,
  },
});
