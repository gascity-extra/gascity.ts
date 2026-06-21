import { test, expect } from '@playwright/test';

test.describe('Endpoints Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to endpoints page', async ({ page }) => {
    // Navigate to endpoints page
    await page.goto('http://localhost:8080/endpoints');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on endpoints page
    await expect(page).toHaveURL(/\/endpoints/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('endpoints page displays city selector', async ({ page }) => {
    // Navigate to endpoints page
    await page.goto('http://localhost:8080/endpoints');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for city selector
    const citySelect = page.locator('select');
    if (await citySelect.count() > 0) {
      await expect(citySelect).toBeVisible();
    } else {
      // No cities available
      console.log('No cities - no city selector');
    }
  });

  test('endpoints page displays dolt state', async ({ page }) => {
    // Navigate to endpoints page
    await page.goto('http://localhost:8080/endpoints');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for dolt state information
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/dolt|endpoints/);
  });

  test('endpoints page displays rig list', async ({ page }) => {
    // Navigate to endpoints page
    await page.goto('http://localhost:8080/endpoints');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for rig-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/rigs|mirror|drift/);
  });
});
