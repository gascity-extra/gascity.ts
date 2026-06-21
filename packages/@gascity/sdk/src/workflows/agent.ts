import { EventEmitter } from 'eventemitter3';
import { DefaultService } from '@gascity/client';

export interface AgentConfig {
  name: string;
  provider: string;
  city?: string;
  dir?: string;
  scope?: string;
  csrfToken?: string; // Anti-CSRF token for API requests
}

export interface AgentReference {
  base: string;
  dir?: string;
}

export interface AgentStreamOptions {
  city?: string;
  format?: 'raw' | 'json';
}

/**
 * Error thrown when agent operations fail
 */
export class AgentError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Retry configuration for agent operations
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
        throw new AgentError(
          `${operationName} failed after ${config.maxAttempts} attempts`,
          error
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= config.backoffMultiplier;
    }
  }

  throw new AgentError(
    `${operationName} failed unexpectedly`,
    lastError
  );
}

/**
 * Type guard to check if a response is an ErrorModel
 */
function isErrorModel(response: any): response is { detail: string } {
  return response && typeof response === 'object' && 'detail' in response;
}

/**
 * Agent output event emitter for streaming
 */
export class AgentStream extends EventEmitter {
  private stopped = false;

  constructor() {
    super();
  }

  /**
   * Stop the stream
   */
  stop(): void {
    this.stopped = true;
    this.removeAllListeners();
  }

  /**
   * Check if stream is stopped
   */
  isStopped(): boolean {
    return this.stopped;
  }

  /**
   * Emit a chunk of agent output
   */
  emitChunk(chunk: string): boolean {
    if (!this.stopped) {
      return this.emit('chunk', chunk);
    }
    return false;
  }

  /**
   * Emit completion event
   */
  emitComplete(data: any): boolean {
    if (!this.stopped) {
      return this.emit('complete', data);
    }
    return false;
  }

  /**
   * Emit error event
   */
  emitError(error: Error): boolean {
    if (!this.stopped) {
      return this.emit('error', error);
    }
    return false;
  }

  /**
   * Listen for output chunks
   */
  onChunk(callback: (chunk: string) => void): this {
    this.on('chunk', callback);
    return this;
  }

  /**
   * Listen for completion
   */
  onComplete(callback: (data: any) => void): this {
    this.on('complete', callback);
    return this;
  }

  /**
   * Listen for errors
   */
  onError(callback: (error: Error) => void): this {
    this.on('error', callback);
    return this;
  }
}

/**
 * Create an agent
 * 
 * Creates a new agent with the specified configuration within a city. Agents are
 * autonomous entities that can perform tasks and interact with the city's services.
 * 
 * @param config - Agent configuration including name, provider, and optional city, dir, and scope
 * @returns Promise resolving to the created agent information
 * @throws {AgentError} If agent creation fails after retries
 * 
 * @example
 * ```typescript
 * const agent = await createAgent({
 *   name: 'research-agent',
 *   provider: 'openai',
 *   city: 'production',
 *   dir: '/agents/research',
 *   scope: 'data-analysis'
 * });
 * console.log(`Agent created: ${agent.name}`);
 * ```
 */
export async function createAgent(config: AgentConfig): Promise<any> {
  const cityName = config.city || 'default';
  const xGcRequest = config.csrfToken;

  const response = await withRetry(async () => {
    return await DefaultService.createAgent(
      xGcRequest,
      cityName,
      {
        name: config.name,
        provider: config.provider,
        dir: config.dir,
        scope: config.scope,
      }
    );
  }, DEFAULT_RETRY_CONFIG, 'Agent creation');
  
  if (isErrorModel(response)) {
    throw new AgentError(`Agent creation failed: ${JSON.stringify(response)}`);
  }
  
  return response;
}

/**
 * Configure an agent
 * 
 * Updates the configuration of an existing agent. This allows you to modify
 * agent properties such as provider, directory, or scope without recreating
 * the agent.
 * 
 * @param agentRef - Agent reference (base name and optional directory)
 * @param config - Partial agent configuration to update (name, provider, dir, scope)
 * @param city - The city name where the agent exists (default: 'default')
 * @throws {AgentError} If agent configuration fails after retries
 * 
 * @example
 * ```typescript
 * // Configure unqualified agent
 * await configureAgent({ base: 'research-agent' }, {
 *   provider: 'anthropic',
 *   scope: 'advanced-analysis'
 * }, 'production');
 * 
 * // Configure qualified agent
 * await configureAgent({ base: 'research-agent', dir: '/agents/research' }, {
 *   provider: 'anthropic'
 * }, 'production');
 * ```
 */
export async function configureAgent(
  agentRef: AgentReference,
  config: Partial<AgentConfig>,
  city?: string,
  csrfToken?: string
): Promise<void> {
  const cityName = city || 'default';
  const xGcRequest = csrfToken;

  await withRetry(async () => {
    let response;
    
    if (agentRef.dir) {
      // Use qualified endpoint with dir
      response = await DefaultService.patchV0CityByCityNameAgentByDirByBase(
        xGcRequest,
        cityName,
        agentRef.dir,
        agentRef.base,
        config
      );
    } else {
      // Use unqualified endpoint
      response = await DefaultService.patchV0CityByCityNameAgentByBase(
        xGcRequest,
        cityName,
        agentRef.base,
        config
      );
    }
    
    if (isErrorModel(response)) {
      throw new AgentError(`Agent configuration failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Agent configuration');
}

/**
 * Monitor agent output
 * 
 * Retrieves the current output from an agent. This is useful for checking
 * the status or results of an agent's operations without streaming.
 * 
 * @param agentRef - Agent reference (base name and optional directory)
 * @param city - The city name where the agent exists (default: 'default')
 * @param tail - Number of recent compaction segments to return (optional)
 * @param before - Message UUID cursor for loading older messages (optional)
 * @returns Promise resolving to the agent's output
 * @throws {AgentError} If monitoring fails after retries
 * 
 * @example
 * ```typescript
 * // Monitor unqualified agent
 * const output = await monitorAgentOutput({ base: 'research-agent' }, 'production');
 * console.log('Agent output:', output);
 * 
 * // Monitor qualified agent
 * const output = await monitorAgentOutput({ base: 'research-agent', dir: '/agents/research' }, 'production');
 * ```
 */
export async function monitorAgentOutput(
  agentRef: AgentReference,
  city?: string,
  tail?: string,
  before?: string
): Promise<any> {
  const cityName = city || 'default';

  const response = await withRetry(async () => {
    if (agentRef.dir) {
      // Use qualified endpoint with dir
      return await DefaultService.getV0CityByCityNameAgentByDirByBaseOutput(
        cityName,
        agentRef.dir,
        agentRef.base,
        tail,
        before
      );
    } else {
      // Use unqualified endpoint
      return await DefaultService.getV0CityByCityNameAgentByBaseOutput(
        cityName,
        agentRef.base,
        tail,
        before
      );
    }
  }, DEFAULT_RETRY_CONFIG, 'Monitor agent output');
  
  if (isErrorModel(response)) {
    throw new AgentError(`Agent output monitoring failed: ${JSON.stringify(response)}`);
  }
  
  return response;
}

/**
 * Stream agent output
 * 
 * Opens a streaming connection to an agent's output, receiving real-time updates
 * as the agent processes tasks. This is useful for interactive applications that
 * need to display agent progress in real-time.
 * 
 * @param agentRef - Agent reference (base name and optional directory)
 * @param city - The city name where the agent exists (default: 'default')
 * @param options - Stream options including city and format preference
 * @returns An AgentStream that emits output chunks as they arrive
 * @throws {AgentError} If streaming fails after retries
 * 
 * @example
 * ```typescript
 * // Stream unqualified agent
 * const stream = await streamAgentOutput({ base: 'research-agent' }, 'production');
 * 
 * stream.onChunk((chunk) => {
 *   console.log('Agent output:', chunk);
 * });
 * 
 * stream.onComplete((data) => {
 *   console.log('Streaming complete:', data);
 * });
 * 
 * stream.onError((error) => {
 *   console.error('Stream error:', error);
 * });
 * 
 * // Later, stop the stream
 * stream.stop();
 * ```
 */
export async function streamAgentOutput(
  agentRef: AgentReference,
  city?: string,
  options?: AgentStreamOptions
): Promise<AgentStream> {
  const cityName = city || options?.city || 'default';
  const format = options?.format || 'raw';
  
  const stream = new AgentStream();
  
  withRetry(async () => {
    let response;
    
    if (agentRef.dir) {
      // Use qualified endpoint with dir
      response = await DefaultService.streamAgentOutputQualified(
        cityName,
        agentRef.dir,
        agentRef.base
      );
    } else {
      // Use unqualified endpoint
      response = await DefaultService.streamAgentOutput(
        cityName,
        agentRef.base
      );
    }
    
    if (isErrorModel(response)) {
      stream.emitError(new AgentError(`Agent output streaming failed: ${JSON.stringify(response)}`));
      return;
    }
    
    // Handle SSE events array
    if (Array.isArray(response)) {
      for (const event of response) {
        if (!stream.isStopped()) {
          const chunk = format === 'json' 
            ? JSON.stringify(event) 
            : JSON.stringify(event.data);
          
          stream.emitChunk(chunk);
        }
      }
      stream.emitComplete(response);
    } else {
      // Fallback if response is not an array
      stream.emitComplete(response);
    }
  }, DEFAULT_RETRY_CONFIG, 'Stream agent output').catch(error => {
    stream.emitError(error);
  });
  
  return stream;
}

/**
 * Delete an agent
 * 
 * Removes an agent from the city. This is a destructive operation that cannot
 * be undone. All agent data and configuration will be permanently removed.
 * 
 * @param agentRef - Agent reference (base name and optional directory)
 * @param city - The city name where the agent exists (default: 'default')
 * @throws {AgentError} If deletion fails after retries
 * 
 * @example
 * ```typescript
 * // Delete unqualified agent
 * await deleteAgent({ base: 'research-agent' }, 'production');
 * console.log('Agent deleted successfully');
 * 
 * // Delete qualified agent
 * await deleteAgent({ base: 'research-agent', dir: '/agents/research' }, 'production');
 * ```
 */
export async function deleteAgent(agentRef: AgentReference, city?: string, csrfToken?: string): Promise<void> {
  const cityName = city || 'default';
  const xGcRequest = csrfToken;

  await withRetry(async () => {
    let response;
    
    if (agentRef.dir) {
      // Use qualified endpoint with dir
      response = await DefaultService.deleteV0CityByCityNameAgentByDirByBase(
        xGcRequest,
        cityName,
        agentRef.dir,
        agentRef.base
      );
    } else {
      // Use unqualified endpoint
      response = await DefaultService.deleteV0CityByCityNameAgentByBase(
        xGcRequest,
        cityName,
        agentRef.base
      );
    }
    
    if (isErrorModel(response)) {
      throw new AgentError(`Agent deletion failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Agent deletion');
}
