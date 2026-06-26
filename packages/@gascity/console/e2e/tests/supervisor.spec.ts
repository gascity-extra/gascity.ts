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

  test('supervisor panel displays gc version', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/version/);

    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel has start/restart/stop buttons', async ({ page }) => {
    const toggle = supervisorToggle({ page });
    await toggle.click();
    await page.waitForTimeout(1000);

    const start = page.getByRole('button', { name: /^start$/i });
    const restart = page.getByRole('button', { name: /^restart$/i });
    const stop = page.getByRole('button', { name: /^stop$/i });
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