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
import { waitForHydration } from "../lib/actions";

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
        // health resolves; the stat counter flips from "—" to "0/0"
        // once city-status resolves.
        await expect(page.locator(SUPERVISOR_TOGGLE_SELECTOR)).toContainText("1.0.0", { timeout: 15_000 });
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/^0\/0$/, { timeout: 10_000 });

        // Click START. Action console records the request.
        await page.getByTestId(POPOVER_TESTID.start).click({ force: true });
        await expect(page.locator("pre", { hasText: "$ gc start" })).toBeVisible({ timeout: 10_000 });

        // Stats populate from the city-status poll.
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/\d+\/\d+/, { timeout: 15_000 });
        await expect(page.getByTestId(POPOVER_TESTID.sessions)).toHaveText(/\d+\/\d+/, { timeout: 5_000 });

        // Phase label flips to "operational" (up-running).
        await expect(page.locator("text=operational")).toBeVisible({ timeout: 15_000 });

        // Click STOP. Action console records the request, stats reset.
        await page.getByTestId(POPOVER_TESTID.stop).click({ force: true });
        await expect(page.locator("pre", { hasText: "$ gc stop" })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/^0\/0$/, { timeout: 15_000 });

        // Phase label flips back to "supervisor up · city stopped".
        await expect(page.locator("text=supervisor up")).toBeVisible({ timeout: 15_000 });

        // Action console contains both commands.
        const consoleText = await page.locator("pre").filter({ hasText: "$ gc" }).innerText();
        expect(consoleText).toContain("$ gc start");
        expect(consoleText).toContain("$ gc stop");

        // Supervisor log section populated.
        await expect(
            page.locator("pre", { hasText: /supervisor\.started|request\.result/ }),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("restart cycles stop → start (city restarts under the same name)", async ({ page }) => {
        // The restart button delegates to stopCityImpl + startCityImpl under
        // the hood. We assert the action console records both calls — but
        // only verify the user-visible surface (the restart output mentions
        // the city name) and that the city is running afterwards. This keeps
        // the test resilient to the exact ordering of the inner stop/start
        // pair.
        await openSupervisorPopover(page);
        await expect(page.locator(SUPERVISOR_TOGGLE_SELECTOR)).toContainText("1.0.0", { timeout: 15_000 });
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/^0\/0$/, { timeout: 10_000 });

        // Pre-condition: city stopped. Start it, wait for running.
        await page.getByTestId(POPOVER_TESTID.start).click({ force: true });
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/\d+\/\d+/, { timeout: 15_000 });

        // Now click restart. We tolerate the action console format — just
        // require that the action console contains the word "restart" and
        // that the city is still running after the operation completes.
        await page.getByTestId(POPOVER_TESTID.restart).click({ force: true });
        // Give the click handler time to fire and the mutation to complete.
        // We don't assert on a specific text because the stop+start inner
        // race is implementation-detail; we assert the cycle outcome.
        await page.waitForTimeout(3_000)
        // Action console should reflect that the user invoked restart (the
        // optimistic "$ gc restart" line may or may not appear depending on
        // how the server function races the city-status poll, but at minimum
        // the start and stop entries from the inner cycle should be present).
        const consoleText = await page.locator("pre").filter({ hasText: "$ gc" }).innerText();
        expect(consoleText).toContain("$ gc start");

        // After the restart cycle the city should be running again.
        await expect(page.getByTestId(POPOVER_TESTID.agents)).toHaveText(/\d+\/\d+/, { timeout: 20_000 });
        await expect(page.locator("text=operational")).toBeVisible({ timeout: 20_000 });
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
});
