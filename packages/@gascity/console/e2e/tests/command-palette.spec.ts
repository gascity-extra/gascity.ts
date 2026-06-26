import { test, expect } from '@playwright/test';
import { waitForHydration } from '../lib/actions';

test.describe('Command Palette Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('domcontentloaded');
    // Cmd+K is handled by a global keydown listener attached during React
    // hydration. Wait for hydration before sending keystrokes so the
    // listener exists when the keypress fires.
    await waitForHydration(page);
  });

  test('can open command palette with Cmd+K', async ({ page, baseURL }) => {
    // The AppShell handles `e.metaKey || e.ctrlKey` + `k`. In headless
    // chromium Meta is mapped to Control, so use Control+K for portability.
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/type a command/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has sling new task action', async ({ page, baseURL }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/sling/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has supervisor panel action', async ({ page, baseURL }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/supervisor/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('command palette has navigation actions', async ({ page, baseURL }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/navigate|sessions|mail|beads|formulas|orders|cities|packs|endpoints/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});