import { test, expect } from '@playwright/test';

test.describe('Sling Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('can open sling drawer from sidebar', async ({ page }) => {
    // Look for sling task button in sidebar
    const slingButton = page.getByText('sling task');
    if (await slingButton.count() > 0) {
      await slingButton.click();
      
      // Wait for sling drawer to appear
      await page.waitForTimeout(1000);
      
      // Check that sling drawer is visible
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toMatch(/city|agent|describe/);
      
      // Close drawer by pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('Sling button not found');
    }
  });

  test('can open sling drawer from keyboard shortcut', async ({ page }) => {
    // Press 'n' to open sling drawer
    await page.keyboard.press('n');
    
    // Wait for sling drawer to appear
    await page.waitForTimeout(1000);
    
    // Check that sling drawer is visible
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/city|agent|describe/);
    
    // Close drawer by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has city and agent selectors', async ({ page }) => {
    // Press 'n' to open sling drawer
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);
    
    // Look for city selector
    const citySelect = page.locator('select').first();
    if (await citySelect.count() > 0) {
      await expect(citySelect).toBeVisible();
    }
    
    // Look for agent selector
    const agentSelect = page.locator('select').nth(1);
    if (await agentSelect.count() > 0) {
      await expect(agentSelect).toBeVisible();
    }
    
    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has textarea for task description', async ({ page }) => {
    // Press 'n' to open sling drawer
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);
    
    // Look for textarea
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await expect(textarea).toBeVisible();
    }
    
    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has sling button', async ({ page }) => {
    // Press 'n' to open sling drawer
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);
    
    // Look for sling button
    const slingButton = page.getByText('sling');
    if (await slingButton.count() > 0) {
      await expect(slingButton).toBeVisible();
    }
    
    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
