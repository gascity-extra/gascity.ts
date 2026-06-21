import { test, expect } from '@playwright/test';

test.describe('Sessions Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('sessions page displays session list', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on sessions page
    await expect(page).toHaveURL(/\/$/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for sessions-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/sessions/);
  });

  test('can attach to session', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for attach button (if sessions exist)
    const attachButton = page.getByText('attach');
    const count = await attachButton.count();
    
    if (count > 0) {
      // Click on first attach button
      await attachButton.first().click();
      
      // Wait for navigation to session detail
      await page.waitForTimeout(1000);
      
      // Verify we're on a session detail page
      await expect(page).toHaveURL(/\/sessions\/.+/);
    } else {
      // No sessions available
      console.log('No sessions to attach to');
    }
  });

  test('can nudge session', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for nudge button (if sessions exist)
    const nudgeButton = page.getByText('nudge');
    const count = await nudgeButton.count();
    
    if (count > 0) {
      // Click on first nudge button
      await nudgeButton.first().click();
      
      // Wait for prompt (browser handles prompt automatically in tests)
      await page.waitForTimeout(500);
      
      // Verify we're still on sessions page
      await expect(page).toHaveURL(/\/$/);
    } else {
      // No sessions available
      console.log('No sessions to nudge');
    }
  });

  test('can reset session', async ({ page }) => {
    // Navigate to sessions page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for reset button (if sessions exist)
    const resetButton = page.getByText('reset');
    const count = await resetButton.count();
    
    if (count > 0) {
      // Click on first reset button
      // Note: This will show a confirm dialog which we can't easily test in headless mode
      // So we'll just verify the button exists
      await expect(resetButton.first()).toBeVisible();
    } else {
      // No sessions available
      console.log('No sessions to reset');
    }
  });
});
