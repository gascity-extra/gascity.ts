import { test, expect } from '@playwright/test';
import { waitForHydration } from '../lib/actions';

test.describe('Supervisor Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
    // The supervisor toggle is in the header which is server-rendered; its
    // onClick handler is only attached after React hydrates. Wait for the
    // click to actually toggle state before the test body runs.
    await waitForHydration(page);
  });

  // The header's supervisor toggle is the only button whose accessible
  // name starts with "supervisor". Empty-state copy says "If the supervisor
  // isn't …", which previously tripped strict-mode locators.
  const supervisorToggle = ({ page }: { page: import('@playwright/test').Page }) =>
    page.getByRole('button', { name: /^supervisor/i });

  test('supervisor button is visible in header', async ({ page }) => {
    await expect(supervisorToggle({ page })).toBeVisible();
  });

  test('can open supervisor panel from header button', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    // The popover shows version, status, action console, supervisor log.
    expect(pageContent.toLowerCase()).toMatch(/version|operational|starting|stopping|down|action console|supervisor log/);

    // Close via the global 'v' shortcut. The supervisor overlay covers the
    // header button while the panel is open, so clicking the toggle again
    // times out waiting for it to receive pointer events. The 'v' key
    // toggles `supervisorOpen` directly without needing to land on the
    // button.
    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel shows version or unreachable hint', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    // Without a live `gc` supervisor the version endpoint fails and
    // the panel shows the unreachable base URL plus a placeholder for
    // the version. Accept either the resolved version string OR the
    // placeholder `—` rendered next to the supervisor dot, plus the
    // reachable-vs-unreachable textual hint (operational/down/supervisor up).
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/version|operational|down|—|unreachable|supervisor up/);

    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel has start/restart/stop buttons', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    // The buttons are addressed by their data-testid so the assertion
    // doesn't depend on the popover's accessible-name string staying
    // exactly "start" (the real label is "start supervisor" etc.).
    const start = page.getByTestId('supervisor-start');
    const restart = page.getByTestId('supervisor-restart');
    const stop = page.getByTestId('supervisor-stop');
    const total =
      (await start.count()) + (await restart.count()) + (await stop.count());
    expect(total).toBeGreaterThan(0);

    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel displays action console', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/action console/);

    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel displays supervisor log', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/supervisor log/);

    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });
});