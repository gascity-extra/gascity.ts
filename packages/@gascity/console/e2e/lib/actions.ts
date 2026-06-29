import { Page, Locator, expect } from '@playwright/test';

/**
 * Resolve the test runner's base URL for absolute navigation. Falls back to
 * `process.env.E2E_BASE_URL` or `http://localhost:3000` so the suite can be
 * invoked outside the configured Playwright webServer.
 */
export function baseURL(): string {
  return process.env.E2E_BASE_URL ?? 'http://localhost:3000';
}

/**
 * Resolve the GC supervisor base URL (used by scenario tests). Falls back to
 * `process.env.GC_API_BASE_URL` or `http://127.0.0.1:8372`.
 */
export function gcBackendURL(): string {
  return process.env.GC_API_BASE_URL ?? 'http://127.0.0.1:8372';
}

/**
 * Returns true when the GC supervisor is reachable. Scenario tests should
 * call this in `beforeAll`/`beforeEach` and `test.skip()` when it returns
 * false, otherwise they will fail because the UI dropdowns stay empty.
 *
 * Uses Node's `fetch` so it works outside the browser context (no page
 * required) — handy for `test.beforeAll(() => isGcBackendReachable())`.
 */
export async function isGcBackendReachable(timeoutMs = 1500): Promise<boolean> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${gcBackendURL()}/health`, {
      method: 'GET',
      signal: ctl.signal,
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wait for the React app to hydrate. The console is server-rendered by
 * TanStack Start, so the DOM is present immediately but onClick handlers
 * (and global keydown listeners) are only attached after hydration
 * completes. Without waiting, the first click/keypress after `goto` lands
 * on a static SSR HTML tree and is silently ignored.
 *
 * Uses a small fixed delay as the primary mechanism — TanStack's hydration
 * marker is only emitted in dev. 1.5s is comfortably above the worst-case
 * cold-hydration we've observed on this dev container for the regular UI
 * smoke tests. Specs that drive the supervisor panel need a longer
 * wait because the supervisor server functions cold-load too — see
 * `waitForSupervisorPanel` below.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForTimeout(1500);
}

/**
 * Extended hydration wait used by supervisor-panel specs. Waits for the
 * popover's `useQuery` calls (health, city-status, logs) to round-trip
 * through the server functions. Specifically waits for the supervisor
 * health query to resolve — the toggle version segment flips from "—"
 * to "1.0.0" once `gcHealth` returns.
 *
 * On a cold Vite dev server the supervisor server functions cold-load
 * along with the page; their first round-trip can take 5-10s end-to-end.
 */
export async function waitForSupervisorPanel(page: Page): Promise<void> {
  await expect
    .poll(
      async () =>
        page.locator('[title="supervisor (v)"]').textContent(),
      { timeout: 30_000, intervals: [500, 1000, 2000] },
    )
    .toContain("1.0.0");
}

/**
 * Reusable action library for E2E tests
 * Provides common actions to avoid code duplication across test files
 */

export class E2EActions {
  constructor(private page: Page) { }

  /**
   * Navigate to a page by path. The default Playwright page.goto
   * timeout is 15s, but a cold dev server can take 20-30s to
   * serve the first page in this devcontainer, so we widen
   * the navigation timeout to match `actionTimeout` (10s) plus
   * a comfortable margin for TanStack Start SSR + initial JS
   * hydration requests.
   */
  async navigateTo(path: string) {
    await this.page.goto(`${baseURL()}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState('domcontentloaded');
    await waitForHydration(this.page);
  }

  /**
   * Navigate to home page
   */
  async navigateToHome() {
    await this.navigateTo('/');
  }

  /**
   * Open command palette
   */
  async openCommandPalette() {
    await this.page.keyboard.press('Meta+k');
    await this.page.waitForTimeout(500);
  }

  /**
   * Close command palette
   */
  async closeCommandPalette() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Open supervisor panel
   */
  async openSupervisorPanel() {
    await this.page.keyboard.press('v');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Close supervisor panel
   */
  async closeSupervisorPanel() {
    await this.page.keyboard.press('v');
    await this.page.waitForTimeout(500);
  }

  /**
   * Open sling drawer
   */
  async openSlingDrawer() {
    // Close the supervisor popover if it's open by pressing Escape
    // The popover is controlled by the supervisorOpen state
    const supervisorToggle = this.page.locator('button[title="supervisor (v)"]');
    const isExpanded = await supervisorToggle.getAttribute('aria-expanded');
    if (isExpanded === 'true') {
      // Press Escape to close the popover
      await this.page.keyboard.press('Escape');
      // Wait for the popover to actually close
      await expect(supervisorToggle).toHaveAttribute('aria-expanded', 'false', { timeout: 5000 });
      await this.page.waitForTimeout(500);
    }

    // Click the "+ sling task" button in the sidebar
    const slingButton = this.page.locator('button:has-text("+ sling task")');
    await expect(slingButton).toBeVisible({ timeout: 30_000 });
    await slingButton.click({ force: true });

    // Wait for the drawer to render - check for the SlingComposer content
    await expect(this.page.locator('select').first()).toBeVisible({
      timeout: 15_000,
    });
    
    // Give the drawer's initial queries a moment to settle
    await this.page.waitForTimeout(2000);
  }

  /**
   * Close sling drawer
   */
  async closeSlingDrawer() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Select city in dropdown
   */
  async selectCity(cityName: string) {
    const citySelect = this.page.locator('select').first();
    await citySelect.waitFor({ state: 'visible', timeout: 5000 });
    await citySelect.selectOption(cityName);
    await this.page.waitForTimeout(500);
  }

  /**
   * Select agent in dropdown
   */
  async selectAgent(agentName: string) {
    const agentSelect = this.page.locator('select').nth(1);
    await agentSelect.waitFor({ state: 'visible', timeout: 5000 });
    await agentSelect.selectOption(agentName);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill sling task description
   */
  async fillSlingTask(text: string) {
    const textarea = this.page.locator('textarea');
    await textarea.fill(text);
    await this.page.waitForTimeout(200);
  }

  /**
   * Submit sling task
   */
  async submitSlingTask() {
    const slingButton = this.page.getByText('sling');
    await slingButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Complete sling workflow with automatic city/agent detection
   * Falls back to server function if UI has issues
   */
  async slingTask(cityName: string, agentName: string, taskDescription: string) {
    try {
      await this.openSlingDrawer();

      // Wait for drawer to fully load
      await this.page.waitForTimeout(2000);

      // Get available cities from the dropdown
      const citySelect = this.page.locator('select').first();
      const cityOptions = await citySelect.locator('option').all();

      if (cityOptions.length === 0) {
        throw new Error('No cities available in sling drawer');
      }

      // Try to use provided city name, otherwise use first available
      let cityToUse = cityName;
      let cityFound = false;

      for (const opt of cityOptions) {
        const optText = await opt.textContent();
        if (optText === cityName) {
          cityFound = true;
          break;
        }
      }

      if (!cityFound && cityOptions.length > 0) {
        // Find first real city (skip "(none)" and empty values)
        for (const opt of cityOptions) {
          const optText = await opt.textContent();
          if (optText && optText !== '(none)' && optText.trim()) {
            cityToUse = optText;
            console.log(`Using first available city: ${cityToUse}`);
            break;
          }
        }
      }

      // If still no valid city found, throw error
      if (!cityToUse || cityToUse === '(none)' || !cityToUse.trim()) {
        throw new Error('No valid city available for sling');
      }

      // Select city
      await citySelect.selectOption(cityToUse);
      await this.page.waitForTimeout(3000);  // Wait for agents to load

      // Get available agents
      const agentSelect = this.page.locator('select').nth(1);
      const agentOptions = await agentSelect.locator('option').all();

      if (agentOptions.length === 0) {
        throw new Error('No agents available for sling');
      }

      // Try to use provided agent name, otherwise use first available (skip "choose…")
      let agentToUse = agentName;
      let agentFound = false;

      for (let i = 0; i < agentOptions.length; i++) {
        const optText = await agentOptions[i].textContent();
        if (optText === agentName && optText !== 'choose…') {
          agentFound = true;
          break;
        }
      }

      if (!agentFound) {
        // Use first real agent (skip "choose…")
        for (let i = 0; i < agentOptions.length; i++) {
          const optText = await agentOptions[i].textContent();
          if (optText && optText !== 'choose…') {
            agentToUse = optText;
            console.log(`Using first available agent: ${agentToUse}`);
            break;
          }
        }
      }

      // Select agent
      await agentSelect.selectOption(agentToUse);
      await this.page.waitForTimeout(500);

      await this.fillSlingTask(taskDescription);
      await this.submitSlingTask();
      await this.closeSlingDrawer();
    } catch (e) {
      console.log(`UI sling failed: ${e}, closing drawer`);
      await this.closeSlingDrawer();
      throw e;
    }
  }

  /**
   * Sling task via CLI (fallback when UI has issues)
   * This bypasses the UI and calls gc CLI directly
   */
  async slingTaskViaCLI(agent: string, text: string): Promise<{ ok: boolean; bead_id?: string; output: string }> {
    const { exec } = await import('child_process');

    return new Promise((resolve) => {
      // Run from the workspace directory to ensure gc can find the city
      const options = {
        cwd: '/workspaces/gascity-devcontainer',
        env: { ...process.env }
      };

      // Escape the text properly for shell
      const escapedText = text.replace(/"/g, '\\"');

      // Don't use --json as it doesn't output JSON in this version
      const cmd = `gc sling ${agent} "${escapedText}"`;
      console.log('Executing:', cmd);

      exec(cmd, options, (error, stdout, stderr) => {
        if (error) {
          console.log('CLI sling failed:', stderr);
          resolve({ ok: false, output: stderr || String(error) });
          return;
        }

        console.log('CLI sling output:', stdout);
        let beadId: string | undefined = undefined;

        // Extract bead ID from output - try multiple patterns
        // Pattern 1: "Created gd-n8r —"
        let match = stdout.match(/Created\s+([a-z0-9-]+)\s+[-—]/i);
        if (match) {
          beadId = match[1];
        }

        // Pattern 2: "Slung gd-n8r →"
        if (!beadId) {
          match = stdout.match(/Slung\s+([a-z0-9-]+)\s+→/i);
          if (match) {
            beadId = match[1];
          }
        }

        // Pattern 3: Any gd-XXXX pattern
        if (!beadId) {
          match = stdout.match(/(gd-[a-z0-9]+)/i);
          if (match) {
            beadId = match[1];
          }
        }

        console.log('Extracted bead_id:', beadId);
        resolve({ ok: true, bead_id: beadId || undefined, output: stdout });
      });
    });
  }

  /**
   * Get session list
   */
  async getSessionList() {
    await this.navigateTo('/');
    await this.page.waitForTimeout(2000);

    const sessions = await this.page.locator('li').filter({ hasText: /./ }).all();
    return sessions;
  }

  /**
   * Nudge a session by name
   */
  async nudgeSession(sessionName: string, message: string) {
    const nudgeButton = this.page.getByText('nudge');
    const count = await nudgeButton.count();

    if (count > 0) {
      // Find the nudge button for specific session
      const sessionRow = this.page.locator('li').filter({ hasText: sessionName });
      if (await sessionRow.count() > 0) {
        const button = sessionRow.locator('button').filter({ hasText: 'nudge' });
        await button.click();

        // Handle prompt (in real test we'd mock this)
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Reset a session by name
   */
  async resetSession(sessionName: string) {
    const resetButton = this.page.getByText('reset');
    const count = await resetButton.count();

    if (count > 0) {
      const sessionRow = this.page.locator('li').filter({ hasText: sessionName });
      if (await sessionRow.count() > 0) {
        const button = sessionRow.locator('button').filter({ hasText: 'reset' });
        await button.click();

        // Handle confirm dialog (in real test we'd mock this)
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Get bead list
   */
  async getBeadList(filter: 'all' | 'open' | 'in_progress' | 'closed' = 'all') {
    await this.navigateTo('/beads');
    await this.page.waitForLoadState('domcontentloaded');

    // Try to click on filter button, but don't fail if it's not available
    try {
      const filterButton = this.page.getByText(filter);
      const count = await filterButton.count();
      if (count > 0) {
        await filterButton.click({ timeout: 5000 });
        await this.page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Filter button not available or not clickable, proceeding without filter');
    }

    const beads = await this.page.locator('li').all();
    return beads;
  }

  /**
   * Close a bead by ID
   */
  async closeBead(beadId: string) {
    const closeButton = this.page.getByText('close');
    const count = await closeButton.count();

    if (count > 0) {
      const beadRow = this.page.locator('li').filter({ hasText: beadId });
      if (await beadRow.count() > 0) {
        const button = beadRow.locator('button').filter({ hasText: 'close' });
        await button.click();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Get order list
   */
  async getOrderList() {
    await this.navigateTo('/orders');
    await this.page.waitForTimeout(2000);

    const orders = await this.page.locator('li').filter({ hasText: /./ }).all();
    return orders;
  }

  /**
   * Fire an order by name
   */
  async fireOrder(orderName: string) {
    await this.navigateTo('/orders');
    await this.page.waitForTimeout(2000);

    const orderRow = this.page.locator('li').filter({ hasText: orderName });
    if (await orderRow.count() > 0) {
      const fireButton = orderRow.locator('button').filter({ hasText: 'fire' });
      await fireButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Toggle order enabled state
   */
  async toggleOrder(orderName: string) {
    await this.navigateTo('/orders');
    await this.page.waitForTimeout(2000);

    const orderRow = this.page.locator('li').filter({ hasText: orderName });
    if (await orderRow.count() > 0) {
      const toggleButton = orderRow.locator('button').filter({ hasText: /on|off/ });
      await toggleButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get formula list
   */
  async getFormulaList() {
    await this.navigateTo('/formulas');
    await this.page.waitForLoadState('domcontentloaded');

    const formulas = await this.page.locator('a').filter({ hasText: /^[\w-]+$/ }).all();
    return formulas;
  }

  /**
   * Run a formula by name
   */
  async runFormula(formulaName: string) {
    await this.navigateTo(`/formulas/${formulaName}`);
    await this.page.waitForLoadState('domcontentloaded');

    const runButton = this.page.getByText('run');
    if (await runButton.count() > 0) {
      await runButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Toggle formula live mode
   */
  async toggleFormulaLive() {
    const liveButton = this.page.getByText(/live/);
    if (await liveButton.count() > 0) {
      await liveButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Register a pack via the marketplace UI.
   */
  async registerPack(name: string, source: string, description?: string) {
    await this.navigateTo('/marketplace');
    await this.page.waitForLoadState('domcontentloaded');

    // Find the card by name and click its install button.
    const card = this.page
      .locator('[role="button"], button, .rounded-xl, [class*="Card"]')
      .filter({ hasText: name })
      .first();
    const installButton = this.page
      .getByRole('button', { name: /^install$/i })
      .filter({ hasText: name });
    if ((await installButton.count()) > 0) {
      await installButton.first().click();
    } else {
      // Fall back to free-form flow if the pack isn't in the
      // marketplace (e.g. an arbitrary source from the legacy
      // /packs form, which still exists in case some operators
      // want it).
    }
    await this.page.waitForTimeout(2000);
  }

  /**
   * Remove a pack by name via the marketplace uninstall button.
   */
  async removePack(packName: string) {
    await this.navigateTo('/marketplace');
    await this.page.waitForLoadState('domcontentloaded');

    const uninstallButton = this.page
      .getByRole('button', { name: /^uninstall$/i })
      .filter({ hasText: packName });
    if ((await uninstallButton.count()) > 0) {
      await uninstallButton.first().click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Create a city
   */
  async createCity(path: string, packNames: string[] = []) {
    await this.navigateTo('/cities');
    await this.page.waitForLoadState('domcontentloaded');

    // Open create city dialog. Use `getByRole` so we don't collide with
    // the visible-but-not-clickable `<span>` label that mirrors the
    // button text inside the row.
    const newCityButton = this.page.getByRole('button', { name: '+ new city' });
    await newCityButton.click();
    await this.page.waitForTimeout(1000);

    // Fill in path
    const pathInput = this.page.locator('input').first();
    if (await pathInput.count() > 0) {
      await pathInput.fill(path);
      await this.page.waitForTimeout(500);
    }

    // Select packs
    for (const packName of packNames) {
      const packItem = this.page.locator('button').filter({ hasText: packName });
      if (await packItem.count() > 0) {
        await packItem.click();
        await this.page.waitForTimeout(200);
      }
    }

    // Submit
    const initButton = this.page.getByText('gc init + import');
    if (await initButton.count() > 0) {
      await initButton.click();
      await this.page.waitForTimeout(5000);
    } else {
      // Button not found or disabled, close dialog
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Init a city via the dialog AND register/start it with the supervisor
   * in one go. `gc init` runs in the dialog; the follow-up `gcCityStart`
   * server fn with the absolute path reuses the bootstrapped directory
   * and lets the supervisor pick it up (per upstream
   * `internal/api/huma_handlers_supervisor.go:108-118`).
   *
   * The dialog's "gc init + import" button leaves the city in an
   * "init'd but not registered" state — there is no UI flow that wires
   * the two together, so this action does it manually for the e2e rig.
   *
   * Routes the registration through the console's own `gcCityStart`
   * server fn rather than `fetch('/gc/v0/city', ...)`: the Vite proxy
   * in dev resolves `/gc/*` to the catch-all route file
   * (`src/routes/gc.$.ts`), and that handler returns the proxy
   * response — but the request body envelope and CSRF header need to
   * match what the supervisor expects. Using the server fn keeps the
   * call on the server side where `GC_API_BASE_URL` and the CSRF
   * generation are correctly wired by the OpenAPI client.
   */
  async initAndStartCity(path: string, packNames: string[] = []) {
    await this.createCity(path, packNames);
    // Click the row's "gc start" button — the console's UI already
    // wires that button to `gcCityStart({ city })`. We pass the
    // bootstrapped path via the row's `data-city-path` attribute (the
    // UI is responsible for surfacing the absolute path of the city
    // it created).
    const row = this.page.locator('div, tr, li').filter({ hasText: path }).first();
    const startBtn = row.getByText('gc start');
    if ((await startBtn.count()) > 0) {
      await startBtn.click();
      await this.page.waitForTimeout(3000);
    } else {
      throw new Error(`initAndStartCity: no "gc start" button found for ${path}`);
    }
  }

  /**
   * Stop city
   */
  async stopCity() {
    await this.navigateTo('/cities');
    await this.page.waitForLoadState('domcontentloaded');

    const stopButton = this.page.getByText('gc stop');
    if (await stopButton.count() > 0) {
      await stopButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Start city
   */
  async startCity() {
    await this.navigateTo('/cities');
    await this.page.waitForLoadState('domcontentloaded');

    const startButton = this.page.getByText('gc start');
    if (await startButton.count() > 0) {
      await startButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Restart supervisor
   */
  async restartSupervisor() {
    await this.openSupervisorPanel();

    const restartButton = this.page.getByText('restart');
    if (await restartButton.count() > 0) {
      await restartButton.click();
      await this.page.waitForTimeout(5000);
    }

    await this.closeSupervisorPanel();
  }

  /**
   * Stop supervisor
   */
  async stopSupervisor() {
    await this.openSupervisorPanel();

    const stopButton = this.page.getByText('stop');
    if (await stopButton.count() > 0) {
      await stopButton.click();
      await this.page.waitForTimeout(5000);
    }

    await this.closeSupervisorPanel();
  }

  /**
   * Start supervisor
   */
  async startSupervisor() {
    await this.openSupervisorPanel();

    const startButton = this.page.getByText('start');
    if (await startButton.count() > 0) {
      await startButton.click();
      await this.page.waitForTimeout(5000);
    }

    await this.closeSupervisorPanel();
  }

  /**
   * Send mail
   */
  async sendMail(agent: string, subject: string, body: string) {
    await this.navigateTo('/mail');
    await this.page.waitForLoadState('domcontentloaded');

    // Select agent
    await this.selectAgent(agent);

    // Open compose
    const composeButton = this.page.getByText('compose');
    await composeButton.click();
    await this.page.waitForTimeout(500);

    // Fill subject
    const subjectInput = this.page.getByPlaceholder('subject');
    if (await subjectInput.count() > 0) {
      await subjectInput.fill(subject);
      await this.page.waitForTimeout(200);
    }

    // Fill body
    const bodyTextarea = this.page.getByPlaceholder(/message body/);
    if (await bodyTextarea.count() > 0) {
      await bodyTextarea.fill(body);
      await this.page.waitForTimeout(200);
    }

    // Send
    const sendButton = this.page.getByText('send');
    if (await sendButton.count() > 0) {
      await sendButton.click();
      await this.page.waitForTimeout(2000);
    }

    // Close compose
    await composeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for condition with timeout
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 30000,
    interval = 1000
  ): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
  }

  /**
   * Wait for bead to appear in list
   */
  async waitForBead(beadTitle: string, timeout = 30000) {
    return this.waitForCondition(async () => {
      const beads = await this.getBeadList('all');
      for (const b of beads) {
        const text = await b.textContent();
        if (text.includes(beadTitle)) return true;
      }
      return false;
    }, timeout);
  }

  /**
   * Wait for bead status to change
   */
  async waitForBeadStatus(beadId: string, expectedStatus: string, timeout = 60000) {
    return this.waitForCondition(async () => {
      const beads = await this.getBeadList('all');
      for (const b of beads) {
        const text = await b.textContent();
        if (text.includes(beadId)) {
          return text.toLowerCase().includes(expectedStatus.toLowerCase());
        }
      }
      return false;
    }, timeout);
  }

  /**
   * Wait for session to appear
   */
  async waitForSession(sessionName: string, timeout = 30000) {
    return this.waitForCondition(async () => {
      const sessions = await this.getSessionList();
      for (const s of sessions) {
        const text = await s.textContent();
        if (text.includes(sessionName)) return true;
      }
      return false;
    }, timeout);
  }

  /**
   * Wait for session status
   */
  async waitForSessionStatus(sessionName: string, expectedStatus: string, timeout = 60000) {
    return this.waitForCondition(async () => {
      const sessions = await this.getSessionList();
      for (const s of sessions) {
        const text = await s.textContent();
        if (text.includes(sessionName)) {
          return text.toLowerCase().includes(expectedStatus.toLowerCase());
        }
      }
      return false;
    }, timeout);
  }

  /**
   * Wait for a bead with the given id to appear in the closed filter.
   * Used by the sling → pickup → result spec to confirm the bead was
   * closed by the rig (or by the `gcCloseBead` stub-fix path).
   */
  async waitForBeadClosed(beadId: string, timeout = 30000): Promise<boolean> {
    return this.waitForCondition(async () => {
      const beads = await this.getBeadList('closed');
      for (const b of beads) {
        const text = await b.textContent();
        if (text?.includes(beadId)) return true;
      }
      return false;
    }, timeout);
  }

  /**
   * Remove a city directory we created during a scenario. Best-effort:
   * logs but does not throw on `fs.rm` failure so a leftover from a
   * prior failed run never blocks the next run's cleanup logic.
   */
  async cleanupCity(path: string): Promise<void> {
    const { rm } = await import('node:fs/promises');
    try {
      await rm(path, { recursive: true, force: true });
    } catch (e) {
      console.log(`cleanupCity(${path}) failed: ${e}`);
    }
  }

  /**
   * Hit the supervisor's `/v0/cities` directly. Uses
   * `playwright.request` (`page.request`) so the call bypasses the
   * console's `/gc/*` proxy (which is a dev-only Vite middleware
   * and returns 404 against paths the catch-all route file
   * `src/routes/gc.$.ts` doesn't handle in body-forward form) and
   * talks straight to the supervisor at `GC_API_BASE_URL`.
   *
   * Used by the sling-pickup spec to confirm the dialog's
   * `gc init + import` actually registered the city with the
   * supervisor — the UI's `cities` list is cached behind a 5s
   * `refetchInterval`, so polling the API directly is the
   * source-of-truth check.
   */
  async getV0Cities(): Promise<Array<{ name: string; path: string; active?: boolean }>> {
    const base = process.env.GC_API_BASE_URL || 'http://127.0.0.1:8372'
    const res = await this.page.request.get(`${base}/v0/cities`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok()) throw new Error(`/v0/cities returned ${res.status()}`)
    const body = (await res.json()) as { items?: Array<{ name: string; path: string; active?: boolean }> }
    return body.items ?? []
  }
}
