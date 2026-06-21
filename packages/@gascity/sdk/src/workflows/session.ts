import { EventEmitter } from 'eventemitter3';
import { DefaultService } from '@gascity/client';

export interface SessionConfig {
  agent: string;
  city?: string;
  scope?: string;
  csrfToken?: string; // Anti-CSRF token for API requests
}

export interface SessionInteractOptions {
  city?: string;
  stream?: boolean;
  csrfToken?: string; // Override CSRF token for this operation
}

export interface SessionStreamOptions {
  city?: string;
  format?: 'conversation' | 'raw';
}

/**
 * Error thrown when session operations fail
 */
export class SessionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Retry configuration for session operations
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
        throw new SessionError(
          `${operationName} failed after ${config.maxAttempts} attempts`,
          error
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= config.backoffMultiplier;
    }
  }

  throw new SessionError(
    `${operationName} failed unexpectedly`,
    lastError ?? new Error('No error captured')
  );
}

/**
 * Type guard to check if a response is an ErrorModel
 */
function isErrorModel(response: any): response is { detail: string } {
  return response && typeof response === 'object' && 'detail' in response;
}

/**
 * Session output event emitter for streaming
 */
export class SessionStream extends EventEmitter {
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
   * Emit a chunk of session output
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
 * Create a session
 * 
 * Creates a new session for an agent within a city. Sessions allow for persistent
 * interactions with agents, maintaining context across multiple messages.
 * 
 * @param config - Session configuration including agent, city, and optional scope
 * @returns Promise resolving to the created session information
 * @throws {SessionError} If session creation fails after retries
 * 
 * @example
 * ```typescript
 * const session = await createSession({
 *   agent: 'research-agent',
 *   city: 'production',
 *   scope: 'data-analysis'
 * });
 * console.log(`Session created: ${session.id}`);
 * ```
 */
export async function createSession(config: SessionConfig): Promise<any> {
  const cityName = config.city || 'default';
  const xGcRequest = config.csrfToken;

  const response = await withRetry(async () => {
    return await DefaultService.createSession(
      xGcRequest,
      cityName,
      {
        name: config.agent,
        kind: 'agent',
      }
    );
  }, DEFAULT_RETRY_CONFIG, 'Session creation');
  
  if (isErrorModel(response)) {
    throw new SessionError(`Session creation failed: ${JSON.stringify(response)}`);
  }
  
  return response;
}

/**
 * Interact with a session
 * 
 * Sends a message to a session and optionally streams the response. The session
 * maintains context from previous interactions, allowing for multi-turn conversations.
 * 
 * @param sessionId - The ID of the session to interact with
 * @param message - The message to send to the session
 * @param options - Interaction options including city and streaming preference
 * @returns Promise resolving to the interaction response, or a SessionStream if streaming
 * @throws {SessionError} If interaction fails after retries
 * 
 * @example
 * ```typescript
 * // Non-streaming interaction
 * const response = await interactSession('session-123', 'Analyze this data', {
 *   city: 'production'
 * });
 * console.log(response);
 * 
 * // Streaming interaction
 * const stream = await interactSession('session-123', 'Analyze this data', {
 *   city: 'production',
 *   stream: true
 * });
 * stream.onChunk((chunk) => console.log(chunk));
 * stream.onComplete((data) => console.log('Done:', data));
 * ```
 */
export async function interactSession(
  sessionId: string,
  message: string,
  options: SessionInteractOptions = {}
): Promise<any> {
  const cityName = options.city || 'default';
  const xGcRequest = options.csrfToken;

  if (options.stream) {
    // For streaming, we create a SessionStream
    const stream = new SessionStream();
    
    // Send the interaction request
    withRetry(async () => {
      const response = await DefaultService.sendSessionMessage(
        xGcRequest,
        cityName,
        sessionId,
        {
          message,
        }
      );
      
      if (isErrorModel(response)) {
        stream.emitError(new SessionError(`Session interaction failed: ${JSON.stringify(response)}`));
        return;
      }
      
      // Emit the response as complete
      // In a real implementation with true streaming, this would use streamSession
      stream.emitComplete(response);
    }, DEFAULT_RETRY_CONFIG, 'Session interaction').catch(error => {
      stream.emitError(error);
    });
    
    return stream;
  }
  
  const response = await withRetry(async () => {
    return await DefaultService.sendSessionMessage(
      xGcRequest,
      cityName,
      sessionId,
      {
        message,
      }
    );
  }, DEFAULT_RETRY_CONFIG, 'Session interaction');
  
  if (isErrorModel(response)) {
    throw new SessionError(`Session interaction failed: ${JSON.stringify(response)}`);
  }
  
  return response;
}

/**
 * Stream session events
 * 
 * Opens a streaming connection to a session, receiving real-time events including
 * messages, activity updates, and heartbeats. This is useful for building
 * interactive applications that need to respond to session events in real-time.
 * 
 * @param sessionId - The ID of the session to stream
 * @param options - Stream options including city and format preference
 * @returns A SessionStream that emits events as they arrive
 * @throws {SessionError} If streaming fails after retries
 * 
 * @example
 * ```typescript
 * const stream = await streamSession('session-123', {
 *   city: 'production',
 *   format: 'conversation'
 * });
 * 
 * stream.onChunk((chunk) => {
 *   console.log('Event:', chunk);
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
export async function streamSession(
  sessionId: string,
  options: SessionStreamOptions = {}
): Promise<SessionStream> {
  const cityName = options.city || 'default';
  const format = options.format || 'conversation';
  
  const stream = new SessionStream();
  
  withRetry(async () => {
    const events = await DefaultService.streamSession(
      cityName,
      sessionId,
      format
    );
    
    if (isErrorModel(events)) {
      stream.emitError(new SessionError(`Session streaming failed: ${JSON.stringify(events)}`));
      return;
    }
    
    // Emit each event as a chunk
    if (Array.isArray(events)) {
      for (const event of events) {
        if (!stream.isStopped()) {
          stream.emitChunk(JSON.stringify(event));
        }
      }
    }
    
    stream.emitComplete(events);
  }, DEFAULT_RETRY_CONFIG, 'Session streaming').catch(error => {
    stream.emitError(error);
  });
  
  return stream;
}

/**
 * Reset a session
 * 
 * Resets a session to its initial state by closing it. This is useful when you want
 * to start fresh with the same agent configuration. Note that this closes the session
 * - you'll need to create a new session to continue interactions.
 * 
 * @param sessionId - The ID of the session to reset
 * @param city - The city name where the session exists (default: 'default')
 * @throws {SessionError} If reset fails after retries
 * 
 * @example
 * ```typescript
 * await resetSession('session-123', 'production');
 * console.log('Session reset successfully');
 * ```
 */
export async function resetSession(sessionId: string, city?: string, csrfToken?: string): Promise<void> {
  const cityName = city || 'default';
  const xGcRequest = csrfToken;

  await withRetry(async () => {
    const response = await DefaultService.postV0CityByCityNameSessionByIdClose(
      xGcRequest,
      cityName,
      sessionId
    );
    
    if (isErrorModel(response)) {
      throw new SessionError(`Session reset failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Session reset');
}

/**
 * Get session transcript
 * 
 * Retrieves the full conversation transcript for a session, including all
 * messages and responses exchanged during the session's lifetime.
 * 
 * @param sessionId - The ID of the session to get the transcript for
 * @param city - The city name where the session exists (default: 'default')
 * @returns Promise resolving to the session transcript
 * @throws {SessionError} If retrieving the transcript fails after retries
 * 
 * @example
 * ```typescript
 * const transcript = await getSessionTranscript('session-123', 'production');
 * console.log('Conversation history:', transcript);
 * ```
 */
export async function getSessionTranscript(sessionId: string, city?: string): Promise<any> {
  const cityName = city || 'default';

  const response = await withRetry(async () => {
    return await DefaultService.getV0CityByCityNameSessionByIdTranscript(
      cityName,
      sessionId
    );
  }, DEFAULT_RETRY_CONFIG, 'Get session transcript');
  
  if (isErrorModel(response)) {
    throw new SessionError(`Session transcript retrieval failed: ${JSON.stringify(response)}`);
  }
  
  return response;
}

/**
 * Close a session
 * 
 * Closes a session, releasing its resources. After closing, the session can no
 * longer be used for interactions.
 * 
 * @param sessionId - The ID of the session to close
 * @param city - The city name where the session exists (default: 'default')
 * @throws {SessionError} If closing fails after retries
 * 
 * @example
 * ```typescript
 * await closeSession('session-123', 'production');
 * console.log('Session closed successfully');
 * ```
 */
export async function closeSession(sessionId: string, city?: string, csrfToken?: string): Promise<void> {
  const cityName = city || 'default';
  const xGcRequest = csrfToken;

  await withRetry(async () => {
    const response = await DefaultService.postV0CityByCityNameSessionByIdClose(
      xGcRequest,
      cityName,
      sessionId
    );
    
    if (isErrorModel(response)) {
      throw new SessionError(`Session closure failed: ${JSON.stringify(response)}`);
    }
  }, DEFAULT_RETRY_CONFIG, 'Session closure');
}
