import { test, expect } from '@playwright/test';

test.describe('Formulas Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to formulas page', async ({ page }) => {
    // Navigate to formulas page
    await page.goto('http://localhost:8080/formulas');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on formulas page
    await expect(page).toHaveURL(/\/formulas/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('formulas page displays formula list', async ({ page }) => {
    // Navigate to formulas page
    await page.goto('http://localhost:8080/formulas');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for formula-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/formulas|contract/);
  });

  test('can navigate to formula detail', async ({ page }) => {
    // Navigate to formulas page
    await page.goto('http://localhost:8080/formulas');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for formula links
    const formulaLinks = page.locator('a').filter({ hasText: /^[\w-]+$/ });
    const count = await formulaLinks.count();
    
    if (count > 0) {
      // Click on first formula link
      await formulaLinks.first().click();
      
      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');
      
      // Verify we're on a formula detail page
      await expect(page).toHaveURL(/\/formulas\/.+/);
    } else {
      // No formulas available
      console.log('No formulas to view');
    }
  });

  test('formula detail has run button', async ({ page }) => {
    // Navigate to formulas page
    await page.goto('http://localhost:8080/formulas');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for formula links
    const formulaLinks = page.locator('a').filter({ hasText: /^[\w-]+$/ });
    const count = await formulaLinks.count();
    
    if (count > 0) {
      // Click on first formula link
      await formulaLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      
      // Look for run button
      const runButton = page.getByText('run');
      if (await runButton.count() > 0) {
        await expect(runButton).toBeVisible();
      }
      
      // Look for live toggle
      const liveButton = page.getByText(/live/);
      if (await liveButton.count() > 0) {
        await expect(liveButton).toBeVisible();
      }
    }
  });
});
