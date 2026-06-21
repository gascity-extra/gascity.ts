import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for @gascity/sdk E2E Tests
 *
 * This configuration is set up to run E2E tests for the Gas City SDK.
 * The tests are designed to work with a running Gas City API instance.
 */
export default defineConfig({
  testDir: './',
  testMatch: '**/*.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:8372',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // Note: This is optional. If you want Playwright to start the API server,
    // you can configure it here. Otherwise, ensure the API is running manually.
    // command: 'npm run start-api',
    // url: 'http://127.0.0.1:8372',
    // reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
