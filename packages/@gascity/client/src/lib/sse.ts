/**
 * SSE (Server-Sent Events) support for Gas City API
 */

export interface SSEOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
}

export function connectSSE(url: string, options: SSEOptions = {}): EventSource {
  const eventSource = new EventSource(url);
  
  if (options.onMessage) {
    eventSource.onmessage = options.onMessage;
  }
  
  if (options.onError) {
    eventSource.onerror = options.onError;
  }
  
  if (options.onOpen) {
    eventSource.onopen = options.onOpen;
  }
  
  return eventSource;
}
