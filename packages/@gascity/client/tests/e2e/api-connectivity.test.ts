import { test, expect } from '@playwright/test';

test.describe('Gas City API Connectivity', () => {
  test('should connect to health endpoint', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:8372/health');
    expect(response.ok()).toBeTruthy();
  });

  test('should get OpenAPI spec', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:8372/openapi.json');
    expect(response.ok()).toBeTruthy();
  });
});
