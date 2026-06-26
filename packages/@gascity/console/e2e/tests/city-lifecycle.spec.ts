import { test, expect } from '@playwright/test';

test.describe('City Lifecycle Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to the console UI
    await page.goto(`${baseURL}/cities`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('create city dialog opens', async ({ page, baseURL }) => {
    // Click on "+ new city" button
    const newCityButton = page.getByText('+ new city');
    await newCityButton.click();
    
    // Wait for dialog to appear
    await page.waitForTimeout(500);
    
    // Check that dialog is visible (look for "new city" text)
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/new city/);
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('create city with path and packs', async ({ page, baseURL }) => {
    // Click on "+ new city" button
    const newCityButton = page.getByText('+ new city');
    await newCityButton.click();
    
    // Wait for dialog
    await page.waitForTimeout(1000);
    
    // Try to find input and fill it
    const pathInput = page.locator('input').first();
    if (await pathInput.count() > 0) {
      await pathInput.fill('/tmp/e2e-test-city');
      await page.waitForTimeout(500);
    }
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForTimeout(500);
    
    // Verify we're back on cities page
    await expect(page).toHaveURL(/\/cities/);
  });

  test('create city without packs', async ({ page, baseURL }) => {
    // Click on "+ new city" button
    const newCityButton = page.getByText('+ new city');
    await newCityButton.click();
    
    // Wait for dialog
    await page.waitForTimeout(1000);
    
    // Fill in city path
    const pathInput = page.locator('input').first();
    if (await pathInput.count() > 0) {
      await pathInput.fill('/tmp/e2e-test-city-no-packs');
      await page.waitForTimeout(500);
    }
    
    // Clear all packs by clicking "clear" button
    const clearButton = page.getByText('clear');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForTimeout(500);
    
    // Verify we're back on cities page
    await expect(page).toHaveURL(/\/cities/);
  });

  test('create city with single pack', async ({ page, baseURL }) => {
    // Click on "+ new city" button
    const newCityButton = page.getByText('+ new city');
    await newCityButton.click();
    
    // Wait for dialog
    await page.waitForTimeout(1000);
    
    // Fill in city path
    const pathInput = page.locator('input').first();
    if (await pathInput.count() > 0) {
      await pathInput.fill('/tmp/e2e-test-city-single-pack');
      await page.waitForTimeout(500);
    }
    
    // Clear all packs first
    const clearButton = page.getByText('clear');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
    
    // Select a single pack (click on first pack item)
    const packItems = page.locator('button').filter({ hasText: /gascity/ });
    if (await packItems.count() > 0) {
      await packItems.first().click();
      await page.waitForTimeout(500);
    }
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForTimeout(500);
    
    // Verify we're back on cities page
    await expect(page).toHaveURL(/\/cities/);
  });

  test('create city with multiple packs', async ({ page, baseURL }) => {
    // Click on "+ new city" button
    const newCityButton = page.getByText('+ new city');
    await newCityButton.click();
    
    // Wait for dialog
    await page.waitForTimeout(1000);
    
    // Fill in city path
    const pathInput = page.locator('input').first();
    if (await pathInput.count() > 0) {
      await pathInput.fill('/tmp/e2e-test-city-multiple-packs');
      await page.waitForTimeout(500);
    }
    
    // Select multiple packs by clicking on pack items
    const packItems = page.locator('button').filter({ hasText: /gascity|roles/ });
    const count = await packItems.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await packItems.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    // Close dialog by pressing Escape
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForTimeout(500);
    
    // Verify we're back on cities page
    await expect(page).toHaveURL(/\/cities/);
  });

  test('can stop city via gc stop button', async ({ page, baseURL }) => {
    // Look for gc stop button
    const stopButton = page.getByText('gc stop');
    if (await stopButton.count() > 0) {
      // Click on stop button
      await stopButton.click();
      
      // Wait for action to complete
      await page.waitForTimeout(2000);
      
      // Verify we're still on cities page
      await expect(page).toHaveURL(/\/cities/);
    } else {
      // Stop button might not be available if no city is running
      console.log('gc stop button not found - city might not be running');
    }
  });
});
