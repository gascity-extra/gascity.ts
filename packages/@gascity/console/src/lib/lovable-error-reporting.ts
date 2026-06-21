export function reportLovableError(error: Error, context?: Record<string, unknown>) {
  console.error('Lovable Error:', error, context);
}
