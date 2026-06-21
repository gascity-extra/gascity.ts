/**
 * Generate a unique correlation ID
 */
export function generateEventCorrelationId(): string {
  // Use crypto.randomUUID() for better uniqueness and security
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `corr-${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  // Use timestamp-based approach instead of Math.random()
  return `corr-${Date.now().toString(36)}-${performance.now().toString(36)}`;
}

/**
 * Extract correlation ID from event
 */
export function extractCorrelationId(event: any): string | null {
  if (!event) return null;
  return event.metadata?.correlation_id || event.correlation_id || null;
}

/**
 * Filter events by correlation ID
 */
export function filterByCorrelation(events: any[], correlationId: string): any[] {
  return events.filter(event => extractCorrelationId(event) === correlationId);
}
