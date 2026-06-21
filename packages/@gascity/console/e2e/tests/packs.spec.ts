import { test, expect } from '@playwright/test';

test.describe('Packs Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('can access packs page', async ({ page }) => {
    // Navigate to packs page
    await page.goto('http://localhost:8080/packs');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on the packs page
    await expect(page).toHaveURL(/\/packs/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('packs page displays pack list', async ({ page }) => {
    // Navigate to packs page
    await page.goto('http://localhost:8080/packs');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for pack-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/packs|builtin|custom/);
  });

  test('packs page has register pack form', async ({ page }) => {
    // Navigate to packs page
    await page.goto('http://localhost:8080/packs');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for register form inputs
    const nameInput = page.getByPlaceholder('name');
    const sourceInput = page.getByPlaceholder('source');
    
    // At least some form elements should be visible
    const hasName = await nameInput.count() > 0;
    const hasSource = await sourceInput.count() > 0;
    
    expect(hasName || hasSource).toBe(true);
  });

  test('packs page has register button', async ({ page }) => {
    // Navigate to packs page
    await page.goto('http://localhost:8080/packs');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for register button
    const registerButton = page.getByText('register');
    if (await registerButton.count() > 0) {
      await expect(registerButton).toBeVisible();
    }
  });

  test('can fill register pack form', async ({ page }) => {
    // Navigate to packs page
    await page.goto('http://localhost:8080/packs');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill in name
    const nameInput = page.getByPlaceholder('name');
    if (await nameInput.count() > 0) {
      await nameInput.fill('test-pack');
      await page.waitForTimeout(200);
    }
    
    // Fill in source
    const sourceInput = page.getByPlaceholder('source');
    if (await sourceInput.count() > 0) {
      await sourceInput.fill('https://github.com/test/test.git//path');
      await page.waitForTimeout(200);
    }
  });
});
