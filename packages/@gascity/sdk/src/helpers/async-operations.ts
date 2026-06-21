/**
 * Wait for an async operation to complete
 */
export async function waitForCompletion(
  checkFn: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 30000;
  const interval = options.interval || 1000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await checkFn()) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Operation did not complete within timeout');
}

/**
 * Execute multiple operations in parallel
 */
export async function parallel<T>(
  operations: Array<() => Promise<T>>
): Promise<Array<T>> {
  return Promise.all(operations.map(op => op()));
}

/**
 * Execute operations in sequence
 */
export async function sequence<T>(
  operations: Array<() => Promise<T>>
): Promise<Array<T>> {
  const results: Array<T> = [];
  
  for (const operation of operations) {
    results.push(await operation());
  }
  
  return results;
}
