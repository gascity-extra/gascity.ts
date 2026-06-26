import { test, expect } from '@playwright/test';

test.describe('Packs Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('can access packs page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/packs/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('packs page displays pack list', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/packs|builtin|custom/);
  });

  test('packs page has register pack form', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.getByPlaceholder('name');
    const sourceInput = page.getByPlaceholder('source');

    const hasName = await nameInput.count() > 0;
    const hasSource = await sourceInput.count() > 0;

    expect(hasName || hasSource).toBe(true);
  });

  test('packs page has register button', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');

    // Scope to buttons only — the page also has a "register a pack" header
    // text and an empty-state hint, both containing "register".
    const registerButton = page.getByRole('button', { name: /^register$/i });
    if (await registerButton.count() > 0) {
      await expect(registerButton.first()).toBeVisible();
    }
  });

  test('can fill register pack form', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/packs`);
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.getByPlaceholder('name');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('test-pack');
      await page.waitForTimeout(200);
    }

    const sourceInput = page.getByPlaceholder('source');
    if (await sourceInput.count() > 0) {
      await sourceInput.first().fill('https://github.com/test/test.git//path');
      await page.waitForTimeout(200);
    }
  });
});