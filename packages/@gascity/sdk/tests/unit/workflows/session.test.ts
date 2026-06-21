import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  interactSession,
  streamSession,
  resetSession,
  getSessionTranscript,
  closeSession,
  SessionError,
  SessionStream,
  type SessionConfig,
  type SessionInteractOptions,
  type SessionStreamOptions,
} from '../../../src/workflows/session';

// Mock the @gascity/client module
vi.mock('@gascity/client', () => ({
  DefaultService: {
    createSession: vi.fn(),
    sendSessionMessage: vi.fn(),
    streamSession: vi.fn(),
    postV0CityByCityNameSessionByIdClose: vi.fn(),
    getV0CityByCityNameSessionByIdTranscript: vi.fn(),
  },
}));

import { DefaultService } from '@gascity/client';

describe('Session Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SessionStream', () => {
    it('should create a new SessionStream', () => {
      const stream = new SessionStream();
      expect(stream).toBeDefined();
      expect(stream.isStopped()).toBe(false);
    });

    it('should stop the stream', () => {
      const stream = new SessionStream();
      stream.stop();
      expect(stream.isStopped()).toBe(true);
    });

    it('should emit chunks', () => {
      const stream = new SessionStream();
      const callback = vi.fn();
      stream.onChunk(callback);

      const result = stream.emitChunk('test chunk');
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith('test chunk');
    });

    it('should not emit chunks when stopped', () => {
      const stream = new SessionStream();
      stream.stop();
      const callback = vi.fn();
      stream.onChunk(callback);

      const result = stream.emitChunk('test chunk');
      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should emit complete event', () => {
      const stream = new SessionStream();
      const callback = vi.fn();
      stream.onComplete(callback);

      const data = { result: 'done' };
      const result = stream.emitComplete(data);
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith(data);
    });

    it('should emit error event', () => {
      const stream = new SessionStream();
      const callback = vi.fn();
      stream.onError(callback);

      const error = new Error('Test error');
      const result = stream.emitError(error);
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith(error);
    });

    it('should support method chaining for event listeners', () => {
      const stream = new SessionStream();
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

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const config: SessionConfig = {
        agent: 'research-agent',
        city: 'production',
        scope: 'data-analysis',
      };

      const mockSession = {
        id: 'session-123',
        agent: 'research-agent',
      };

      vi.mocked(DefaultService.createSession).mockResolvedValue(mockSession as any);

      const result = await createSession(config);

      expect(DefaultService.createSession).toHaveBeenCalledWith(
        undefined,
        'production',
        expect.objectContaining({
          name: 'research-agent',
          kind: 'agent',
        })
      );
      expect(result).toEqual(mockSession);
    });

    it('should use default city when not provided', async () => {
      const config: SessionConfig = {
        agent: 'research-agent',
      };

      vi.mocked(DefaultService.createSession).mockResolvedValue({ id: 'session-123' } as any);

      await createSession(config);

      expect(DefaultService.createSession).toHaveBeenCalledWith(
        undefined,
        'default',
        expect.any(Object)
      );
    });

    it('should retry on failure', async () => {
      const config: SessionConfig = {
        agent: 'research-agent',
      };

      vi.mocked(DefaultService.createSession)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ id: 'session-123' } as any);

      await createSession(config);

      expect(DefaultService.createSession).toHaveBeenCalledTimes(3);
    });

    it('should throw SessionError on error response', async () => {
      const config: SessionConfig = {
        agent: 'research-agent',
      };

      vi.mocked(DefaultService.createSession).mockResolvedValue({
        detail: 'Invalid agent',
      } as any);

      await expect(createSession(config)).rejects.toThrow(SessionError);
    });

    it('should throw SessionError after max retries', async () => {
      const config: SessionConfig = {
        agent: 'research-agent',
      };

      vi.mocked(DefaultService.createSession).mockRejectedValue(new Error('Network error'));

      await expect(createSession(config)).rejects.toThrow(SessionError);
      await expect(createSession(config)).rejects.toThrow(
        'Session creation failed after 3 attempts'
      );
    });
  });

  describe('interactSession', () => {
    it('should interact with a session successfully (non-streaming)', async () => {
      const mockResponse = {
        message: 'Response from agent',
      };

      vi.mocked(DefaultService.sendSessionMessage).mockResolvedValue(mockResponse as any);

      const options: SessionInteractOptions = {
        city: 'production',
        stream: false,
      };

      const result = await interactSession('session-123', 'Hello agent', options);

      expect(DefaultService.sendSessionMessage).toHaveBeenCalledWith(
        undefined,
        'production',
        'session-123',
        { message: 'Hello agent' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return a SessionStream when streaming is enabled', async () => {
      vi.mocked(DefaultService.sendSessionMessage).mockResolvedValue({
        message: 'Response',
      } as any);

      const options: SessionInteractOptions = {
        city: 'production',
        stream: true,
      };

      const result = await interactSession('session-123', 'Hello agent', options);

      expect(result).toBeInstanceOf(SessionStream);
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.sendSessionMessage).mockResolvedValue({
        message: 'Response',
      } as any);

      await interactSession('session-123', 'Hello agent', {});

      expect(DefaultService.sendSessionMessage).toHaveBeenCalledWith(
        undefined,
        'default',
        'session-123',
        expect.any(Object)
      );
    });

    it('should retry on failure (non-streaming)', async () => {
      vi.mocked(DefaultService.sendSessionMessage)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ message: 'Response' } as any);

      await interactSession('session-123', 'Hello agent', { city: 'production' });

      expect(DefaultService.sendSessionMessage).toHaveBeenCalledTimes(3);
    });

    it('should throw SessionError on error response', async () => {
      vi.mocked(DefaultService.sendSessionMessage).mockResolvedValue({
        detail: 'Session not found',
      } as any);

      await expect(
        interactSession('session-123', 'Hello agent', { city: 'production' })
      ).rejects.toThrow(SessionError);
    });

    it('should emit error on stream when request fails', async () => {
      vi.mocked(DefaultService.sendSessionMessage).mockRejectedValue(
        new Error('Network error')
      );

      const options: SessionInteractOptions = {
        city: 'production',
        stream: true,
      };

      const stream = await interactSession('session-123', 'Hello agent', options);
      const errorCallback = vi.fn();
      stream.onError(errorCallback);

      // Wait a bit for the async error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('streamSession', () => {
    it('should stream session events successfully', async () => {
      const mockEvents = [
        { type: 'message', data: 'Hello' },
        { type: 'message', data: 'World' },
      ];

      vi.mocked(DefaultService.streamSession).mockResolvedValue(mockEvents as any);

      const options: SessionStreamOptions = {
        city: 'production',
        format: 'conversation',
      };

      const stream = await streamSession('session-123', options);

      expect(stream).toBeInstanceOf(SessionStream);
      expect(DefaultService.streamSession).toHaveBeenCalledWith(
        'production',
        'session-123',
        'conversation'
      );
    });

    it('should use default format when not provided', async () => {
      vi.mocked(DefaultService.streamSession).mockResolvedValue([] as any);

      await streamSession('session-123', { city: 'production' });

      expect(DefaultService.streamSession).toHaveBeenCalledWith(
        'production',
        'session-123',
        'conversation'
      );
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.streamSession).mockResolvedValue([] as any);

      await streamSession('session-123', {});

      expect(DefaultService.streamSession).toHaveBeenCalledWith(
        'default',
        'session-123',
        'conversation'
      );
    });

    it('should emit chunks for each event', async () => {
      const mockEvents = [
        { type: 'message', data: 'Hello' },
        { type: 'message', data: 'World' },
      ];

      vi.mocked(DefaultService.streamSession).mockResolvedValue(mockEvents as any);

      const stream = await streamSession('session-123', {});
      const chunkCallback = vi.fn();
      stream.onChunk(chunkCallback);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chunkCallback).toHaveBeenCalledTimes(2);
    });

    it('should emit error on failure', async () => {
      vi.mocked(DefaultService.streamSession).mockRejectedValue(
        new Error('Network error')
      );

      const stream = await streamSession('session-123', {});
      const errorCallback = vi.fn();
      stream.onError(errorCallback);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('resetSession', () => {
    it('should reset a session successfully', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue(
        undefined
      );

      await resetSession('session-123', 'production');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledWith(
        undefined,
        'production',
        'session-123'
      );
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue(
        undefined
      );

      await resetSession('session-123');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledWith(
        undefined,
        'default',
        'session-123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await resetSession('session-123', 'production');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledTimes(3);
    });

    it('should throw SessionError on error response', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue({
        detail: 'Session not found',
      } as any);

      await expect(resetSession('session-123', 'production')).rejects.toThrow(SessionError);
    });

    it('should throw SessionError after max retries', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockRejectedValue(
        new Error('Network error')
      );

      await expect(resetSession('session-123', 'production')).rejects.toThrow(SessionError);
      await expect(resetSession('session-123', 'production')).rejects.toThrow(
        'Session reset failed after 3 attempts'
      );
    });
  });

  describe('getSessionTranscript', () => {
    it('should get session transcript successfully', async () => {
      const mockTranscript = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };

      vi.mocked(DefaultService.getV0CityByCityNameSessionByIdTranscript).mockResolvedValue(
        mockTranscript as any
      );

      const result = await getSessionTranscript('session-123', 'production');

      expect(DefaultService.getV0CityByCityNameSessionByIdTranscript).toHaveBeenCalledWith(
        'production',
        'session-123'
      );
      expect(result).toEqual(mockTranscript);
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameSessionByIdTranscript).mockResolvedValue(
        {} as any
      );

      await getSessionTranscript('session-123');

      expect(DefaultService.getV0CityByCityNameSessionByIdTranscript).toHaveBeenCalledWith(
        'default',
        'session-123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameSessionByIdTranscript)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({} as any);

      await getSessionTranscript('session-123', 'production');

      expect(DefaultService.getV0CityByCityNameSessionByIdTranscript).toHaveBeenCalledTimes(3);
    });

    it('should throw SessionError on error response', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameSessionByIdTranscript).mockResolvedValue({
        detail: 'Session not found',
      } as any);

      await expect(getSessionTranscript('session-123', 'production')).rejects.toThrow(
        SessionError
      );
    });

    it('should throw SessionError after max retries', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameSessionByIdTranscript).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getSessionTranscript('session-123', 'production')).rejects.toThrow(
        SessionError
      );
      await expect(getSessionTranscript('session-123', 'production')).rejects.toThrow(
        'Get session transcript failed after 3 attempts'
      );
    });
  });

  describe('closeSession', () => {
    it('should close a session successfully', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue(
        undefined
      );

      await closeSession('session-123', 'production');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledWith(
        undefined,
        'production',
        'session-123'
      );
    });

    it('should use default city when not provided', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue(
        undefined
      );

      await closeSession('session-123');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledWith(
        undefined,
        'default',
        'session-123'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await closeSession('session-123', 'production');

      expect(DefaultService.postV0CityByCityNameSessionByIdClose).toHaveBeenCalledTimes(3);
    });

    it('should throw SessionError on error response', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockResolvedValue({
        detail: 'Session not found',
      } as any);

      await expect(closeSession('session-123', 'production')).rejects.toThrow(SessionError);
    });

    it('should throw SessionError after max retries', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameSessionByIdClose).mockRejectedValue(
        new Error('Network error')
      );

      await expect(closeSession('session-123', 'production')).rejects.toThrow(SessionError);
      await expect(closeSession('session-123', 'production')).rejects.toThrow(
        'Session closure failed after 3 attempts'
      );
    });
  });
});
