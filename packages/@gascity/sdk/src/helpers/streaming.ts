/**
 * Create a readable stream from EventSource
 */
export function createEventSourceStream(url: string): ReadableStream {
  const eventSource = new EventSource(url);
  
  return new ReadableStream({
    start(controller) {
      eventSource.onmessage = (event) => {
        controller.enqueue(new TextEncoder().encode(event.data));
      };
      
      eventSource.onerror = (error) => {
        controller.error(error);
        eventSource.close();
      };
    },
    
    cancel() {
      eventSource.close();
    },
  });
}
