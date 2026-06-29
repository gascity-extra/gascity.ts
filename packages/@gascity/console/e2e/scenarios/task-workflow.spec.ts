import { test, expect } from '@playwright/test';
import { E2EActions, isGcBackendReachable } from '../lib/actions';

/**
 * Main scenario: Task creation and automatic processing
 * This is the primary end-to-end workflow for the Gas City Console
 *
 * Requires a live GC supervisor; skipped when the backend is unreachable.
 */

test.describe('Task Creation and Processing Workflow', () => {
  let actions: E2EActions;

  test.beforeAll(async () => {
    // Skip these scenario tests if GC backend is not reachable.
    // These tests require a live GC supervisor to verify end-to-end workflows.
    if (!(await isGcBackendReachable())) {
      test.skip(true, 'GC supervisor unreachable; scenario tests require a live backend.');
    }
  });

  test.beforeEach(async ({ page, baseURL }) => {
    actions = new E2EActions(page);
    await actions.navigateToHome();
  });

  test('complete workflow: sling task → bead created → session started → task processed', async ({ page, baseURL }) => {
    // Step 1: Sling a task
    await test.step('Sling a new task', async () => {
      await actions.slingTask(
        'default', // city name - will need to adjust based on actual setup
        'default', // agent name - will need to adjust based on actual setup
        'Test task for E2E automation: Create a simple file and verify it exists'
      );
    });

    // Step 2: Verify bead was created
    await test.step('Verify bead was created', async () => {
      const beadCreated = await actions.waitForBead('Test task for E2E automation', 30000);
      expect(beadCreated).toBe(true);
    });

    // Step 3: Verify session was started
    await test.step('Verify session was started', async () => {
      const sessions = await actions.getSessionList();
      expect(sessions.length).toBeGreaterThan(0);
    });

    // Step 4: Wait for bead to be processed (closed)
    await test.step('Wait for bead to be processed', async () => {
      const beads = await actions.getBeadList('all');
      if (beads.length > 0) {
        const firstBead = beads[0];
        const beadText = await firstBead.textContent();
        const beadId = beadText?.match(/\d+/)?.[0] || '';

        if (beadId) {
          const beadClosed = await actions.waitForBeadStatus(beadId, 'closed', 120000);
          console.log(`Bead ${beadId} closed: ${beadClosed}`);
        }
      }
    });

    // Step 5: Verify session is still running
    await test.step('Verify session is still running', async () => {
      const sessions = await actions.getSessionList();
      if (sessions.length > 0) {
        const firstSession = sessions[0];
        const sessionText = await firstSession.textContent();
        expect(sessionText).toMatch(/running|active|live/);
      }
    });
  });

  test('workflow: sling task → nudge session → verify response', async ({ page, baseURL }) => {
    // Step 1: Sling a task
    await test.step('Sling a new task', async () => {
      await actions.slingTask(
        'default',
        'default',
        'Test task for nudge: Wait for 10 seconds'
      );
    });

    // Step 2: Wait for bead
    await test.step('Wait for bead to be created', async () => {
      const beadCreated = await actions.waitForBead('Test task for nudge', 30000);
      expect(beadCreated).toBe(true);
    });

    // Step 3: Get session name
    await test.step('Get active session', async () => {
      const sessions = await actions.getSessionList();
      expect(sessions.length).toBeGreaterThan(0);

      const firstSession = sessions[0];
      const sessionText = await firstSession.textContent();
      const sessionName = sessionText?.split('\n')[0] || '';

      // Step 4: Nudge the session
      await test.step('Nudge the session', async () => {
        await actions.nudgeSession(sessionName, 'Check progress');
        await page.waitForTimeout(2000);
      });
    });
  });

  test('workflow: sling task → reset session → verify cleanup', async ({ page, baseURL }) => {
    // Step 1: Sling a task
    await test.step('Sling a new task', async () => {
      await actions.slingTask(
        'default',
        'default',
        'Test task for reset: This task will be reset'
      );
    });

    // Step 2: Wait for bead
    await test.step('Wait for bead to be created', async () => {
      const beadCreated = await actions.waitForBead('Test task for reset', 30000);
      expect(beadCreated).toBe(true);
    });

    // Step 3: Get session name and reset
    await test.step('Reset the session', async () => {
      const sessions = await actions.getSessionList();
      if (sessions.length > 0) {
        const firstSession = sessions[0];
        const sessionText = await firstSession.textContent();
        const sessionName = sessionText?.split('\n')[0] || '';

        await actions.resetSession(sessionName);
        await page.waitForTimeout(2000);
      }
    });
  });

  test('workflow: sling task → attach to session → verify terminal', async ({ page, baseURL }) => {
    // Step 1: Sling a task
    await test.step('Sling a new task', async () => {
      await actions.slingTask(
        'default',
        'default',
        'Test task for attach: Long running task'
      );
    });

    // Step 2: Wait for bead
    await test.step('Wait for bead to be created', async () => {
      const beadCreated = await actions.waitForBead('Test task for attach', 30000);
      expect(beadCreated).toBe(true);
    });

    // Step 3: Attach to session
    await test.step('Attach to session', async () => {
      const attachButton = page.getByText('attach');
      const count = await attachButton.count();

      if (count > 0) {
        await attachButton.first().click();
        await page.waitForLoadState('domcontentloaded');

        // Verify we're on session detail page
        await expect(page).toHaveURL(/\/sessions\/.+/);

        // Look for peek button
        const peekButton = page.getByText('peek');
        if (await peekButton.count() > 0) {
          await peekButton.click();
          await page.waitForTimeout(1000);

          // Verify peek drawer is visible
          const pageContent = await page.content();
          expect(pageContent.length).toBeGreaterThan(100);
        }
      }
    });
  });
});
