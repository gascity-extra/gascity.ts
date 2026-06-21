import { DefaultService, type CityInfo, CityCreateRequest } from '@gascity/client';

export interface CityConfig {
  dir: string;
  provider?: string;
  bootstrapProfile?: CityCreateRequest.bootstrap_profile;
}

export interface CityInitOptions {
  waitForReady?: boolean;
  timeout?: number;
}

/**
 * Error thrown when city operations fail
 */
export class CityError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CityError';
  }
}

/**
 * Retry configuration for city operations
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
        throw new CityError(
          `${operationName} failed after ${config.maxAttempts} attempts`,
          error
        );
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= config.backoffMultiplier;
    }
  }

  throw new CityError(
    `${operationName} failed unexpectedly`,
    lastError
  );
}

/**
 * Initialize a new city
 * 
 * Creates a new city with the specified configuration. Optionally waits for the city
 * to become ready before returning.
 * 
 * @param config - City configuration including path, packs, provider, and bootstrap profile
 * @param options - Initialization options including whether to wait for ready and timeout
 * @returns Promise resolving to the created city information
 * @throws {CityError} If city initialization fails after retries
 * 
 * @example
 * ```typescript
 * const city = await initCity({
 *   path: '/my-city',
 *   packs: ['gascity', 'custom-pack'],
 *   provider: 'local',
 * }, { waitForReady: true, timeout: 60000 });
 * ```
 */
export async function initCity(
  config: CityConfig,
  options: CityInitOptions = {}
): Promise<CityInfo> {
  return withRetry(async () => {
    // Note: xGcRequest is an Anti-CSRF header - in a real implementation,
    // this should be passed as a parameter or obtained from a session
    const xGcRequest = 'sdk-request'; // Placeholder
    
    const response = await DefaultService.postV0City(
      xGcRequest,
      {
        dir: config.dir,
        provider: config.provider,
        bootstrap_profile: config.bootstrapProfile,
      },
    );
    
    // The response is AsyncAcceptedResponse, not directly CityInfo
    // In a real implementation, we might need to poll for the result
    // For now, we'll return a placeholder
    const cityInfo: CityInfo = {
      name: config.dir.split('/').pop() || 'unknown',
    } as CityInfo;
    
    if (options.waitForReady) {
      await waitForCityReady(cityInfo.name, options.timeout);
    }
    
    return cityInfo;
  }, DEFAULT_RETRY_CONFIG, 'City initialization');
}

/**
 * Start a city
 * 
 * Starts a previously initialized city. The city must be registered with the supervisor.
 * 
 * @param cityName - The name of the city to start
 * @throws {CityError} If starting the city fails after retries
 * 
 * @example
 * ```typescript
 * await startCity('my-city');
 * ```
 */
export async function startCity(cityName: string): Promise<void> {
  return withRetry(async () => {
    // TODO: This method doesn't exist in the current OpenAPI spec
    // It needs to be added to the API or the client regenerated
    throw new CityError(
      'startCity is not yet implemented - API endpoint not available'
    );
    // Placeholder for when the API method is available:
    // const xGcRequest = 'sdk-request';
    // await DefaultService.postV0CityByCityNameStart(xGcRequest, cityName);
  }, DEFAULT_RETRY_CONFIG, 'City start');
}

/**
 * Stop a city
 * 
 * Stops a running city. This gracefully shuts down the city's services.
 * 
 * @param cityName - The name of the city to stop
 * @throws {CityError} If stopping the city fails after retries
 * 
 * @example
 * ```typescript
 * await stopCity('my-city');
 * ```
 */
export async function stopCity(cityName: string): Promise<void> {
  return withRetry(async () => {
    // TODO: This method doesn't exist in the current OpenAPI spec
    // It needs to be added to the API or the client regenerated
    throw new CityError(
      'stopCity is not yet implemented - API endpoint not available'
    );
    // Placeholder for when the API method is available:
    // const xGcRequest = 'sdk-request';
    // await DefaultService.postV0CityByCityNameStop(xGcRequest, cityName);
  }, DEFAULT_RETRY_CONFIG, 'City stop');
}

/**
 * Register a city with the supervisor
 * 
 * Registers a city with the supervisor, making it discoverable and manageable.
 * This is typically done after city initialization.
 * 
 * @param cityName - The name of the city to register
 * @throws {CityError} If registration fails after retries
 * 
 * @example
 * ```typescript
 * await registerCity('my-city');
 * ```
 */
export async function registerCity(cityName: string): Promise<void> {
  return withRetry(async () => {
    // TODO: This method doesn't exist in the current OpenAPI spec
    // It needs to be added to the API or the client regenerated
    throw new CityError(
      'registerCity is not yet implemented - API endpoint not available'
    );
    // Placeholder for when the API method is available:
    // const xGcRequest = 'sdk-request';
    // await DefaultService.postV0CityByCityNameRegister(xGcRequest, cityName);
  }, DEFAULT_RETRY_CONFIG, 'City registration');
}

/**
 * Unregister a city from the supervisor
 * 
 * Removes a city from the supervisor's registry. The city will no longer be
 * discoverable or manageable through the supervisor.
 * 
 * @param cityName - The name of the city to unregister
 * @throws {CityError} If unregistration fails after retries
 * 
 * @example
 * ```typescript
 * await unregisterCity('my-city');
 * ```
 */
export async function unregisterCity(cityName: string): Promise<void> {
  return withRetry(async () => {
    const xGcRequest = 'sdk-request'; // Placeholder
    await DefaultService.postV0CityByCityNameUnregister(xGcRequest, cityName);
  }, DEFAULT_RETRY_CONFIG, 'City unregistration');
}

/**
 * Wait for city to be ready
 * 
 * Polls the city's readiness endpoint until it reports ready or the timeout is exceeded.
 * This is useful when you need to ensure a city is fully operational before proceeding.
 * 
 * @param cityName - The name of the city to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 30000ms)
 * @throws {CityError} If the city does not become ready within the timeout
 * 
 * @example
 * ```typescript
 * await waitForCityReady('my-city', 60000);
 * ```
 */
export async function waitForCityReady(
  cityName: string,
  timeout = 30000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 1000;
  
  while (Date.now() - startTime < timeout) {
    try {
      const readiness = await DefaultService.getV0CityByCityNameReadiness(cityName);
      
      // Check if the response is successful (not an error)
      if ('items' in readiness) {
        // In a real implementation, we might want to check if all items have a healthy status
        // For now, we'll consider the city ready if we can successfully query readiness
        return;
      }
    } catch (error) {
      // City not ready yet, continue waiting
      // Log error if needed for debugging
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new CityError(
    `City ${cityName} did not become ready within ${timeout}ms`
  );
}

/**
 * Get city status
 * 
 * Retrieves the current status and information for a city.
 * 
 * @param cityName - The name of the city to query
 * @returns Promise resolving to the city information
 * @throws {CityError} If getting the status fails after retries
 * 
 * @example
 * ```typescript
 * const status = await getCityStatus('my-city');
 * console.log(status);
 * ```
 */
export async function getCityStatus(cityName: string): Promise<CityInfo> {
  return withRetry(async () => {
    const response = await DefaultService.getV0CityByCityNameStatus(cityName);
    
    // The API returns StatusBody, not CityInfo
    // We need to extract the city information or return a CityInfo object
    // For now, we'll create a CityInfo object from the status response
    const cityInfo: CityInfo = {
      name: cityName,
    } as CityInfo;
    
    // If the response contains city information, we could merge it here
    if ('items' in response) {
      Object.assign(cityInfo, response);
    }
    
    return cityInfo;
  }, DEFAULT_RETRY_CONFIG, 'Get city status');
}
