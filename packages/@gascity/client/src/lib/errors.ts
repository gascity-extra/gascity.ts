/**
 * Gas City API error
 */
export class GasCityError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'GasCityError';
  }
}

/**
 * Handle API errors
 */
export function handleApiError(error: unknown): GasCityError {
  if (error instanceof GasCityError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new GasCityError(error.message);
  }
  
  return new GasCityError('Unknown error occurred');
}
