import { test, expect } from '@playwright/test';

/**
 * Documentation Screenshots
 * 
 * This test file generates screenshots for documentation purposes.
 * Run with: bunx playwright test docs/screenshots/documentation.spec.ts
 */

test.describe('Documentation Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('homepage screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for animations
    await page.screenshot({ path: 'docs/screenshots/homepage.png' });
  });

  test('cities page screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080/cities');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/screenshots/cities.png' });
  });

  test('agents page screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080/agents');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/screenshots/agents.png' });
  });

  test('tasks page screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080/tasks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/screenshots/tasks.png' });
  });

  test('sessions page screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080/sessions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/screenshots/sessions.png' });
  });

  test('navigation menu screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Hover over navigation to show menu
    const nav = page.locator('nav').first();
    await nav.hover();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'docs/screenshots/navigation.png' });
  });

  test('dark mode screenshot', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
    
    // Toggle dark mode if available
    // This depends on your implementation
    try {
      const darkModeToggle = page.getByLabel('dark mode');
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Dark mode toggle not found, skip
    }
    
    await page.screenshot({ path: 'docs/screenshots/dark-mode.png' });
  });
});
