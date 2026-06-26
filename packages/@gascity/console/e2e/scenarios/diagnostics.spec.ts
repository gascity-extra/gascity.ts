import { test, expect } from '@playwright/test';
import { E2EActions, isGcBackendReachable } from '../lib/actions';

/**
 * Diagnostic test to understand sling drawer state
 *
 * Skipped without a live GC supervisor.
 */
test.describe('Sling Drawer Diagnostics', () => {
  let actions: E2EActions;

  test.beforeAll(async () => {
    if (!(await isGcBackendReachable())) {
      test.skip(true, 'GC supervisor unreachable; scenario tests require a live backend.');
    }
  });

  test.beforeEach(async ({ page, baseURL }) => {
    actions = new E2EActions(page);
    await actions.navigateToHome();
  });

  test('diagnose sling drawer state', async ({ page, baseURL }) => {
    console.log('=== SLING DRAWER DIAGNOSTICS ===');

    // Check cities page
    await actions.navigateTo('/cities');
    await page.waitForTimeout(2000);
    const citiesPage = await page.content();
    console.log('Cities page content length:', citiesPage.length);
    console.log('Has "no cities":', citiesPage.toLowerCase().includes('no cities'));
    console.log('Has "active":', citiesPage.toLowerCase().includes('active'));

    // Navigate to home and try opening sling drawer via button
    await actions.navigateTo('/');
    await page.waitForTimeout(2000);

    // Try clicking sling button in sidebar
    const slingButton = page.getByText('sling task');
    const slingCount = await slingButton.count();

    if (slingCount > 0) {
      console.log('Found sling button, clicking it');
      await slingButton.click();
    } else {
      console.log('Sling button not found, trying keyboard shortcut');
      await page.keyboard.press('n');
    }

    await page.waitForTimeout(5000);  // Wait longer for drawer to load

    // Get drawer content
    const drawerContent = await page.content();
    console.log('Drawer content length:', drawerContent.length);
    console.log('Drawer content (first 500 chars):', drawerContent.substring(0, 500));

    // Check for select elements
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log('Select elements found:', selectCount);

    if (selectCount > 0) {
      const firstSelect = selects.first();
      const options = await firstSelect.locator('option').all();
      console.log('Options in first select:', options.length);

      for (let i = 0; i < Math.min(options.length, 5); i++) {
        const optText = await options[i].textContent();
        console.log(`  Option ${i}: "${optText}"`);
      }
    }

    // Check for buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('Buttons found:', buttonCount);

    // Check for textarea
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log('Textareas found:', textareaCount);

    // Take screenshot for manual inspection
    await page.screenshot({ path: '/tmp/sling-drawer-diagnostic.png' });
    console.log('Screenshot saved to /tmp/sling-drawer-diagnostic.png');

    // Close drawer
    await actions.closeSlingDrawer();
  });
});
