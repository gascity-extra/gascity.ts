import { test, expect } from '@playwright/test';

/**
 * API diagnostics to check GC functions
 */
test.describe('GC API Diagnostics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('domcontentloaded');
  });

  test('check GC cities API via browser console', async ({ page }) => {
    console.log('=== GC API DIAGNOSTICS ===');
    
    // Navigate to cities page to trigger API call
    await page.goto('http://localhost:8080/cities');
    await page.waitForTimeout(3000);
    
    // Check page content
    const pageContent = await page.content();
    console.log('Cities page length:', pageContent.length);
    console.log('Has cities:', !pageContent.toLowerCase().includes('no cities'));
    
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

  test('check network requests for GC API', async ({ page }) => {
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
    await page.goto('http://localhost:8080/cities');
    await page.waitForTimeout(3000);
    
    console.log('Total API requests:', requests.length);
    for (const req of requests) {
      console.log('  -', req);
    }
  });
});
