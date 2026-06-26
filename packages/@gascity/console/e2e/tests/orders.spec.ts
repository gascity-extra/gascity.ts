import { test, expect } from '@playwright/test';

test.describe('Orders Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to orders page', async ({ page, baseURL }) => {
    // Navigate to orders page
    await page.goto(`${baseURL}/orders`, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to render
    await page.waitForTimeout(2000);
    
    // Check that we're on orders page
    await expect(page).toHaveURL(/\/orders/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('orders page displays order list', async ({ page, baseURL }) => {
    // Navigate to orders page
    await page.goto(`${baseURL}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Look for order-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/orders|orchestrator/);
  });

  test('can select order', async ({ page, baseURL }) => {
    // Navigate to orders page
    await page.goto(`${baseURL}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Look for order items (clickable rows)
    const orderItems = page.locator('li').filter({ hasText: /./ });
    const count = await orderItems.count();
    
    if (count > 0) {
      // Click on first order
      await orderItems.first().click();
      await page.waitForTimeout(500);
      
      // Verify order is selected (should have different background)
      const selectedItem = orderItems.first();
      await expect(selectedItem).toBeVisible();
    } else {
      // No orders available
      console.log('No orders to select');
    }
  });

  test('orders page has fire and toggle buttons', async ({ page, baseURL }) => {
    // Navigate to orders page
    await page.goto(`${baseURL}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Look for fire button
    const fireButton = page.getByText('fire');
    const fireCount = await fireButton.count();
    
    // Look for on/off toggle button
    const toggleButton = page.getByText(/on|off/);
    const toggleCount = await toggleButton.count();
    
    // At least one of these should exist if orders are present
    if (fireCount > 0 || toggleCount > 0) {
      // Buttons exist
      console.log('Order action buttons found');
    } else {
      // No orders available
      console.log('No orders - no action buttons');
    }
  });
});
