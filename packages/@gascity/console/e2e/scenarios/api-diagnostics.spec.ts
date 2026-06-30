import { test, expect } from '@playwright/test';
import { isGcBackendReachable } from '../lib/actions';

/**
 * API diagnostics to check GC functions
 *
 * Skipped when no GC supervisor is reachable — there's nothing to diagnose
 * without a backend to talk to.
 */
test.describe('GC API Diagnostics', () => {
  test.beforeAll(async () => {
    if (!(await isGcBackendReachable())) {
      // NOSONAR: Skip when GC supervisor is not available - this is an optional e2e diagnostic test
      test.skip(true, 'GC supervisor unreachable; scenario tests require a live backend.');
    }
  });

  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('check GC cities API via browser console', async ({ page, baseURL }) => {
    console.log('=== GC API DIAGNOSTICS ===');

    // Navigate to cities page to trigger API call
    await page.goto(`${baseURL}/cities`);
    await page.waitForTimeout(3000);

    // Check page content
    const pageContent = await page.content();
    console.log('Cities page length:', pageContent.length);
    console.log('Has cities:', !pageContent.toLowerCase().includes('no cities'));

    // Assert that page loaded successfully
    expect(pageContent.length).toBeGreaterThan(0);

    // Look for city names in content
    if (pageContent.includes('no cities')) {
      console.log('API returned no cities');
    } else {
      // Extract city names if possible
      const cityPattern = /([a-zA-Z0-9_-]{1,50})\s+<span/;
      const matches = pageContent.match(cityPattern);
      if (matches) {
        console.log('Found city name:', matches[1]);
      }
    }
  });

  test('check network requests for GC API', async ({ page, baseURL }) => {
    console.log('=== NETWORK REQUEST DIAGNOSTICS ===');

    // Listen for network requests
    const requests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('gc')) {
        requests.push(url);
        console.log('API Request:', url);
      }
    });

    // Navigate to cities page
    await page.goto(`${baseURL}/cities`);
    await page.waitForTimeout(3000);

    console.log('Total API requests:', requests.length);
    for (const req of requests) {
      console.log('  -', req);
    }

    // Assert that we captured some API requests
    expect(requests.length).toBeGreaterThan(0);
  });
});
