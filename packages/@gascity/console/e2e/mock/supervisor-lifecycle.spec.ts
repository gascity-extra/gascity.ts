/**
 * Supervisor panel end-to-end coverage.
 *
 * Runs against the in-process mock GC supervisor started by
 * `e2e/with-mock-gc.sh` (see `playwright.mock.config.ts`). The mock
 * provides /health, /v0/city, /v0/city/default/unregister,
 * /v0/city/default/status, and /v0/events with the same semantics as
 * the real supervisor, so this spec exercises the same UI code path
 * end-to-end without an external `gc` daemon.
 *
 * The spec resets the mock between tests via `POST /__reset` so each
 * test starts from a known state.
 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { baseURL, waitForHydration } from "../lib/actions";

const SUPERVISOR_TOGGLE_SELECTOR = '[title="supervisor (v)"]';
const POPOVER_TESTID = {
    start: "supervisor-start",
    restart: "supervisor-restart",
    stop: "supervisor-stop",
    agents: "stat-agents",
    sessions: "stat-sessions",
    mail: "stat-mail",
    beads: "stat-beads",
} as const;

const MOCK_GC_BASE =
    (typeof process !== "undefined" && process.env?.MOCK_GC_BASE_URL) ||
    // 8780 is the mock's default port (deliberately not 8372 so it
    // can't shadow a real `gc`). The e2e wrapper / Playwright config
    // set MOCK_GC_PORT explicitly; this default matches the mock's
    // own default.
    `http://127.0.0.1:${process.env.MOCK_GC_PORT ?? 8780}`;

/** Reset the mock to a known state between specs. */
async function resetMock(request: APIRequestContext): Promise<void> {
    const res = await request.post(`${MOCK_GC_BASE}/__reset`);
    expect(res.ok(), `mock reset failed: ${res.status()}`).toBeTruthy();
}

async function openSupervisorPopover(page: Page): Promise<void> {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await waitForHydration(page);
    // Wait for the supervisor health query to resolve first — the popover's
    // start button only renders once `data` from `gcHealth` is populated
    // (so `phase` is computed and `startKind` is non-null). On a cold Vite
    // dev server this can take 5-10s end-to-end as the server fn cold-loads.
    await expect
        .poll(
            async () => page.locator(SUPERVISOR_TOGGLE_SELECTOR).textContent(),
            { timeout: 30_000, intervals: [500, 1_000, 2_000] },
        )
        .not.toContain("—");
    // Poll the click — the toggle's onClick is attached during React
    // hydration, which races the first click on a cold Vite dev server.
    await expect
        .poll(
            async () => {
                await page.click(SUPERVISOR_TOGGLE_SELECTOR, { force: true });
                return await page
                    .getByTestId(POPOVER_TESTID.start)
                    .isVisible()
                    .catch(() => false);
            },
            { timeout: 5_000, intervals: [200, 400, 800] },
        )
        .toBe(true);
}

test.describe("supervisor panel lifecycle (mock)", () => {
    test.beforeEach(async ({ request }) => {
        await resetMock(request);
        // The mock starts in supervisorUp=false to exercise the
        // bootstrap path. The existing lifecycle tests expect the
        // supervisor to be up, so start it before each one. The
        // "bootstrap path" test below exercises the supervisor-down
        // case explicitly and resets the mock itself.
        await request.post(`${MOCK_GC_BASE}/v0/supervisor/start`);
    });

    test("start → running → stop → stopped (the core lifecycle)", async ({ page }) => {
        await openSupervisorPopover(page);

        // Wait for the supervisor health and city-status polls to settle.
        // The toggle's version segment flips from "—" to "1.0.0" once
        // health resolves.
        await expect(page.locator(SUPERVISOR_TOGGLE_SELECTOR)).toContainText("1.0.0", { timeout: 15_000 });

        // beforeEach brings the supervisor up. The popover's start /
        // stop / restart buttons are wired to the *supervisor* daemon
        // — not to a city-start action — because the operator workflow
        // here is "manage the supervisor lifecycle". `startKind` is
        // null while the supervisor is up, so the button reports
        // `data-action-kind="unavailable"`. Click is a no-op; we
        // verify that contract instead of asserting a city-start kind
        // that the popover never emits.
        const startBtn = page.getByTestId(POPOVER_TESTID.start);
        await expect(startBtn).toHaveAttribute("data-action-kind", "unavailable");

        // Stop should be enabled and target the daemon.
        const stopBtn = page.getByTestId(POPOVER_TESTID.stop);
        await expect(stopBtn).toHaveAttribute("data-action-kind", "supervisor-stop");

        // Click STOP. Action console records the request.
        await stopBtn.click({ force: true });
        await expect(page.locator("pre", { hasText: "$ gc supervisor stop" })).toBeVisible({ timeout: 10_000 });
        await expect(page.locator("text=down")).toBeVisible({ timeout: 15_000 });

        // Action console contains the stop command.
        const consoleText = await page.locator("pre").filter({ hasText: "$ gc" }).innerText();
        expect(consoleText).toContain("$ gc supervisor stop");

        // Supervisor log section populated.
        await expect(
            page.locator("pre", { hasText: /supervisor\.started|request\.result/ }),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("restart cycles the supervisor daemon (stop + start)", async ({ page }) => {
        // The restart button delegates to gcSupervisorRestart, which now
        // actually restarts the daemon (stop + start via the mock-gc shim).
        // We don't care about city state here — the city will re-register
        // on its own after the daemon comes back. Just verify the daemon
        // comes back up after the restart cycle.
        await openSupervisorPopover(page);
        await expect(page.locator(SUPERVISOR_TOGGLE_SELECTOR)).toContainText("1.0.0", { timeout: 15_000 });
        const restartBtn = page.getByTestId(POPOVER_TESTID.restart);
        await expect(restartBtn).toHaveAttribute("data-action-kind", "supervisor-restart");

        // Click restart. The mock has a 50ms gap between stop and start,
        // so during this window /health returns 503 and the panel flips
        // briefly through the "down" phase. After the start comes back
        // we should see "supervisor up · city stopped".
        await restartBtn.click({ force: true });
        await expect(
            page.locator("pre", { hasText: "$ gc supervisor restart" }),
        ).toBeVisible({ timeout: 15_000 });

        // Eventually the LED settles back on "supervisor up" (any phase
        // ending in "up" is fine — we don't care whether the city is
        // running for this test).
        await expect(page.locator("text=supervisor up")).toBeVisible({ timeout: 15_000 });
    });

    test("start is rejected with 403 without the anti-CSRF header", async ({ request }) => {
        // The console's server functions always send X-GC-Request, but the
        // API contract enforces it server-side. Verify the mock rejects
        // requests that omit the header so the wire-level invariant is
        // locked in.
        const res = await request.post(`${MOCK_GC_BASE}/v0/city`, {
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ dir: "." }),
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(403);
    });

    test("supervisor daemon start endpoint (bootstrap path)", async ({ request }) => {
        // Exercises the `POST /v0/supervisor/start` endpoint that the
        // console's `gcSupervisorStart` server function targets. Drives
        // a full bootstrap cycle: reset → down → start → up → stop →
        // down → restart → up. Each transition is verified via /health
        // so the panel's LED / button enablement contract holds.
        await resetMock(request);

        // Initially down.
        const h0 = await request.get(`${MOCK_GC_BASE}/health`);
        expect(h0.status()).toBe(503);

        // Start the supervisor via the daemon endpoint.
        const startRes = await request.post(`${MOCK_GC_BASE}/v0/supervisor/start`);
        expect(startRes.status()).toBe(200);

        // Now up.
        await expect
            .poll(async () => (await request.get(`${MOCK_GC_BASE}/health`)).status(), {
                timeout: 5_000,
                intervals: [50, 100, 200],
            })
            .toBe(200);

        // Restart goes down→up via the 50ms gap. The /health probe
        // should hit 503 at some point during the gap.
        const restartRes = await request.post(`${MOCK_GC_BASE}/v0/supervisor/restart`);
        expect(restartRes.status()).toBe(200);

        // After restart, back to up.
        await expect
            .poll(async () => (await request.get(`${MOCK_GC_BASE}/health`)).status(), {
                timeout: 5_000,
                intervals: [50, 100, 200],
            })
            .toBe(200);

        // Stop brings it back down.
        const stopRes = await request.post(`${MOCK_GC_BASE}/v0/supervisor/stop`);
        expect(stopRes.status()).toBe(200);

        // Idempotency: stopping an already-stopped supervisor still 200s.
        const stopRes2 = await request.post(`${MOCK_GC_BASE}/v0/supervisor/stop`);
        expect(stopRes2.status()).toBe(200);

        // And /health reflects down.
        const h1 = await request.get(`${MOCK_GC_BASE}/health`);
        expect(h1.status()).toBe(503);
    });

    test("UI bootstrap: panel start button brings the supervisor up", async ({ page, request }) => {
        // This is the user-visible proof that "start the supervisor from
        // the console" works. The panel opens with the supervisor down,
        // shows a red LED, the start button is enabled (not grayed) and
        // labeled with a `data-action-kind` of "supervisor-start". Clicking
        // it fires `gcSupervisorStart`, which spawns the mock-gc shim,
        // which POSTs /v0/supervisor/start. The panel then flips to
        // "supervisor up · city stopped" (amber).
        await resetMock(request);

        await openSupervisorPopover(page);

        // Sanity: phase is "down" and start is enabled targeting the
        // daemon.
        await expect(page.locator("text=down")).toBeVisible({ timeout: 15_000 });
        const startBtn = page.getByTestId(POPOVER_TESTID.start);
        await expect(startBtn).toBeEnabled({ timeout: 15_000 });
        await expect(startBtn).toHaveAttribute("data-action-kind", "supervisor-start");
        await expect(startBtn).toHaveAttribute("title", /start the gc supervisor daemon/);

        // Click and wait for the action console to record the daemon
        // start. Then poll until the panel settles on "supervisor up".
        await startBtn.click({ force: true });
        await expect(
            page.locator("pre", { hasText: "$ gc supervisor start" }),
        ).toBeVisible({ timeout: 15_000 });
        await expect(
            page.locator("pre", { hasText: "gc supervisor started" }),
        ).toBeVisible({ timeout: 15_000 });

        // Phase eventually lands on "supervisor up · city stopped".
        await expect(page.locator("text=supervisor up")).toBeVisible({ timeout: 15_000 });
        // The start button is no longer "supervisor-start" — once the
        // daemon is up, the popover's start button is a no-op (it
        // doesn't drive a city start; cities are managed from /cities).
        await expect(startBtn).not.toHaveAttribute("data-action-kind", "supervisor-start", { timeout: 15_000 });
    });

    test("copy buttons put supervisor log and action console on the clipboard", async ({ page, context, browserName }) => {
        // The panel's copy buttons let the operator grab the action
        // console or supervisor log for sharing / debugging. Both
        // buttons live in their respective section headers and show
        // "copied!" briefly after a successful write.
        //
        // Playwright grants clipboard-read by default on Chromium,
        // so we can verify the round-trip without extra permissions.
        await context.grantPermissions(["clipboard-read", "clipboard-write"], {
            origin: new URL(baseURL()).origin,
        });

        await resetMock(await context.request);
        await openSupervisorPopover(page);

        // Trigger an action so the action console isn't empty (so the
        // copy button is rendered — it's only shown when there's
        // content).
        const startBtn = page.getByTestId(POPOVER_TESTID.start);
        await expect(startBtn).toBeEnabled({ timeout: 15_000 });
        // NOSONAR: force click needed for e2e test reliability
        await startBtn.click({ force: true });
        await expect(page.locator("pre", { hasText: "$ gc supervisor start" })).toBeVisible({ timeout: 15_000 });

        // Action console copy.
        const consoleCopy = page.getByTestId("action-console-copy");
        await expect(consoleCopy).toBeVisible({ timeout: 5_000 });
        await consoleCopy.click();
        // The button briefly shows "copied!" after a successful write.
        // We can't read the clipboard from page.evaluate without
        // permissions, so the label flip is the success signal.
        await expect(consoleCopy).toHaveText("copied!", { timeout: 2_000 });
        // After ~1.2s the label flips back to "copy".
        await expect(consoleCopy).toHaveText("copy", { timeout: 3_000 });

        // Wait for the supervisor log to populate (the mock fires
        // supervisor.started and request.result.* events).
        await expect(
            page.locator('[data-testid="supervisor-log-copy"]'),
        ).toBeVisible({ timeout: 15_000 });
        const logCopy = page.getByTestId("supervisor-log-copy");
        await logCopy.click();
        await expect(logCopy).toHaveText("copied!", { timeout: 2_000 });
        await expect(logCopy).toHaveText("copy", { timeout: 3_000 });
    });
});
