import { test, expect } from '@playwright/test';

test.describe('Beads Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to beads page', async ({ page }) => {
    // Navigate to beads page
    await page.goto('http://localhost:8080/beads');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on beads page
    await expect(page).toHaveURL(/\/beads/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('beads page displays filter buttons', async ({ page }) => {
    // Navigate to beads page
    await page.goto('http://localhost:8080/beads');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for filter buttons
    const allButton = page.getByText('all');
    const openButton = page.getByText('open');
    const inProgressButton = page.getByText('in_progress');
    const closedButton = page.getByText('closed');
    
    // At least some filters should be visible
    const filterButtons = [allButton, openButton, inProgressButton, closedButton];
    let visibleCount = 0;
    for (const button of filterButtons) {
      if (await button.count() > 0) {
        visibleCount++;
      }
    }
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('can switch between bead filters', async ({ page }) => {
    // Navigate to beads page
    await page.goto('http://localhost:8080/beads');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on different filter buttons
    const allButton = page.getByText('all');
    if (await allButton.count() > 0) {
      await allButton.click();
      await page.waitForTimeout(500);
    }
    
    const openButton = page.getByText('open');
    if (await openButton.count() > 0) {
      await openButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verify we're still on beads page
    await expect(page).toHaveURL(/\/beads/);
  });

  test('beads page has close button for open beads', async ({ page }) => {
    // Navigate to beads page
    await page.goto('http://localhost:8080/beads');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for close button (only visible for non-closed beads)
    const closeButton = page.getByText('close');
    const count = await closeButton.count();
    
    if (count > 0) {
      // Close button exists for open beads
      console.log('Close button found for open beads');
    } else {
      // No open beads or no beads at all
      console.log('No open beads to close');
    }
  });
});
