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
import { parsePort } from "./playwright-utils";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${parsePort(process.env.E2E_PORT, 3000)}`;
const SKIP_SCENARIOS = process.env.SKIP_E2E_SCENARIOS === "1";
const GC_BACKEND = process.env.GC_API_BASE_URL ?? "http://127.0.0.1:8372";

export default defineConfig({
  testDir: "./e2e",
  // Skip mock/ (lives in its own config). Run `bun run test:e2e:mock`
  // to exercise the mock supervisor lifecycle. Scenarios run here —
  // each scenario's `beforeAll` probes the supervisor and skips the
  // suite when unreachable, so they self-degrade when no `gc`
  // backend is available.
  testIgnore: ["**/mock/**"],
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
    // Make sure the console's server functions (and Vite's /gc proxy
    // target) point at the live supervisor. The default upstream port
    // is 8372 per `internal/supervisor/config.go: PortOrDefault` —
    // `gc supervisor start` brings it up on that port in this
    // devcontainer. Scenarios self-skip if `GC_API_BASE_URL` is
    // unreachable — see `isGcBackendReachable` in `e2e/lib/actions.ts`.
    //
    // `GC_DOLT_SKIP=1` disables the Dolt author-identity probe that
    // otherwise blocks `gc init` in dev containers without a global
    // `dolt config user.name / user.email`. See
    // `cmd/gc/init_provider_readiness.go: gcDoltSkip`.
    //
    // `GC_CITY_ROOT=/tmp:/home/vscode` widens the city-dir allow-list
    // (see `resolveCityDir` in `gc.functions.ts`) so the sling-pickup
    // spec can `gc init /tmp/gc-e2e-<runId>` without rejection.
    //
    // `GC_RIG_DIR` points `gcCityInitWithPacks` at the test rig agent
    // config so the bootstrapped city has the `devin-test` rig wired
    // in (see `e2e/rig/README.md`). The rig copies the agent toml +
    // prompt template into the city's `agents/devin-test/` layout
    // before `gc start` is invoked.
    env: {
      ...process.env,
      GC_API_BASE_URL: GC_BACKEND,
      GC_DOLT_SKIP: "1",
      GC_CITY_ROOT: "/tmp:/home/vscode",
      GC_RIG_DIR: resolve(__dirname, "e2e/rig"),
    },
  },
  metadata: {
    gcBackend: GC_BACKEND,
    skipScenarios: SKIP_SCENARIOS,
  },
});
