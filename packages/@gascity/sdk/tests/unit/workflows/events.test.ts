import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GasCityEventManager,
  createEventManager,
  subscribeToEvents,
  type EventOptions,
  type EventSubscription,
  type EventCorrelation,
} from '../../../src/workflows/events';

// Mock EventSource
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
  }

  close() {
    this.readyState = 2;
  }

  // Helper to simulate incoming messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  // Helper to simulate errors
  simulateError(error: Event) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any;

describe('Event Workflows', () => {
  let manager: GasCityEventManager;

  beforeEach(() => {
    manager = new GasCityEventManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.close();
  });

  describe('GasCityEventManager', () => {
    it('should create a new event manager', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(GasCityEventManager);
    });

    describe('subscribe', () => {
      it('should subscribe to events with callback', async () => {
        const callback = vi.fn();
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          eventType: 'task.completed',
        };

        await manager.subscribe(options, callback);

        expect(callback).toHaveBeenCalled();
      });

      it('should create correlation when correlationId is provided', async () => {
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          correlationId: 'workflow-123',
        };

        await manager.subscribe(options);

        const correlation = manager.getCorrelation('workflow-123');
        expect(correlation).toBeDefined();
        expect(correlation?.id).toBe('workflow-123');
      });

      it('should emit events when received', async () => {
        const callback = vi.fn();
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          eventType: 'task.completed',
        };

        await manager.subscribe(options, callback);

        // Simulate an incoming event
        const eventSource = (manager as any).eventSource as MockEventSource;
        eventSource.simulateMessage({ type: 'task.completed', data: { taskId: '123' } });

        // Wait for event processing
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(callback).toHaveBeenCalled();
      });

      it('should apply filter function when provided', async () => {
        const callback = vi.fn();
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          eventType: 'task.completed',
          filter: (event: any) => event.data?.taskId === '123',
        };

        await manager.subscribe(options, callback);

        const eventSource = (manager as any).eventSource as MockEventSource;
        eventSource.simulateMessage({ type: 'task.completed', data: { taskId: '456' } });
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(callback).not.toHaveBeenCalled();

        eventSource.simulateMessage({ type: 'task.completed', data: { taskId: '123' } });
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(callback).toHaveBeenCalled();
      });

      it('should add correlation metadata to events', async () => {
        const callback = vi.fn();
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          correlationId: 'workflow-123',
        };

        await manager.subscribe(options, callback);

        const eventSource = (manager as any).eventSource as MockEventSource;
        eventSource.simulateMessage({ type: 'task.completed', data: {} });

        await new Promise(resolve => setTimeout(resolve, 10));

        const call = callback.mock.calls[0][0];
        expect(call.correlation).toBeDefined();
        expect(call.correlation.id).toBe('workflow-123');
      });

      it('should emit parse-error on invalid JSON', async () => {
        const errorCallback = vi.fn();
        manager.on('parse-error', errorCallback);

        await manager.subscribe({ city: 'my-city' });

        const eventSource = (manager as any).eventSource as MockEventSource;
        eventSource.simulateMessage('invalid json');

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(errorCallback).toHaveBeenCalled();
      });

      it('should emit error on event source error', async () => {
        const errorCallback = vi.fn();
        manager.on('error', errorCallback);

        await manager.subscribe({ city: 'my-city' });

        const eventSource = (manager as any).eventSource as MockEventSource;
        eventSource.simulateError(new Event('error'));

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(errorCallback).toHaveBeenCalled();
      });
    });

    describe('unsubscribe', () => {
      it('should unsubscribe by subscription ID', async () => {
        const callback = vi.fn();
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          eventType: 'task.completed',
        };

        await manager.subscribe(options, callback);
        const subscriptionId = Array.from((manager as any).subscriptions.keys())[0];

        manager.unsubscribe(subscriptionId);

        expect((manager as any).subscriptions.has(subscriptionId)).toBe(false);
      });

      it('should clean up correlation when no subscriptions use it', async () => {
        const options: EventOptions & EventSubscription = {
          city: 'my-city',
          correlationId: 'workflow-123',
        };

        await manager.subscribe(options);
        const subscriptionId = Array.from((manager as any).subscriptions.keys())[0];

        manager.unsubscribe(subscriptionId);

        expect(manager.getCorrelation('workflow-123')).toBeUndefined();
      });
    });

    describe('unsubscribeAll', () => {
      it('should unsubscribe from all subscriptions', async () => {
        await manager.subscribe({ city: 'my-city', eventType: 'task.completed' });
        await manager.subscribe({ city: 'my-city', eventType: 'agent.created' });

        manager.unsubscribeAll();

        expect((manager as any).subscriptions.size).toBe(0);
      });
    });

    describe('close', () => {
      it('should close event source and clean up', async () => {
        await manager.subscribe({ city: 'my-city' });

        manager.close();

        expect((manager as any).eventSource).toBeUndefined();
        expect((manager as any).subscriptions.size).toBe(0);
        expect((manager as any).correlations.size).toBe(0);
      });
    });

    describe('createCorrelation', () => {
      it('should create a correlation', () => {
        const correlation = manager.createCorrelation('workflow-123', 'task.started', {
          userId: 'user-456',
        });

        expect(correlation.id).toBe('workflow-123');
        expect(correlation.eventTypes.has('task.started')).toBe(true);
        expect(correlation.metadata).toEqual({ userId: 'user-456' });
        expect(correlation.createdAt).toBeInstanceOf(Date);
      });
    });

    describe('getCorrelation', () => {
      it('should get a correlation by ID', () => {
        manager.createCorrelation('workflow-123', 'task.started');
        const correlation = manager.getCorrelation('workflow-123');

        expect(correlation).toBeDefined();
        expect(correlation?.id).toBe('workflow-123');
      });

      it('should return undefined for non-existent correlation', () => {
        const correlation = manager.getCorrelation('non-existent');
        expect(correlation).toBeUndefined();
      });
    });

    describe('getAllCorrelations', () => {
      it('should return all correlations', () => {
        manager.createCorrelation('workflow-123', 'task.started');
        manager.createCorrelation('workflow-456', 'task.completed');

        const correlations = manager.getAllCorrelations();

        expect(correlations).toHaveLength(2);
        expect(correlations[0].id).toBe('workflow-123');
        expect(correlations[1].id).toBe('workflow-456');
      });

      it('should return empty array when no correlations exist', () => {
        const correlations = manager.getAllCorrelations();
        expect(correlations).toHaveLength(0);
      });
    });

    describe('filterByCorrelation', () => {
      it('should create a filter function for correlation ID', () => {
        const filter = manager.filterByCorrelation('workflow-123');

        expect(filter).toBeInstanceOf(Function);
        expect(filter({ correlation: { id: 'workflow-123' } })).toBe(true);
        expect(filter({ correlation: { id: 'workflow-456' } })).toBe(false);
        expect(filter({})).toBe(false);
      });
    });

    describe('filterByTypePattern', () => {
      it('should create a filter function for type pattern', () => {
        const filter = manager.filterByTypePattern(/^task\./);

        expect(filter({ type: 'task.completed' })).toBe(true);
        expect(filter({ type: 'task.started' })).toBe(true);
        expect(filter({ type: 'agent.created' })).toBe(false);
        expect(filter({})).toBe(false);
      });
    });

    describe('filterByProperty', () => {
      it('should create a filter function for property value', () => {
        const filter = manager.filterByProperty('status', 'completed');

        expect(filter({ status: 'completed' })).toBe(true);
        expect(filter({ status: 'pending' })).toBe(false);
        expect(filter({})).toBe(false);
      });

      it('should handle nested properties', () => {
        const filter = manager.filterByProperty('data.status', 'completed');

        expect(filter({ data: { status: 'completed' } })).toBe(true);
        expect(filter({ data: { status: 'pending' } })).toBe(false);
        expect(filter({ data: {} })).toBe(false);
      });

      it('should handle deep nested properties', () => {
        const filter = manager.filterByProperty('data.metadata.status', 'completed');

        expect(filter({ data: { metadata: { status: 'completed' } } })).toBe(true);
        expect(filter({ data: { metadata: { status: 'pending' } } })).toBe(false);
      });
    });
  });

  describe('createEventManager', () => {
    it('should create a new event manager instance', () => {
      const manager = createEventManager();
      expect(manager).toBeInstanceOf(GasCityEventManager);
      manager.close();
    });
  });

  describe('subscribeToEvents', () => {
    it('should create manager and subscribe to events', async () => {
      const callback = vi.fn();
      const options: EventOptions & EventSubscription = {
        city: 'my-city',
        eventType: 'task.completed',
      };

      const manager = await subscribeToEvents(options, callback);

      expect(manager).toBeInstanceOf(GasCityEventManager);
      manager.close();
    });

    it('should return manager without callback', async () => {
      const options: EventOptions & EventSubscription = {
        city: 'my-city',
      };

      const manager = await subscribeToEvents(options);

      expect(manager).toBeInstanceOf(GasCityEventManager);
      manager.close();
    });
  });
});
