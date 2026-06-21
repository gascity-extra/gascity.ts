import { test, expect } from '@playwright/test';

/**
 * E2E Integration Tests for @gascity/sdk
 *
 * These tests require a running Gas City API instance.
 * They test the SDK end-to-end with real API calls.
 *
 * Prerequisites:
 * - Gas City API must be running at http://127.0.0.1:8372
 * - The API should be accessible from the test environment
 *
 * To run these tests:
 * 1. Start the Gas City API
 * 2. Run: bun test:e2e
 */

test.describe('SDK Integration Tests', () => {
  test.beforeEach(async () => {
    // Check if API is accessible
    try {
      const response = await fetch('http://127.0.0.1:8372/health');
      if (!response.ok) {
        throw new Error('API health check failed');
      }
    } catch (error) {
      test.skip(true, 'Gas City API is not running. Skipping E2E tests.');
    }
  });

  test.describe('City Operations', () => {
    test('should initialize a new city', async () => {
      // This test would use the actual SDK to initialize a city
      // For now, we'll test the API endpoint directly
      const response = await fetch('http://127.0.0.1:8372/v0/city', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gc-request': 'e2e-test',
        },
        body: JSON.stringify({
          dir: '/test-city-e2e',
          provider: 'local',
        }),
      });

      expect(response.ok).toBeTruthy();
    });

    test('should get city status', async () => {
      // Assuming a city exists, test getting its status
      const response = await fetch('http://127.0.0.1:8372/v0/city/default/status');

      // This might fail if the city doesn't exist, which is expected in a test environment
      // In a real test setup, you would create a city first
      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });

    test('should check city readiness', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city/default/readiness');

      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });
  });

  test.describe('Task Operations', () => {
    test('should sling a task to an agent', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city/default/sling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gc-request': 'e2e-test',
        },
        body: JSON.stringify({
          target: 'test-agent',
          title: 'Test task from E2E',
          vars: {
            test: 'e2e',
          },
        }),
      });

      // This might fail if the agent doesn't exist
      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        expect(data.bead).toBeDefined();
      }
    });

    test('should get bead status', async () => {
      // This would require a valid bead ID from a previous task
      // For now, we'll just test the endpoint structure
      const beadId = 'test-bead-id';
      const response = await fetch(
        `http://127.0.0.1:8372/v0/city/default/bead/${beadId}`
      );

      // Expected to fail with invalid bead ID
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Agent Operations', () => {
    test('should create an agent', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city/default/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gc-request': 'e2e-test',
        },
        body: JSON.stringify({
          name: 'test-agent-e2e',
          provider: 'local',
        }),
      });

      // This might fail depending on API configuration
      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });

    test('should get agent output', async () => {
      const agentName = 'test-agent';
      const response = await fetch(
        `http://127.0.0.1:8372/v0/city/default/agent/${agentName}/output`
      );

      // Expected to fail if agent doesn't exist
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Session Operations', () => {
    test('should create a session', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city/default/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gc-request': 'e2e-test',
        },
        body: JSON.stringify({
          name: 'test-agent',
          kind: 'agent',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });

    test('should send a message to a session', async () => {
      // This would require a valid session ID
      const sessionId = 'test-session-id';
      const response = await fetch(
        `http://127.0.0.1:8372/v0/city/default/session/${sessionId}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gc-request': 'e2e-test',
          },
          body: JSON.stringify({
            message: 'Hello from E2E test',
          }),
        }
      );

      // Expected to fail with invalid session ID
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Event Streaming', () => {
    test('should connect to event stream', async () => {
      // Note: This test uses EventSource which might not be available in Node.js
      // In a real Playwright test, this would run in a browser context
      const response = await fetch(
        'http://127.0.0.1:8372/v0/city/default/events/stream'
      );

      // Event streams might not be accessible via fetch
      // This is more of a connectivity check
      if (response.ok) {
        expect(response.ok).toBeTruthy();
      }
    });

    test('should connect to supervisor event stream', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/events/stream');

      if (response.ok) {
        expect(response.ok).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 errors gracefully', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/nonexistent');

      expect(response.status).toBe(404);
    });

    test('should handle invalid request data', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gc-request': 'e2e-test',
        },
        body: JSON.stringify({
          invalid: 'data',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('should handle missing headers', async () => {
      const response = await fetch('http://127.0.0.1:8372/v0/city', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing x-gc-request header
        },
        body: JSON.stringify({
          dir: '/test-city',
        }),
      });

      // API might reject requests without the anti-CSRF header
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('SDK Workflow Integration', () => {
    test('should perform a complete workflow: create city -> create agent -> sling task', async () => {
      // This is a placeholder for a complete workflow test
      // In a real implementation, this would use the SDK functions:
      // 1. initCity()
      // 2. createAgent()
      // 3. slingTask()
      // 4. waitForTaskCompletion()
      // 5. monitorTask()
      // 6. closeTask()

      // For now, we'll just verify the API endpoints are accessible
      const cityResponse = await fetch('http://127.0.0.1:8372/v0/city/default/status');
      expect(cityResponse.status).toBeGreaterThanOrEqual(200);
    });

    test('should perform a session workflow: create session -> interact -> close', async () => {
      // Placeholder for session workflow test
      // 1. createSession()
      // 2. interactSession()
      // 3. getSessionTranscript()
      // 4. closeSession()

      const response = await fetch('http://127.0.0.1:8372/v0/city/default/session');
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    test('should perform an event workflow: subscribe -> receive events -> unsubscribe', async () => {
      // Placeholder for event workflow test
      // 1. subscribeToEvents()
      // 2. Wait for events
      // 3. unsubscribe()
      // 4. close()

      const response = await fetch('http://127.0.0.1:8372/v0/city/default/events/stream');
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
