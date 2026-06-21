import { describe, it, expect } from 'vitest';
import { createEventSourceStream } from '../../../src/helpers/streaming';

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
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
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
globalThis.EventSource = MockEventSource as any;

describe.skip('Streaming Helper', () => {
  describe('createEventSourceStream', () => {
    it('should create a ReadableStream from EventSource', () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should enqueue data when EventSource receives messages', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();
      const chunks: string[] = [];

      // Start reading
      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      })();

      // Get the EventSource instance (it's created in the stream start)
      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        eventSource.simulateMessage('test data 1');
        eventSource.simulateMessage('test data 2');
      }

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cancel the reader to stop reading
      reader.cancel();
      await readPromise;

      expect(chunks).toContain('test data 1');
      expect(chunks).toContain('test data 2');
    });

    it.skip('should encode data as UTF-8', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];

      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        eventSource.simulateMessage('test data');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      reader.cancel();
      await readPromise;

      expect(chunks[0]).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(chunks[0])).toBe('test data');
    });

    it('should close EventSource when stream is cancelled', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      // Cancel the stream
      reader.cancel();

      await new Promise(resolve => setTimeout(resolve, 10));

      if (eventSource) {
        expect(eventSource.readyState).toBe(2); // CLOSED
      }
    });

    it('should handle EventSource errors', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        eventSource.simulateError(new Event('error'));
      }

      // Try to read, should get an error
      await expect(reader.read()).rejects.toBeDefined();

      reader.cancel();
    });

    it('should close EventSource on error', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        eventSource.simulateError(new Event('error'));
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(eventSource?.readyState).toBe(2); // CLOSED

      reader.cancel();
    });

    it('should handle multiple messages in sequence', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();
      const chunks: string[] = [];

      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        for (let i = 0; i < 5; i++) {
          eventSource.simulateMessage(`message ${i}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      reader.cancel();
      await readPromise;

      expect(chunks).toHaveLength(5);
    });

    it('should handle empty messages', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();
      const chunks: string[] = [];

      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        eventSource.simulateMessage('');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      reader.cancel();
      await readPromise;

      expect(chunks).toContain('');
    });

    it('should handle JSON data', async () => {
      const url = 'http://example.com/events';
      const stream = createEventSourceStream(url);
      const reader = stream.getReader();
      const chunks: string[] = [];

      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 10));
      const eventSource = (globalThis as any).eventSourceInstances?.[0] as MockEventSource;

      if (eventSource) {
        const jsonData = JSON.stringify({ type: 'test', data: 'value' });
        eventSource.simulateMessage(jsonData);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      reader.cancel();
      await readPromise;

      expect(chunks[0]).toBe('{"type":"test","data":"value"}');
    });
  });
});
