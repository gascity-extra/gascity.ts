import { test, expect } from '@playwright/test';

test.describe('Supervisor Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('supervisor button is visible in header', async ({ page }) => {
    // Look for supervisor button in header
    const supervisorButton = page.getByText(/supervisor/);
    await expect(supervisorButton).toBeVisible();
  });

  test('can open supervisor panel from header button', async ({ page }) => {
    // Click on supervisor button
    const supervisorButton = page.getByText(/supervisor/);
    await supervisorButton.click();
    
    // Wait for supervisor panel to appear
    await page.waitForTimeout(1000);
    
    // Check that supervisor panel is visible
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/operational|starting|stopping|down/);
    
    // Close supervisor panel
    await supervisorButton.click();
    await page.waitForTimeout(500);
  });

  test('supervisor panel displays gc version', async ({ page }) => {
    // Open supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(1000);
    
    // Look for version information
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/version/);
    
    // Close supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel has start/restart/stop buttons', async ({ page }) => {
    // Open supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(1000);
    
    // Look for control buttons
    const startButton = page.getByText('start');
    const restartButton = page.getByText('restart');
    const stopButton = page.getByText('stop');
    
    // At least some buttons should be visible
    const buttons = [startButton, restartButton, stopButton];
    let visibleCount = 0;
    for (const button of buttons) {
      if (await button.count() > 0) {
        visibleCount++;
      }
    }
    expect(visibleCount).toBeGreaterThan(0);
    
    // Close supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel displays action console', async ({ page }) => {
    // Open supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(1000);
    
    // Look for action console
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/action console/);
    
    // Close supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });

  test('supervisor panel displays supervisor log', async ({ page }) => {
    // Open supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(1000);
    
    // Look for supervisor log
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/supervisor log/);
    
    // Close supervisor panel
    await page.keyboard.press('v');
    await page.waitForTimeout(500);
  });
});
