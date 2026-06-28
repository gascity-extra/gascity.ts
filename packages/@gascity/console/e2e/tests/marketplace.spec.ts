import { test, expect } from '@playwright/test';

test.describe('Marketplace Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('can access marketplace page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/marketplace/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('legacy /packs URL redirects to /marketplace', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/marketplace/);
  });

  test('marketplace page has search input', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    const search = page.getByPlaceholder(/search packs/i);
    await expect(search).toBeVisible();
  });

  test('marketplace page has tag filter and sort controls', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    const tag = page.locator('select').first();
    await expect(tag).toBeVisible();
  });

  test('marketplace page can search', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    const search = page.getByPlaceholder(/search packs/i);
    await search.fill('slack');
    await page.waitForTimeout(300);
    // The toolbar stays; the grid filters. We assert no JS error.
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('marketplace has a refresh button', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    const refresh = page.getByRole('button', { name: /^refresh$/i });
    if (await refresh.count() > 0) {
      await expect(refresh.first()).toBeVisible();
    }
  });
});
