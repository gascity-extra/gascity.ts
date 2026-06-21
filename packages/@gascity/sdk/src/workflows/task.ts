import { DefaultService, type Bead, type SlingResponse } from '@gascity/client';

export interface TaskConfig {
  agent: string;
  task: string;
  city?: string;
  metadata?: Record<string, string>;
  csrfToken?: string; // Anti-CSRF token for API requests
}

export interface TaskCompletionOptions {
  city: string;
  timeout?: number;
  pollInterval?: number;
}

/**
 * Error thrown when task operations fail
 */
export class TaskError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TaskError';
  }
}

/**
 * Type guard to check if a response is an ErrorModel
 */
function isErrorModel(response: any): response is { detail: string } {
  return response && typeof response === 'object' && 'detail' in response;
}

/**
 * Retry configuration for task operations
 */
interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
};

/**
 * Helper function to retry operations with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: unknown;
  let delay = config.delay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxAttempts) {
        throw new TaskError(
          `${operationName} failed after ${config.maxAttempts} attempts`,
          error
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= config.backoffMultiplier;
    }
  }

  throw new TaskError(
    `${operationName} failed unexpectedly`,
    lastError ?? new Error('No error captured')
  );
}

/**
 * Generate a correlation ID for event tracking
 * 
 * Creates a unique identifier that can be used to correlate events across
 * the task lifecycle for debugging and monitoring purposes.
 * 
 * @returns A unique correlation ID string
 * 
 * @example
 * ```typescript
 * const correlationId = generateCorrelationId();
 * console.log(`Tracking task with ID: ${correlationId}`);
 * ```
 */
export function generateCorrelationId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Sling a task to an agent
 * 
 * Submits a task to a specific agent within a city. The task will be processed
 * asynchronously and a bead ID is returned for tracking. This is the primary
 * method for initiating work in the Gas City system.
 * 
 * @param config - Task configuration including agent, task text, city, and optional metadata
 * @returns Promise resolving to the sling response containing the bead ID
 * @throws {TaskError} If task submission fails after retries
 * 
 * @example
 * ```typescript
 * const response = await slingTask({
 *   agent: 'research-agent',
 *   task: 'Analyze market trends',
 *   city: 'production',
 *   metadata: {
 *     priority: 'high',
 *     requestId: '12345'
 *   }
 * });
 * console.log(`Task submitted with bead ID: ${response.bead}`);
 * ```
 */
export async function slingTask(config: TaskConfig): Promise<SlingResponse> {
  const correlationId = generateCorrelationId();
  const cityName = config.city || 'default';
  const xGcRequest = config.csrfToken;
  
  const enrichedVars = {
    ...config.metadata,
    correlationId,
    submittedAt: new Date().toISOString(),
    task: config.task,
  };

  const response = await withRetry(async () => {
    return await DefaultService.postV0CityByCityNameSling(
      xGcRequest,
      cityName,
      {
        target: config.agent,
        title: config.task,
        vars: enrichedVars,
      }
    );
  }, DEFAULT_RETRY_CONFIG, 'Task submission');
  
  if (isErrorModel(response)) {
    throw new TaskError(`Task submission failed: ${JSON.stringify(response)}`);
  }
  
  return response as SlingResponse;
}

/**
 * Wait for task completion
 * 
 * Polls the bead status until the task is marked as closed (completed) or the
 * timeout is exceeded. This is useful when you need to block until a task
 * completes before proceeding.
 * 
 * @param beadId - The bead ID returned from slingTask
 * @param options - Completion options including city, timeout, and poll interval
 * @returns Promise resolving when the task is complete
 * @throws {TaskError} If the task does not complete within the timeout
 * 
 * @example
 * ```typescript
 * const response = await slingTask({
 *   agent: 'data-processor',
 *   task: 'Process dataset',
 *   city: 'production'
 * });
 * 
 * await waitForTaskCompletion(response.bead, {
 *   city: 'production',
 *   timeout: 120000,
 *   pollInterval: 5000
 * });
 * console.log('Task completed successfully');
 * ```
 */
export async function waitForTaskCompletion(
  beadId: string,
  options: TaskCompletionOptions
): Promise<void> {
  const { city, timeout = 120000, pollInterval = 5000 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const bead = await DefaultService.getV0CityByCityNameBeadById(
        city,
        beadId
      );
      
      // Check if this is an error response
      if (isErrorModel(bead)) {
        // This is an ErrorModel - bead not found yet, continue waiting
        // This is expected during the initial polling phase
      } else {
        // Check if bead is closed (completed)
        if (bead.status === 'closed') {
          return;
        }
      }
    } catch (error) {
      // Bead not found yet, continue waiting
      // This is expected during the initial polling phase
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new TaskError(
    `Task ${beadId} did not complete within ${timeout}ms`
  );
}

/**
 * Monitor task status
 * 
 * Retrieves the current status of a task (bead) without waiting for completion.
 * This is useful for checking progress or implementing custom polling logic.
 * 
 * @param beadId - The bead ID to monitor
 * @param city - The city name where the bead exists
 * @returns Promise resolving to the bead status information
 * @throws {TaskError} If monitoring fails after retries
 * 
 * @example
 * ```typescript
 * const status = await monitorTask('bead_123', 'production');
 * console.log(`Task status: ${status.status}`);
 * console.log(`Agent: ${status.assignee}`);
 * ```
 */
export async function monitorTask(beadId: string, city: string): Promise<Bead> {
  const bead = await withRetry(async () => {
    return await DefaultService.getV0CityByCityNameBeadById(
      city,
      beadId
    );
  }, DEFAULT_RETRY_CONFIG, 'Task monitoring');
  
  if (isErrorModel(bead)) {
    throw new TaskError(`Task monitoring failed: ${JSON.stringify(bead)}`);
  }
  
  return bead as Bead;
}

/**
 * Close a task (bead)
 * 
 * Manually closes a task, marking it as complete. This is useful when you need
 * to terminate a task early or mark it as done from the client side.
 * 
 * @param beadId - The bead ID to close
 * @param city - The city name where the bead exists
 * @throws {TaskError} If closing the task fails after retries
 * 
 * @example
 * ```typescript
 * await closeTask('bead_123', 'production');
 * console.log('Task closed successfully');
 * ```
 */
export async function closeTask(beadId: string, city: string, csrfToken?: string): Promise<void> {
  return withRetry(async () => {
    const xGcRequest = csrfToken;
    const response = await DefaultService.postV0CityByCityNameBeadByIdClose(
      xGcRequest,
      city,
      beadId
    );
    
    if (isErrorModel(response)) {
      throw new TaskError(`Task closure failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Task closure');
}

/**
 * Reopen a task (bead)
 * 
 * Reopens a previously closed task, allowing it to be processed again.
 * This is useful for retrying failed tasks or continuing work on
 * previously completed items.
 * 
 * @param beadId - The bead ID to reopen
 * @param city - The city name where the bead exists
 * @throws {TaskError} If reopening the task fails after retries
 * 
 * @example
 * ```typescript
 * await reopenTask('bead_123', 'production');
 * console.log('Task reopened for processing');
 * ```
 */
export async function reopenTask(beadId: string, city: string, csrfToken?: string): Promise<void> {
  return withRetry(async () => {
    const xGcRequest = csrfToken;
    const response = await DefaultService.postV0CityByCityNameBeadByIdReopen(
      xGcRequest,
      city,
      beadId
    );
    
    if (isErrorModel(response)) {
      throw new TaskError(`Task reopening failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Task reopening');
}
