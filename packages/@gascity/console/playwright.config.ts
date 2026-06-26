/**
 * Playwright config for the @gascity/console package.
 *
 * The console has two kinds of end-to-end tests:
 *   1. UI smoke tests (in `e2e/tests/`) — load the dev server and check
 *      basic page renders. These work with no GC backend; the server
 *      functions gracefully degrade.
 *   2. Workflow scenarios (in `e2e/scenarios/`) — exercise sling → session
 *      → agent flow. These require a running `gc` supervisor on
 *      GC_API_BASE_URL (default http://127.0.0.1:8372) and are skipped if
 *      the backend isn't reachable.
 *
 * Run:
 *   bun run test:e2e              # everything that's runnable
 *   bun run test:e2e -- e2e/tests # UI-only
 *   SKIP_E2E_SCENARIOS=1 bun run test:e2e  # skip scenario tests
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const SKIP_SCENARIOS = process.env.SKIP_E2E_SCENARIOS === "1";
const GC_BACKEND = process.env.GC_API_BASE_URL ?? "http://127.0.0.1:8372";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: SKIP_SCENARIOS ? "**/scenarios/**" : undefined,
  // Don't fail the whole run if scenarios can't reach the GC backend —
  // they're tagged so callers can opt-in/out. UI tests run unconditionally.
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
  // Surfaced in tests as `test.info().project.metadata.gcBackend`.
  metadata: {
    gcBackend: GC_BACKEND,
    skipScenarios: SKIP_SCENARIOS,
  },
});
