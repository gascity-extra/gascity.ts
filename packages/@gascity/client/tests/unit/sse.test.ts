import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectSSE } from '../../src/lib/sse';

// Mock EventSource for Node.js environment
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  close() {
    // Mock close method
  }
}

describe('connectSSE', () => {
  beforeEach(() => {
    // @ts-ignore - Mocking global EventSource
    global.EventSource = MockEventSource as any;
  });

  it('should create EventSource connection', () => {
    const eventSource = connectSSE('http://localhost:8080/events');
    expect(eventSource).toBeInstanceOf(MockEventSource);
    eventSource.close();
  });

  it('should create EventSource with onMessage handler', () => {
    const onMessage = vi.fn();
    const eventSource = connectSSE('http://localhost:8080/events', { onMessage });
    expect(eventSource).toBeInstanceOf(MockEventSource);
    expect(eventSource.onmessage).toBe(onMessage);
    eventSource.close();
  });

  it('should create EventSource with onError handler', () => {
    const onError = vi.fn();
    const eventSource = connectSSE('http://localhost:8080/events', { onError });
    expect(eventSource).toBeInstanceOf(MockEventSource);
    expect(eventSource.onerror).toBe(onError);
    eventSource.close();
  });

  it('should create EventSource with onOpen handler', () => {
    const onOpen = vi.fn();
    const eventSource = connectSSE('http://localhost:8080/events', { onOpen });
    expect(eventSource).toBeInstanceOf(MockEventSource);
    expect(eventSource.onopen).toBe(onOpen);
    eventSource.close();
  });

  it('should create EventSource with all handlers', () => {
    const onMessage = vi.fn();
    const onError = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const eventSource = connectSSE('http://localhost:8080/events', {
      onMessage,
      onError,
      onOpen,
      onClose,
    });
    expect(eventSource).toBeInstanceOf(MockEventSource);
    expect(eventSource.onmessage).toBe(onMessage);
    expect(eventSource.onerror).toBe(onError);
    expect(eventSource.onopen).toBe(onOpen);
    eventSource.close();
  });
});
