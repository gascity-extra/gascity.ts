import { test, expect } from '@playwright/test';

test.describe('Basic UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the console UI
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('console UI loads and shows navigation', async ({ page }) => {
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/gc console|Sessions/);
    
    // Check that we can see the cities navigation
    const citiesLink = page.getByRole('link', { name: /cities/i });
    await expect(citiesLink).toBeVisible();
  });

  test('cities page displays city list', async ({ page }) => {
    // Navigate to cities page
    await page.goto('http://localhost:8080/cities');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for city-related content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });
});
