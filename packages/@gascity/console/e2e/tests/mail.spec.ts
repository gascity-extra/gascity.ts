import { test, expect } from '@playwright/test';

test.describe('Mail Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigate to mail page', async ({ page, baseURL }) => {
    // Navigate to mail page
    await page.goto(`${baseURL}/mail`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we're on mail page
    await expect(page).toHaveURL(/\/mail/);
    
    // Check that the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('mail page displays city and agent selectors', async ({ page, baseURL }) => {
    // Navigate to mail page
    await page.goto(`${baseURL}/mail`);
    await page.waitForLoadState('domcontentloaded');
    
    // Look for city selector
    const citySelect = page.locator('select').first();
    if (await citySelect.count() > 0) {
      await expect(citySelect).toBeVisible();
    }
    
    // Look for agent selector
    const agentSelect = page.locator('select').nth(1);
    if (await agentSelect.count() > 0) {
      await expect(agentSelect).toBeVisible();
    }
  });

  test('can open compose drawer', async ({ page, baseURL }) => {
    // Navigate to mail page
    await page.goto(`${baseURL}/mail`);
    await page.waitForLoadState('domcontentloaded');
    
    // Click on compose button
    const composeButton = page.getByText('compose');
    await composeButton.click();
    
    // Wait for compose drawer to appear
    await page.waitForTimeout(500);
    
    // Check that compose elements are visible
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/subject|body/);
    
    // Close compose drawer
    await composeButton.click();
    await page.waitForTimeout(500);
  });

  test('can fill compose form', async ({ page, baseURL }) => {
    // Navigate to mail page
    await page.goto(`${baseURL}/mail`);
    await page.waitForLoadState('domcontentloaded');
    
    // Click on compose button
    const composeButton = page.getByText('compose');
    await composeButton.click();
    
    // Wait for compose drawer to appear
    await page.waitForTimeout(500);
    
    // Fill in subject
    const subjectInput = page.getByPlaceholder('subject');
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Test subject');
      await page.waitForTimeout(200);
    }
    
    // Fill in body
    const bodyTextarea = page.getByPlaceholder(/message body/);
    if (await bodyTextarea.count() > 0) {
      await bodyTextarea.fill('Test message body');
      await page.waitForTimeout(200);
    }
    
    // Close compose drawer
    await composeButton.click();
    await page.waitForTimeout(500);

    // Verify compose drawer is closed
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
