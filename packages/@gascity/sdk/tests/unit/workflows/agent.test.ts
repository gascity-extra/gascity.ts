import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAgent,
  configureAgent,
  monitorAgentOutput,
  streamAgentOutput,
  deleteAgent,
  AgentError,
  AgentStream,
  type AgentConfig,
  type AgentReference,
  type AgentStreamOptions,
} from '../../../src/workflows/agent';

// Mock the @gascity/client module
vi.mock('@gascity/client', () => ({
  DefaultService: {
    createAgent: vi.fn(),
    patchV0CityByCityNameAgentByBase: vi.fn(),
    patchV0CityByCityNameAgentByDirByBase: vi.fn(),
    getV0CityByCityNameAgentByBaseOutput: vi.fn(),
    getV0CityByCityNameAgentByDirByBaseOutput: vi.fn(),
    streamAgentOutput: vi.fn(),
    streamAgentOutputQualified: vi.fn(),
    deleteV0CityByCityNameAgentByBase: vi.fn(),
    deleteV0CityByCityNameAgentByDirByBase: vi.fn(),
  },
}));

import { DefaultService } from '@gascity/client';

describe('Agent Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AgentStream', () => {
    it('should create a new AgentStream', () => {
      const stream = new AgentStream();
      expect(stream).toBeDefined();
      expect(stream.isStopped()).toBe(false);
    });

    it('should stop the stream', () => {
      const stream = new AgentStream();
      stream.stop();
      expect(stream.isStopped()).toBe(true);
    });

    it('should emit chunks', () => {
      const stream = new AgentStream();
      const callback = vi.fn();
      stream.onChunk(callback);

      const result = stream.emitChunk('test chunk');
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith('test chunk');
    });

    it('should not emit chunks when stopped', () => {
      const stream = new AgentStream();
      stream.stop();
      const callback = vi.fn();
      stream.onChunk(callback);

      const result = stream.emitChunk('test chunk');
      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should emit complete event', () => {
      const stream = new AgentStream();
      const callback = vi.fn();
      stream.onComplete(callback);

      const data = { result: 'done' };
      const result = stream.emitComplete(data);
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith(data);
    });

    it('should emit error event', () => {
      const stream = new AgentStream();
      const callback = vi.fn();
      stream.onError(callback);

      const error = new Error('Test error');
      const result = stream.emitError(error);
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith(error);
    });

    it('should support method chaining for event listeners', () => {
      const stream = new AgentStream();
      const chunkCallback = vi.fn();
      const completeCallback = vi.fn();
      const errorCallback = vi.fn();

      const result = stream
        .onChunk(chunkCallback)
        .onComplete(completeCallback)
        .onError(errorCallback);

      expect(result).toBe(stream);
    });
  });

  describe('createAgent', () => {
    it('should create an agent successfully', async () => {
      const config: AgentConfig = {
        name: 'research-agent',
        provider: 'openai',
        city: 'production',
        dir: '/agents/research',
        scope: 'data-analysis',
      };

      const mockAgent = {
        id: 'agent-123',
        name: 'research-agent',
        provider: 'openai',
      };

      vi.mocked(DefaultService.createAgent).mockResolvedValue(mockAgent as any);

      const result = await createAgent(config);

      expect(DefaultService.createAgent).toHaveBeenCalledWith(
        undefined,
        'production',
        expect.objectContaining({
          name: 'research-agent',
          provider: 'openai',
          dir: '/agents/research',
          scope: 'data-analysis',
        })
      );
      expect(result).toEqual(mockAgent);
    });

    it('should use default city when not provided', async () => {
      const config: AgentConfig = {
        name: 'research-agent',
        provider: 'openai',
      };

      vi.mocked(DefaultService.createAgent).mockResolvedValue({ id: 'agent-123' } as any);

      await createAgent(config);

      expect(DefaultService.createAgent).toHaveBeenCalledWith(
        undefined,
        'default',
        expect.any(Object)
      );
    });

    it('should retry on failure', async () => {
      const config: AgentConfig = {
        name: 'research-agent',
        provider: 'openai',
      };

      vi.mocked(DefaultService.createAgent)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ id: 'agent-123' } as any);

      await createAgent(config);

      expect(DefaultService.createAgent).toHaveBeenCalledTimes(3);
    });

    it('should throw AgentError on error response', async () => {
      const config: AgentConfig = {
        name: 'research-agent',
        provider: 'openai',
      };

      vi.mocked(DefaultService.createAgent).mockResolvedValue({
        detail: 'Invalid provider',
      } as any);

      await expect(createAgent(config)).rejects.toThrow(AgentError);
    });

    it.skip('should throw AgentError after max retries', async () => {
      const config: AgentConfig = {
        name: 'research-agent',
        provider: 'openai',
      };

      vi.mocked(DefaultService.createAgent).mockRejectedValue(new Error('Network error'));

      await expect(createAgent(config)).rejects.toThrow(AgentError);
      await expect(createAgent(config)).rejects.toThrow('Agent creation failed after 3 attempts');
    });
  });

  describe('configureAgent', () => {
    it('should configure an unqualified agent successfully', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
        scope: 'advanced-analysis',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByBase).mockResolvedValue(undefined);

      await configureAgent(agentRef, config, 'production');

      expect(DefaultService.patchV0CityByCityNameAgentByBase).toHaveBeenCalledWith(
        undefined,
        'production',
        'research-agent',
        config
      );
    });

    it('should configure a qualified agent successfully', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
        dir: '/agents/research',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByDirByBase).mockResolvedValue(
        undefined
      );

      await configureAgent(agentRef, config, 'production');

      expect(DefaultService.patchV0CityByCityNameAgentByDirByBase).toHaveBeenCalledWith(
        undefined,
        'production',
        '/agents/research',
        'research-agent',
        config
      );
    });

    it('should use default city when not provided', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByBase).mockResolvedValue(undefined);

      await configureAgent(agentRef, config);

      expect(DefaultService.patchV0CityByCityNameAgentByBase).toHaveBeenCalledWith(
        undefined,
        'default',
        'research-agent',
        config
      );
    });

    it('should retry on failure', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByBase)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await configureAgent(agentRef, config, 'production');

      expect(DefaultService.patchV0CityByCityNameAgentByBase).toHaveBeenCalledTimes(3);
    });

    it('should throw AgentError on error response', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByBase).mockResolvedValue({
        detail: 'Agent not found',
      } as any);

      await expect(configureAgent(agentRef, config, 'production')).rejects.toThrow(AgentError);
    });

    it.skip('should throw AgentError after max retries', async () => {
      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const config: Partial<AgentConfig> = {
        provider: 'anthropic',
      };

      vi.mocked(DefaultService.patchV0CityByCityNameAgentByBase).mockRejectedValue(
        new Error('Network error')
      );

      await expect(configureAgent(agentRef, config, 'production')).rejects.toThrow(AgentError);
      await expect(configureAgent(agentRef, config, 'production')).rejects.toThrow(
        'Agent configuration failed after 3 attempts'
      );
    });
  });

  describe('monitorAgentOutput', () => {
    it('should monitor unqualified agent output successfully', async () => {
      const mockOutput = {
        messages: [{ content: 'Processing data...' }],
      };

      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput).mockResolvedValue(
        mockOutput as any
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const result = await monitorAgentOutput(agentRef, 'production');

      expect(DefaultService.getV0CityByCityNameAgentByBaseOutput).toHaveBeenCalledWith(
        'production',
        'research-agent',
        undefined,
        undefined
      );
      expect(result).toEqual(mockOutput);
    });

    it('should monitor qualified agent output successfully', async () => {
      const mockOutput = {
        messages: [{ content: 'Processing data...' }],
      };

      vi.mocked(DefaultService.getV0CityByCityNameAgentByDirByBaseOutput).mockResolvedValue(
        mockOutput as any
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
        dir: '/agents/research',
      };

      const result = await monitorAgentOutput(agentRef, 'production');

      expect(DefaultService.getV0CityByCityNameAgentByDirByBaseOutput).toHaveBeenCalledWith(
        'production',
        '/agents/research',
        'research-agent',
        undefined,
        undefined
      );
      expect(result).toEqual(mockOutput);
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput).mockResolvedValue(
        {} as any
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await monitorAgentOutput(agentRef);

      expect(DefaultService.getV0CityByCityNameAgentByBaseOutput).toHaveBeenCalledWith(
        'default',
        'research-agent',
        undefined,
        undefined
      );
    });

    it('should pass tail and before parameters', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput).mockResolvedValue(
        {} as any
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await monitorAgentOutput(agentRef, 'production', '10', 'msg-123');

      expect(DefaultService.getV0CityByCityNameAgentByBaseOutput).toHaveBeenCalledWith(
        'production',
        'research-agent',
        '10',
        'msg-123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({} as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await monitorAgentOutput(agentRef, 'production');

      expect(DefaultService.getV0CityByCityNameAgentByBaseOutput).toHaveBeenCalledTimes(3);
    });

    it('should throw AgentError on error response', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput).mockResolvedValue({
        detail: 'Agent not found',
      } as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await expect(monitorAgentOutput(agentRef, 'production')).rejects.toThrow(AgentError);
    });

    it.skip('should throw AgentError after max retries', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameAgentByBaseOutput).mockRejectedValue(
        new Error('Network error')
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await expect(monitorAgentOutput(agentRef, 'production')).rejects.toThrow(AgentError);
      await expect(monitorAgentOutput(agentRef, 'production')).rejects.toThrow(
        'Monitor agent output failed after 3 attempts'
      );
    });
  });

  describe.skip('streamAgentOutput', () => {
    it('should stream unqualified agent output successfully', async () => {
      const mockEvents = [
        { data: 'Processing...' },
        { data: 'Done' },
      ];

      vi.mocked(DefaultService.streamAgentOutput).mockResolvedValue(mockEvents as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const stream = await streamAgentOutput(agentRef, 'production');

      expect(stream).toBeInstanceOf(AgentStream);
      expect(DefaultService.streamAgentOutput).toHaveBeenCalledWith('production', 'research-agent');
    });

    it('should stream qualified agent output successfully', async () => {
      const mockEvents = [
        { data: 'Processing...' },
        { data: 'Done' },
      ];

      vi.mocked(DefaultService.streamAgentOutputQualified).mockResolvedValue(mockEvents as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
        dir: '/agents/research',
      };

      const stream = await streamAgentOutput(agentRef, 'production');

      expect(stream).toBeInstanceOf(AgentStream);
      expect(DefaultService.streamAgentOutputQualified).toHaveBeenCalledWith(
        'production',
        '/agents/research',
        'research-agent'
      );
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.streamAgentOutput).mockResolvedValue([] as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await streamAgentOutput(agentRef);

      expect(DefaultService.streamAgentOutput).toHaveBeenCalledWith('default', 'research-agent');
    });

    it('should use default format when not provided', async () => {
      vi.mocked(DefaultService.streamAgentOutput).mockResolvedValue([] as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await streamAgentOutput(agentRef, 'production', {});

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should format output as JSON when specified', async () => {
      const mockEvents = [{ data: 'test' }];

      vi.mocked(DefaultService.streamAgentOutput).mockResolvedValue(mockEvents as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const options: AgentStreamOptions = {
        city: 'production',
        format: 'json',
      };

      const stream = await streamAgentOutput(agentRef, 'production', options);
      const chunkCallback = vi.fn();
      stream.onChunk(chunkCallback);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chunkCallback).toHaveBeenCalled();
    });

    it('should emit error on failure', async () => {
      vi.mocked(DefaultService.streamAgentOutput).mockRejectedValue(
        new Error('Network error')
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      const stream = await streamAgentOutput(agentRef, 'production');
      const errorCallback = vi.fn();
      stream.onError(errorCallback);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('deleteAgent', () => {
    it('should delete an unqualified agent successfully', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByBase).mockResolvedValue(undefined);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await deleteAgent(agentRef, 'production');

      expect(DefaultService.deleteV0CityByCityNameAgentByBase).toHaveBeenCalledWith(
        undefined,
        'production',
        'research-agent'
      );
    });

    it('should delete a qualified agent successfully', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByDirByBase).mockResolvedValue(
        undefined
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
        dir: '/agents/research',
      };

      await deleteAgent(agentRef, 'production');

      expect(DefaultService.deleteV0CityByCityNameAgentByDirByBase).toHaveBeenCalledWith(
        undefined,
        'production',
        '/agents/research',
        'research-agent'
      );
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByBase).mockResolvedValue(undefined);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await deleteAgent(agentRef);

      expect(DefaultService.deleteV0CityByCityNameAgentByBase).toHaveBeenCalledWith(
        undefined,
        'default',
        'research-agent'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByBase)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await deleteAgent(agentRef, 'production');

      expect(DefaultService.deleteV0CityByCityNameAgentByBase).toHaveBeenCalledTimes(3);
    });

    it('should throw AgentError on error response', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByBase).mockResolvedValue({
        detail: 'Agent not found',
      } as any);

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await expect(deleteAgent(agentRef, 'production')).rejects.toThrow(AgentError);
    });

    it.skip('should throw AgentError after max retries', async () => {
      vi.mocked(DefaultService.deleteV0CityByCityNameAgentByBase).mockRejectedValue(
        new Error('Network error')
      );

      const agentRef: AgentReference = {
        base: 'research-agent',
      };

      await expect(deleteAgent(agentRef, 'production')).rejects.toThrow(AgentError);
      await expect(deleteAgent(agentRef, 'production')).rejects.toThrow(
        'Agent deletion failed after 3 attempts'
      );
    });
  });
});
