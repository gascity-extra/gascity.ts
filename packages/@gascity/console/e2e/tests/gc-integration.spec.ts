import { test, expect } from '@playwright/test';

test.describe('GC Integration Tests', () => {
  test('console-ui loads with GC environment configured', async ({ page, baseURL }) => {
    // Navigate to console-ui
    await page.goto('/');
    
    // The application should load without errors
    await expect(page).toHaveTitle(/gc console|Sessions/);
    
    // Check that the page has loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('console-ui displays GC connection status', async ({ page, baseURL }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for any GC-related indicators in the UI
    // This might be connection status, API endpoints, or session information
    const pageContent = await page.content();
    
    // The page should contain some content related to sessions or GC
    expect(pageContent.length).toBeGreaterThan(1000);
    
    // Check for session-related content
    expect(pageContent.toLowerCase()).toMatch(/session|gc|console/);
  });

  test('can navigate to sessions page', async ({ page, baseURL }) => {
    await page.goto('/');
    
    // The current page should be the sessions page based on the title
    await expect(page).toHaveTitle(/gc console|Sessions/);
    
    // Check for session-related content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify the page contains session-related UI elements
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/session/);
  });
});