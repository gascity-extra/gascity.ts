import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to the console UI
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to cities page', async ({ page, baseURL }) => {
    // Click on cities navigation
    const citiesLink = page.getByRole('link', { name: /cities/i });
    await citiesLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on the cities page
    await expect(page).toHaveURL(/\/cities/);
  });

  test('can access marketplace page', async ({ page, baseURL }) => {
    // Navigate to marketplace page
    await page.goto(`${baseURL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');

    // Check that we're on the marketplace page
    await expect(page).toHaveURL(/\/marketplace/);

    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('can access formulas page', async ({ page, baseURL }) => {
    // Navigate to formulas page
    await page.goto(`${baseURL}/formulas`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on the formulas page
    await expect(page).toHaveURL(/\/formulas/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('can access orders page', async ({ page, baseURL }) => {
    // Navigate to orders page
    await page.goto(`${baseURL}/orders`, { waitUntil: 'domcontentloaded' });
    
    // Wait a bit for the page to render
    await page.waitForTimeout(2000);
    
    // Check that we're on the orders page
    await expect(page).toHaveURL(/\/orders/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('can access endpoints page', async ({ page, baseURL }) => {
    // Navigate to endpoints page
    await page.goto(`${baseURL}/endpoints`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on the endpoints page
    await expect(page).toHaveURL(/\/endpoints/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
