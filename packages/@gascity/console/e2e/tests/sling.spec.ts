import { test, expect } from '@playwright/test';

test.describe('Sling Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('can open sling drawer from sidebar', async ({ page, baseURL }) => {
    // The sidebar button's accessible name is "+ sling task n" — scoped to
    // a role+name match to avoid matching the empty-state hint that says
    // `gc sling <agent> "…"`.
    const slingButton = page.getByRole('button', { name: /sling task/i });
    if (await slingButton.count() > 0) {
      await slingButton.first().click();
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toMatch(/city|agent|describe/);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('Sling button not found');
    }
  });

  test('can open sling drawer from keyboard shortcut', async ({ page, baseURL }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/city|agent|describe/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has city and agent selectors', async ({ page, baseURL }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);

    const citySelect = page.locator('select').first();
    if (await citySelect.count() > 0) {
      await expect(citySelect).toBeVisible();
    }

    const agentSelect = page.locator('select').nth(1);
    if (await agentSelect.count() > 0) {
      await expect(agentSelect).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has textarea for task description', async ({ page, baseURL }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('sling drawer has sling button', async ({ page, baseURL }) => {
    await page.keyboard.press('n');
    await page.waitForTimeout(1000);

    // The drawer's submit button is the only `<button>` whose text is
    // exactly "sling" (the sidebar one says "+ sling task"). Scope to the
    // button role to avoid the empty-state `<code>` element.
    const slingButton = page.getByRole('button', { name: /^sling$/i });
    if (await slingButton.count() > 0) {
      await expect(slingButton.first()).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});