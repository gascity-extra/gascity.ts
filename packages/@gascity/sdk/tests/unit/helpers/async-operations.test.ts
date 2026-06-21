import { describe, it, expect, vi } from 'vitest';
import {
  waitForCompletion,
  parallel,
  sequence,
} from '../../../src/helpers/async-operations';

describe('Async Operations Helper', () => {
  describe('waitForCompletion', () => {
    it('should resolve when checkFn returns true', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 3;
      });

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 10,
      });

      expect(checkFn).toHaveBeenCalledTimes(3);
    });

    it('should resolve immediately when checkFn returns true on first call', async () => {
      const checkFn = vi.fn().mockResolvedValue(true);

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 100,
      });

      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should use default timeout and interval when not provided', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 2; // Complete quickly
      });

      await waitForCompletion(checkFn);

      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('should throw error when timeout is exceeded', async () => {
      const checkFn = vi.fn().mockResolvedValue(false);

      await expect(
        waitForCompletion(checkFn, {
          timeout: 100,
          interval: 10,
        })
      ).rejects.toThrow('Operation did not complete within timeout');
    });

    it('should respect custom interval', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 3;
      });

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 10,
      });

      expect(checkFn).toHaveBeenCalledTimes(3);
    });

    it('should handle async checkFn', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        callCount++;
        return callCount >= 3;
      });

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 10,
      });

      expect(checkFn).toHaveBeenCalledTimes(3);
    });

    it.skip('should handle checkFn that throws errors', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Not ready');
        }
        return true;
      });

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 10,
      });

      expect(checkFn).toHaveBeenCalledTimes(3);
    });

    it('should stop polling after completion', async () => {
      let callCount = 0;
      const checkFn = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount >= 2;
      });

      await waitForCompletion(checkFn, {
        timeout: 10000,
        interval: 10,
      });

      // Wait a bit to ensure no more calls
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(checkFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('parallel', () => {
    it('should execute operations in parallel', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockResolvedValue('result2');
      const op3 = vi.fn().mockResolvedValue('result3');

      const results = await parallel([op1, op2, op3]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(op1).toHaveBeenCalledTimes(1);
      expect(op2).toHaveBeenCalledTimes(1);
      expect(op3).toHaveBeenCalledTimes(1);
    });

    it('should maintain order of results', async () => {
      const op1 = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result1';
      });
      const op2 = vi.fn().mockResolvedValue('result2');
      const op3 = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result3';
      });

      const results = await parallel([op1, op2, op3]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should handle empty array', async () => {
      const results = await parallel([]);

      expect(results).toEqual([]);
    });

    it('should handle single operation', async () => {
      const op = vi.fn().mockResolvedValue('result');

      const results = await parallel([op]);

      expect(results).toEqual(['result']);
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should reject when any operation fails', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const op3 = vi.fn().mockResolvedValue('result3');

      await expect(parallel([op1, op2, op3])).rejects.toThrow('Operation failed');
    });

    it('should execute operations that are functions returning promises', async () => {
      const op1 = () => Promise.resolve('result1');
      const op2 = () => Promise.resolve('result2');

      const results = await parallel([op1, op2]);

      expect(results).toEqual(['result1', 'result2']);
    });

    it('should handle operations with different types', async () => {
      const op1 = vi.fn().mockResolvedValue(42);
      const op2 = vi.fn().mockResolvedValue('string');
      const op3 = vi.fn().mockResolvedValue({ key: 'value' });

      const results = await parallel([op1, op2, op3]);

      expect(results).toEqual([42, 'string', { key: 'value' }]);
    });

    it('should handle operations that resolve to undefined', async () => {
      const op1 = vi.fn().mockResolvedValue(undefined);
      const op2 = vi.fn().mockResolvedValue('result');

      const results = await parallel([op1, op2]);

      expect(results).toEqual([undefined, 'result']);
    });
  });

  describe('sequence', () => {
    it('should execute operations in sequence', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockResolvedValue('result2');
      const op3 = vi.fn().mockResolvedValue('result3');

      const results = await sequence([op1, op2, op3]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(op1).toHaveBeenCalledTimes(1);
      expect(op2).toHaveBeenCalledTimes(1);
      expect(op3).toHaveBeenCalledTimes(1);
    });

    it('should maintain order of execution', async () => {
      const executionOrder: string[] = [];

      const op1 = vi.fn().mockImplementation(async () => {
        executionOrder.push('op1');
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result1';
      });
      const op2 = vi.fn().mockImplementation(async () => {
        executionOrder.push('op2');
        return 'result2';
      });
      const op3 = vi.fn().mockImplementation(async () => {
        executionOrder.push('op3');
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'result3';
      });

      await sequence([op1, op2, op3]);

      expect(executionOrder).toEqual(['op1', 'op2', 'op3']);
    });

    it('should handle empty array', async () => {
      const results = await sequence([]);

      expect(results).toEqual([]);
    });

    it('should handle single operation', async () => {
      const op = vi.fn().mockResolvedValue('result');

      const results = await sequence([op]);

      expect(results).toEqual(['result']);
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should reject when any operation fails', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const op3 = vi.fn().mockResolvedValue('result3');

      await expect(sequence([op1, op2, op3])).rejects.toThrow('Operation failed');
    });

    it('should not execute subsequent operations after failure', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const op3 = vi.fn().mockResolvedValue('result3');

      await expect(sequence([op1, op2, op3])).rejects.toThrow('Operation failed');

      expect(op1).toHaveBeenCalledTimes(1);
      expect(op2).toHaveBeenCalledTimes(1);
      expect(op3).not.toHaveBeenCalled();
    });

    it('should execute operations that are functions returning promises', async () => {
      const op1 = () => Promise.resolve('result1');
      const op2 = () => Promise.resolve('result2');

      const results = await sequence([op1, op2]);

      expect(results).toEqual(['result1', 'result2']);
    });

    it('should handle operations with different types', async () => {
      const op1 = vi.fn().mockResolvedValue(42);
      const op2 = vi.fn().mockResolvedValue('string');
      const op3 = vi.fn().mockResolvedValue({ key: 'value' });

      const results = await sequence([op1, op2, op3]);

      expect(results).toEqual([42, 'string', { key: 'value' }]);
    });

    it('should handle operations that resolve to undefined', async () => {
      const op1 = vi.fn().mockResolvedValue(undefined);
      const op2 = vi.fn().mockResolvedValue('result');

      const results = await sequence([op1, op2]);

      expect(results).toEqual([undefined, 'result']);
    });

    it('should wait for each operation to complete before starting the next', async () => {
      let op2Started = false;

      const op1 = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result1';
      });
      const op2 = vi.fn().mockImplementation(async () => {
        op2Started = true;
        return 'result2';
      });

      const promise = sequence([op1, op2]);

      // Check that op2 hasn't started yet (small delay to ensure op1 is running)
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(op2Started).toBe(false);

      // Wait for completion
      await promise;

      expect(op2Started).toBe(true);
    });
  });
});
