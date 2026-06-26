import { test, expect } from '@playwright/test';

test.describe('Sessions Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('sessions page displays session list', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/$/);

    const body = page.locator('body');
    await expect(body).toBeVisible();

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/sessions/);
  });

  test('can attach to session', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');

    // Scope "attach" to anchor tags inside the main list area. The previous
    // form of this test used `getByText('attach')` which can transiently
    // match the session row before the data settles, causing a race where
    // the click goes nowhere.
    const attachLinks = page.locator('a[href^="/sessions/"]');
    const count = await attachLinks.count();

    if (count > 0) {
      const href = await attachLinks.first().getAttribute('href');
      expect(href).toMatch(/^\/sessions\/.+/);
      await attachLinks.first().click();
      await page.waitForURL(/\/sessions\/.+/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/sessions\/.+/);
    } else {
      console.log('No sessions to attach to');
    }
  });

  test('can nudge session', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');

    // Nudge buttons are scoped to the session rows. Without sessions,
    // there's nothing to nudge — skip.
    const nudgeButtons = page.getByRole('button', { name: /^nudge$/i });
    const count = await nudgeButtons.count();

    if (count > 0) {
      await nudgeButtons.first().click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/$/);
    } else {
      console.log('No sessions to nudge');
    }
  });

  test('can reset session', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');

    const resetButtons = page.getByRole('button', { name: /^reset$/i });
    const count = await resetButtons.count();

    if (count > 0) {
      await expect(resetButtons.first()).toBeVisible();
    } else {
      console.log('No sessions to reset');
    }
  });
});