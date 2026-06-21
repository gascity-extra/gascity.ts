import { describe, it, expect } from 'vitest';
import { GasCityError, handleApiError } from '../../src/lib/errors';

describe('GasCityError', () => {
  it('should create error with message', () => {
    const error = new GasCityError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('GasCityError');
  });

  it('should create error with status code', () => {
    const error = new GasCityError('Test error', 404);
    expect(error.statusCode).toBe(404);
  });

  it('should create error with code', () => {
    const error = new GasCityError('Test error', 404, 'NOT_FOUND');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should create error with details', () => {
    const error = new GasCityError('Test error', 404, 'NOT_FOUND', 'Resource not found');
    expect(error.details).toBe('Resource not found');
  });

  it('should create error with all properties', () => {
    const error = new GasCityError('Test error', 500, 'INTERNAL_ERROR', 'Server error occurred');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('GasCityError');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.details).toBe('Server error occurred');
  });
});

describe('handleApiError', () => {
  it('should handle GasCityError', () => {
    const error = new GasCityError('Test');
    const handled = handleApiError(error);
    expect(handled).toBe(error);
  });

  it('should handle generic Error', () => {
    const error = new Error('Test');
    const handled = handleApiError(error);
    expect(handled).toBeInstanceOf(GasCityError);
    expect(handled.message).toBe('Test');
  });

  it('should handle unknown error', () => {
    const handled = handleApiError('string error');
    expect(handled).toBeInstanceOf(GasCityError);
    expect(handled.message).toBe('Unknown error occurred');
  });

  it('should handle null', () => {
    const handled = handleApiError(null);
    expect(handled).toBeInstanceOf(GasCityError);
    expect(handled.message).toBe('Unknown error occurred');
  });

  it('should handle undefined', () => {
    const handled = handleApiError(undefined);
    expect(handled).toBeInstanceOf(GasCityError);
    expect(handled.message).toBe('Unknown error occurred');
  });
});
