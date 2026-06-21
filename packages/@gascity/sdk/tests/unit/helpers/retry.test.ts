import { describe, it, expect, vi } from 'vitest';
import { withRetry, type RetryOptions } from '../../../src/helpers/retry';

describe('Retry Helper', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure with exponential backoff', async () => {
      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAttempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        withRetry(fn, {
          maxAttempts: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('Persistent error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use default options when not provided', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use custom initialDelay', async () => {
      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use custom backoffMultiplier', async () => {
      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelay', async () => {
      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        backoffMultiplier: 10,
        maxDelay: 20,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw the last error after max attempts', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      const error3 = new Error('Error 3');

      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) throw error1;
        if (attemptCount === 2) throw error2;
        throw error3;
      });

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          initialDelay: 10,
        })
      ).rejects.toThrow('Error 3');
    });

    it('should handle synchronous errors', async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });

      await expect(
        withRetry(fn, {
          maxAttempts: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('Sync error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should work with async functions returning different types', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 'test', count: 42 });

      const result = await withRetry(fn);

      expect(result).toEqual({ data: 'test', count: 42 });
    });

    it('should not retry when maxAttempts is 1', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      await expect(withRetry(fn, { maxAttempts: 1 })).rejects.toThrow('Error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle zero initialDelay', async () => {
      let attemptCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 0,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
