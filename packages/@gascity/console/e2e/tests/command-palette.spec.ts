import { test, expect } from '@playwright/test';

test.describe('Command Palette Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('can open command palette with Cmd+K', async ({ page }) => {
    // Press Cmd+K to open command palette
    await page.keyboard.press('Meta+k');
    
    // Wait for command palette to appear
    await page.waitForTimeout(500);
    
    // Check that command palette is visible
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/type a command/);
    
    // Close command palette by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has sling new task action', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    
    // Look for sling new task action
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/sling/);
    
    // Close command palette
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has supervisor panel action', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    
    // Look for supervisor panel action
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/supervisor/);
    
    // Close command palette
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has navigation actions', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    
    // Look for navigation actions
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/navigate|sessions|mail|beads|formulas|orders|cities|packs|endpoints/);
    
    // Close command palette
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
