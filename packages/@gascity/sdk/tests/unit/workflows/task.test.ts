import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  slingTask,
  waitForTaskCompletion,
  monitorTask,
  closeTask,
  reopenTask,
  generateCorrelationId,
  TaskError,
  type TaskConfig,
  type TaskCompletionOptions,
} from '../../../src/workflows/task';

// Mock the @gascity/client module
vi.mock('@gascity/client', () => ({
  DefaultService: {
    postV0CityByCityNameSling: vi.fn(),
    getV0CityByCityNameBeadById: vi.fn(),
    postV0CityByCityNameBeadByIdClose: vi.fn(),
    postV0CityByCityNameBeadByIdReopen: vi.fn(),
  },
}));

import { DefaultService } from '@gascity/client';

describe('Task Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCorrelationId', () => {
    it('should generate a unique correlation ID', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^task_\d+_[a-z0-9]+$/);
    });
  });

  describe('slingTask', () => {
    it('should sling a task successfully', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
        city: 'production',
      };

      const mockResponse = {
        bead: 'bead_123',
        status: 'open',
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling).mockResolvedValue(mockResponse as any);

      const result = await slingTask(config);

      expect(DefaultService.postV0CityByCityNameSling).toHaveBeenCalledWith(
        'sdk-request',
        'production',
        expect.objectContaining({
          target: 'research-agent',
          title: 'Analyze market trends',
          vars: expect.objectContaining({
            task: 'Analyze market trends',
            correlationId: expect.stringMatching(/^task_\d+_[a-z0-9]+$/),
            submittedAt: expect.any(String),
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default city when not provided', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling).mockResolvedValue({
        bead: 'bead_123',
      } as any);

      await slingTask(config);

      expect(DefaultService.postV0CityByCityNameSling).toHaveBeenCalledWith(
        'sdk-request',
        'default',
        expect.any(Object)
      );
    });

    it('should include metadata in task vars', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
        city: 'production',
        metadata: {
          priority: 'high',
          requestId: '12345',
        },
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling).mockResolvedValue({
        bead: 'bead_123',
      } as any);

      await slingTask(config);

      const callArgs = vi.mocked(DefaultService.postV0CityByCityNameSling).mock.calls[0];
      expect(callArgs[2].vars).toMatchObject({
        priority: 'high',
        requestId: '12345',
      });
    });

    it('should retry on failure', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ bead: 'bead_123' } as any);

      await slingTask(config);

      expect(DefaultService.postV0CityByCityNameSling).toHaveBeenCalledTimes(3);
    });

    it('should throw TaskError on error response', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling).mockResolvedValue({
        detail: 'Invalid agent',
      } as any);

      await expect(slingTask(config)).rejects.toThrow(TaskError);
    });

    it('should throw TaskError after max retries', async () => {
      const config: TaskConfig = {
        agent: 'research-agent',
        task: 'Analyze market trends',
      };

      vi.mocked(DefaultService.postV0CityByCityNameSling).mockRejectedValue(
        new Error('Network error')
      );

      await expect(slingTask(config)).rejects.toThrow(TaskError);
      await expect(slingTask(config)).rejects.toThrow('Task submission failed after 3 attempts');
    });
  });

  describe('waitForTaskCompletion', () => {
    it('should return when task is complete', async () => {
      const mockBead = {
        id: 'bead_123',
        status: 'closed',
      };

      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockResolvedValue(mockBead as any);

      const options: TaskCompletionOptions = {
        city: 'production',
        timeout: 60000,
      };

      await waitForTaskCompletion('bead_123', options);

      expect(DefaultService.getV0CityByCityNameBeadById).toHaveBeenCalledWith(
        'production',
        'bead_123'
      );
    });

    it('should poll until task is complete', async () => {
      let callCount = 0;
      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ status: 'open' } as any);
        }
        return Promise.resolve({ status: 'closed' } as any);
      });

      const options: TaskCompletionOptions = {
        city: 'production',
        timeout: 10000,
      };

      await waitForTaskCompletion('bead_123', options);

      expect(callCount).toBe(3);
    });

    it('should throw error when timeout is exceeded', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockResolvedValue({
        status: 'open',
      } as any);

      const options: TaskCompletionOptions = {
        city: 'production',
        timeout: 1000,
      };

      await expect(waitForTaskCompletion('bead_123', options)).rejects.toThrow(TaskError);
      await expect(waitForTaskCompletion('bead_123', options)).rejects.toThrow(
        'Task bead_123 did not complete within 1000ms'
      );
    });

    it('should handle bead not found during polling', async () => {
      let callCount = 0;
      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve({ status: 'closed' } as any);
      });

      const options: TaskCompletionOptions = {
        city: 'production',
        timeout: 10000,
      };

      await waitForTaskCompletion('bead_123', options);

      expect(callCount).toBe(3);
    });
  });

  describe('monitorTask', () => {
    it('should monitor task status successfully', async () => {
      const mockBead = {
        id: 'bead_123',
        status: 'open',
        assignee: 'research-agent',
      };

      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockResolvedValue(mockBead as any);

      const result = await monitorTask('bead_123', 'production');

      expect(DefaultService.getV0CityByCityNameBeadById).toHaveBeenCalledWith(
        'production',
        'bead_123'
      );
      expect(result).toEqual(mockBead);
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameBeadById)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ status: 'open' } as any);

      await monitorTask('bead_123', 'production');

      expect(DefaultService.getV0CityByCityNameBeadById).toHaveBeenCalledTimes(3);
    });

    it('should throw TaskError on error response', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockResolvedValue({
        detail: 'Bead not found',
      } as any);

      await expect(monitorTask('bead_123', 'production')).rejects.toThrow(TaskError);
    });

    it('should throw TaskError after max retries', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameBeadById).mockRejectedValue(
        new Error('Network error')
      );

      await expect(monitorTask('bead_123', 'production')).rejects.toThrow(TaskError);
      await expect(monitorTask('bead_123', 'production')).rejects.toThrow(
        'Task monitoring failed after 3 attempts'
      );
    });
  });

  describe('closeTask', () => {
    it('should close a task successfully', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdClose).mockResolvedValue(undefined);

      await closeTask('bead_123', 'production');

      expect(DefaultService.postV0CityByCityNameBeadByIdClose).toHaveBeenCalledWith(
        'sdk-request',
        'production',
        'bead_123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdClose)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await closeTask('bead_123', 'production');

      expect(DefaultService.postV0CityByCityNameBeadByIdClose).toHaveBeenCalledTimes(3);
    });

    it('should throw TaskError on error response', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdClose).mockResolvedValue({
        detail: 'Bead not found',
      } as any);

      await expect(closeTask('bead_123', 'production')).rejects.toThrow(TaskError);
    });

    it('should throw TaskError after max retries', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdClose).mockRejectedValue(
        new Error('Network error')
      );

      await expect(closeTask('bead_123', 'production')).rejects.toThrow(TaskError);
      await expect(closeTask('bead_123', 'production')).rejects.toThrow(
        'Task closure failed after 3 attempts'
      );
    });
  });

  describe('reopenTask', () => {
    it('should reopen a task successfully', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdReopen).mockResolvedValue(undefined);

      await reopenTask('bead_123', 'production');

      expect(DefaultService.postV0CityByCityNameBeadByIdReopen).toHaveBeenCalledWith(
        'sdk-request',
        'production',
        'bead_123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdReopen)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await reopenTask('bead_123', 'production');

      expect(DefaultService.postV0CityByCityNameBeadByIdReopen).toHaveBeenCalledTimes(3);
    });

    it('should throw TaskError on error response', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdReopen).mockResolvedValue({
        detail: 'Bead not found',
      } as any);

      await expect(reopenTask('bead_123', 'production')).rejects.toThrow(TaskError);
    });

    it('should throw TaskError after max retries', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameBeadByIdReopen).mockRejectedValue(
        new Error('Network error')
      );

      await expect(reopenTask('bead_123', 'production')).rejects.toThrow(TaskError);
      await expect(reopenTask('bead_123', 'production')).rejects.toThrow(
        'Task reopening failed after 3 attempts'
      );
    });
  });
});
