import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initCity,
  startCity,
  stopCity,
  registerCity,
  unregisterCity,
  waitForCityReady,
  getCityStatus,
  CityError,
  type CityConfig,
  type CityInitOptions,
} from '../../../src/workflows/city';

// Mock the @gascity/client module
vi.mock('@gascity/client', () => ({
  DefaultService: {
    postV0City: vi.fn(),
    getV0CityByCityNameReadiness: vi.fn(),
    getV0CityByCityNameStatus: vi.fn(),
    postV0CityByCityNameUnregister: vi.fn(),
  },
}));

import { DefaultService } from '@gascity/client';

describe('City Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initCity', () => {
    it('should initialize a city successfully', async () => {
      const config: CityConfig = {
        dir: '/my-city',
        provider: 'local',
      };

      vi.mocked(DefaultService.postV0City).mockResolvedValue({} as any);

      const result = await initCity(config);

      expect(DefaultService.postV0City).toHaveBeenCalledWith(
        'sdk-request',
        expect.objectContaining({
          dir: '/my-city',
          provider: 'local',
        })
      );
      expect(result).toBeDefined();
      expect(result.name).toBe('my-city');
    });

    it('should wait for city ready when option is set', async () => {
      const config: CityConfig = {
        dir: '/my-city',
      };

      const options: CityInitOptions = {
        waitForReady: true,
        timeout: 60000,
      };

      vi.mocked(DefaultService.postV0City).mockResolvedValue({} as any);
      vi.mocked(DefaultService.getV0CityByCityNameReadiness).mockResolvedValue({
        items: [],
      } as any);

      await initCity(config, options);

      expect(DefaultService.getV0CityByCityNameReadiness).toHaveBeenCalledWith('my-city');
    });

    it('should retry on failure', async () => {
      const config: CityConfig = {
        dir: '/my-city',
      };

      vi.mocked(DefaultService.postV0City)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({} as any);

      await initCity(config);

      expect(DefaultService.postV0City).toHaveBeenCalledTimes(3);
    });

    it('should throw CityError after max retries', async () => {
      const config: CityConfig = {
        dir: '/my-city',
      };

      vi.mocked(DefaultService.postV0City).mockRejectedValue(new Error('Network error'));

      await expect(initCity(config)).rejects.toThrow(CityError);
      await expect(initCity(config)).rejects.toThrow('City initialization failed after 3 attempts');
    });
  });

  describe('startCity', () => {
    it('should throw error as it is not yet implemented', async () => {
      await expect(startCity('my-city')).rejects.toThrow(CityError);
      await expect(startCity('my-city')).rejects.toThrow('startCity is not yet implemented');
    });
  });

  describe('stopCity', () => {
    it('should throw error as it is not yet implemented', async () => {
      await expect(stopCity('my-city')).rejects.toThrow(CityError);
      await expect(stopCity('my-city')).rejects.toThrow('stopCity is not yet implemented');
    });
  });

  describe('registerCity', () => {
    it('should throw error as it is not yet implemented', async () => {
      await expect(registerCity('my-city')).rejects.toThrow(CityError);
      await expect(registerCity('my-city')).rejects.toThrow('registerCity is not yet implemented');
    });
  });

  describe('unregisterCity', () => {
    it('should unregister a city successfully', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameUnregister).mockResolvedValue(undefined);

      await unregisterCity('my-city');

      expect(DefaultService.postV0CityByCityNameUnregister).toHaveBeenCalledWith(
        'sdk-request',
        'my-city'
      );
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameUnregister)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      await unregisterCity('my-city');

      expect(DefaultService.postV0CityByCityNameUnregister).toHaveBeenCalledTimes(3);
    });

    it('should throw CityError after max retries', async () => {
      vi.mocked(DefaultService.postV0CityByCityNameUnregister).mockRejectedValue(
        new Error('Network error')
      );

      await expect(unregisterCity('my-city')).rejects.toThrow(CityError);
      await expect(unregisterCity('my-city')).rejects.toThrow(
        'City unregistration failed after 3 attempts'
      );
    });
  });

  describe('waitForCityReady', () => {
    it('should return when city becomes ready', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameReadiness).mockResolvedValue({
        items: [],
      } as any);

      await waitForCityReady('my-city', 5000);

      expect(DefaultService.getV0CityByCityNameReadiness).toHaveBeenCalledWith('my-city');
    });

    it('should poll until city is ready', async () => {
      let callCount = 0;
      vi.mocked(DefaultService.getV0CityByCityNameReadiness).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Not ready'));
        }
        return Promise.resolve({ items: [] } as any);
      });

      await waitForCityReady('my-city', 10000);

      expect(callCount).toBe(3);
    });

    it('should throw error when timeout is exceeded', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameReadiness).mockRejectedValue(
        new Error('Not ready')
      );

      await expect(waitForCityReady('my-city', 1000)).rejects.toThrow(CityError);
      await expect(waitForCityReady('my-city', 1000)).rejects.toThrow(
        'City my-city did not become ready within 1000ms'
      );
    });
  });

  describe('getCityStatus', () => {
    it('should get city status successfully', async () => {
      const mockStatus = {
        items: [{ name: 'my-city', status: 'running' }],
      };

      vi.mocked(DefaultService.getV0CityByCityNameStatus).mockResolvedValue(mockStatus as any);

      const result = await getCityStatus('my-city');

      expect(DefaultService.getV0CityByCityNameStatus).toHaveBeenCalledWith('my-city');
      expect(result).toBeDefined();
      expect(result.name).toBe('my-city');
    });

    it('should retry on failure', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameStatus)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ items: [] } as any);

      await getCityStatus('my-city');

      expect(DefaultService.getV0CityByCityNameStatus).toHaveBeenCalledTimes(3);
    });

    it('should throw CityError after max retries', async () => {
      vi.mocked(DefaultService.getV0CityByCityNameStatus).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getCityStatus('my-city')).rejects.toThrow(CityError);
      await expect(getCityStatus('my-city')).rejects.toThrow(
        'Get city status failed after 3 attempts'
      );
    });
  });
});
