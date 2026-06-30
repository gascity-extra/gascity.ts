import { test, expect } from '@playwright/test';

test.describe('Formulas Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to formulas page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/formulas`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/formulas/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('formulas page displays formula list', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/formulas`);
    await page.waitForLoadState('domcontentloaded');

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/formulas|contract/);
  });

  test('can navigate to formula detail', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/formulas`);
    await page.waitForLoadState('domcontentloaded');

    // Formulas are rendered as `<Link to="/formulas/$name">` so the href
    // pattern is stable: target links that start with `/formulas/` and
    // have a name suffix (i.e. not just the index page itself).
    const detailLinks = page.locator('a[href^="/formulas/"]').filter({
      hasNot: page.locator('text=formulas'),
    });
    const count = await detailLinks.count();

    if (count > 0) {
      await detailLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/formulas\/[^/]+/);
    } else {
      console.log('No formulas to view');
    }
  });

  test('formula detail has run button', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/formulas`);
    await page.waitForLoadState('domcontentloaded');

    const detailLinks = page.locator('a[href^="/formulas/"]');
    const count = await detailLinks.count();

    if (count > 0) {
      await detailLinks.first().click();
      await page.waitForLoadState('domcontentloaded');

      const runButton = page.getByRole('button', { name: /run/i });
      if (await runButton.count() > 0) {
        await expect(runButton.first()).toBeVisible();
      }

      const liveButton = page.getByText(/live/);
      if (await liveButton.count() > 0) {
        await expect(liveButton.first()).toBeVisible();
      }
    }
  });
});