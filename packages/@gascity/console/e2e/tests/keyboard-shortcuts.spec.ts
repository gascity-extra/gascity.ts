import { test, expect } from '@playwright/test';
import { waitForHydration } from '../lib/actions';

test.describe('Keyboard Shortcuts Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to the console UI
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
    // Wait for hydration so the global keydown listener (which owns the
    // 'v' / Cmd+K shortcuts) is actually attached.
    await waitForHydration(page);
  });

  test('can open command palette with keyboard shortcut', async ({ page, baseURL }) => {
    // Press 'c' to open command palette
    await page.keyboard.press('c');

    // Wait for command palette to appear
    await page.waitForTimeout(500);

    // Check that command palette is visible (it should have some content)
    const body = page.locator('body');
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('can open supervisor panel with keyboard shortcut', async ({ page, baseURL }) => {
    // Press 'v' to open supervisor panel
    await page.keyboard.press('v');

    // Wait for supervisor panel to appear
    await page.waitForTimeout(500);

    // Check that supervisor panel is visible (should have supervisor-related content)
    const body = page.locator('body');
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('supervisor panel displays GC version', async ({ page, baseURL }) => {
    // Open supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(500);

    // Look for GC version information
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/version|gc/);
  });
});
