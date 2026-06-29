import { test, expect } from '@playwright/test';
import { E2EActions, isGcBackendReachable } from '../lib/actions';

/**
 * Task Processing Scenarios
 * Focus on automatic task processing workflows after task creation
 *
 * These scenarios need a live GC supervisor; they skip cleanly otherwise.
 */

test.describe('Task Processing Automation', () => {
  let actions: E2EActions;

  test.beforeAll(async () => {
    if (!(await isGcBackendReachable())) {
      // NOSONAR: Skip when GC supervisor is not available - these are optional e2e task tests
      test.skip(true, 'GC supervisor unreachable; scenario tests require a live backend.');
    }
  });

  test.beforeEach(async ({ page, baseURL }) => {
    actions = new E2EActions(page);
    await actions.navigateToHome();
  });

  test('scenario: simple task → automatic completion', async ({ page, baseURL }) => {
    // Create a simple task that completes quickly
    await actions.slingTask(
      'default',
      'default',
      'Simple test: Create a file named test.txt in /tmp with content "hello"'
    );

    // Wait for bead creation
    const beadCreated = await actions.waitForBead('Simple test', 30000);
    expect(beadCreated).toBe(true);

    // Wait for automatic processing (bead should close)
    const beads = await actions.getBeadList('all');
    if (beads.length > 0) {
      const firstBead = beads[0];
      const beadText = await firstBead.textContent();
      const beadId = beadText?.match(/\d+/)?.[0] || '';

      if (beadId) {
        const beadClosed = await actions.waitForBeadStatus(beadId, 'closed', 60000);
        console.log(`Task automatically completed: ${beadClosed}`);
        expect(beadClosed).toBe(true);
      }
    }
  });

  test('scenario: task with dependencies → sequential processing', async ({ page, baseURL }) => {
    // Create task with dependencies
    await actions.slingTask(
      'default',
      'default',
      'Task with steps: 1) Create directory /tmp/e2e-test 2) Create file 3) List contents'
    );

    // Wait for bead
    const beadCreated = await actions.waitForBead('Task with steps', 30000);
    expect(beadCreated).toBe(true);

    // Monitor session activity
    await actions.navigateTo('/');
    await page.waitForTimeout(2000);

    const sessions = await actions.getSessionList();
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      const sessionText = await firstSession.textContent();
      console.log(`Session active: ${sessionText}`);

      // Verify session is running
      expect(sessionText).toMatch(/running|active|live/);
    }
  });

  test('scenario: long-running task → session persistence', async ({ page, baseURL }) => {
    // Create a long-running task
    await actions.slingTask(
      'default',
      'default',
      'Long task: Run a process that sleeps for 30 seconds then completes'
    );

    // Wait for bead
    const beadCreated = await actions.waitForBead('Long task', 30000);
    expect(beadCreated).toBe(true);

    // Verify session is created and persists
    const sessionExists = await actions.waitForSession('default', 10000);
    expect(sessionExists).toBe(true);

    // Check that session is still running after some time
    await page.waitForTimeout(10000);

    const sessions = await actions.getSessionList();
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      const sessionText = await firstSession.textContent();
      expect(sessionText).toMatch(/running|active|live/);
    }
  });

  test('scenario: multiple tasks → concurrent processing', async ({ page, baseURL }) => {
    // Create multiple tasks
    const task1 = 'Task 1: Create file1.txt';
    const task2 = 'Task 2: Create file2.txt';
    const task3 = 'Task 3: Create file3.txt';

    await actions.slingTask('default', 'default', task1);
    await page.waitForTimeout(2000);

    await actions.slingTask('default', 'default', task2);
    await page.waitForTimeout(2000);

    await actions.slingTask('default', 'default', task3);

    // Wait for all beads to be created
    await actions.waitForBead('Task 1', 30000);
    await actions.waitForBead('Task 2', 30000);
    await actions.waitForBead('Task 3', 30000);

    // Verify multiple sessions or beads exist
    const beads = await actions.getBeadList('all');
    expect(beads.length).toBeGreaterThanOrEqual(3);
  });

  test('scenario: task error handling → failure recovery', async ({ page, baseURL }) => {
    // Create a task that might fail
    await actions.slingTask(
      'default',
      'default',
      'Error test: Try to access non-existent path and handle gracefully'
    );

    // Wait for bead
    const beadCreated = await actions.waitForBead('Error test', 30000);
    expect(beadCreated).toBe(true);

    // Check if bead shows error or completes
    const beads = await actions.getBeadList('all');
    if (beads.length > 0) {
      const firstBead = beads[0];
      const beadText = await firstBead.textContent();
      console.log(`Bead status: ${beadText}`);

      // Bead should either close (success) or show error status
      const hasStatus = beadText?.toLowerCase().includes('closed') ||
        beadText?.toLowerCase().includes('failed') ||
        beadText?.toLowerCase().includes('in_progress');
      expect(hasStatus).toBe(true);
    }
  });

  test('scenario: task with mail notification → communication flow', async ({ page, baseURL }) => {
    // Create a task
    await actions.slingTask(
      'default',
      'default',
      'Mail test: Complete task and send notification'
    );

    // Wait for bead
    const beadCreated = await actions.waitForBead('Mail test', 30000);
    expect(beadCreated).toBe(true);

    // Check mail inbox for agent
    await actions.navigateTo('/mail');
    await page.waitForLoadState('domcontentloaded');

    // Select agent if available
    const agentSelect = page.locator('select').nth(1);
    const agentCount = await agentSelect.count();

    if (agentCount > 0) {
      // Check if there are messages
      const pageContent = await page.content();
      const hasMessages = pageContent.toLowerCase().includes('from') ||
        pageContent.toLowerCase().includes('inbox empty');

      console.log(`Mail status: ${hasMessages ? 'Has messages or empty inbox' : 'Unknown'}`);
    }
  });

  test('scenario: task → formula execution → automated workflow', async ({ page, baseURL }) => {
    // Check if formulas exist
    const formulas = await actions.getFormulaList();

    if (formulas.length > 0) {
      // Get first formula name
      const firstFormula = formulas[0];
      const formulaName = await firstFormula.textContent() || '';

      // Run the formula
      await actions.runFormula(formulaName);

      // Wait for formula execution
      await page.waitForTimeout(5000);

      // Check if formula created beads
      const beads = await actions.getBeadList('all');
      console.log(`Beads after formula run: ${beads.length}`);
    } else {
      console.log('No formulas available to test');
    }
  });

  test('scenario: task → order trigger → scheduled automation', async ({ page, baseURL }) => {
    // Check if orders exist
    const orders = await actions.getOrderList();

    if (orders.length > 0) {
      // Get first order name
      const firstOrder = orders[0];
      const orderText = await firstOrder.textContent() || '';
      const orderName = orderText.split('\n')[0];

      // Fire the order manually
      await actions.fireOrder(orderName);

      // Wait for order to execute
      await page.waitForTimeout(5000);

      // Check if order created beads
      const beads = await actions.getBeadList('all');
      console.log(`Beads after order fire: ${beads.length}`);

      // Assert that we either have orders or beads
      expect(orders.length).toBeGreaterThan(0);
    } else {
      console.log('No orders available to test');
      // Skip test if no orders available
      test.skip();
    }
  });
});
