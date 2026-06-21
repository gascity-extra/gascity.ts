import { describe, it, expect, beforeEach } from 'vitest';
import { createGasCityClient } from '../../src/lib/client';

describe('createGasCityClient', () => {
  it('should create client with default config', () => {
    const client = createGasCityClient();
    expect(client).toBeDefined();
  });

  it('should create client with custom baseUrl', () => {
    const client = createGasCityClient({ baseUrl: 'http://localhost:8080' });
    expect(client).toBeDefined();
  });

  it('should create client with token', () => {
    const client = createGasCityClient({ token: 'test-token' });
    expect(client).toBeDefined();
  });

  it('should create client with custom timeout', () => {
    const client = createGasCityClient({ timeout: 60000 });
    expect(client).toBeDefined();
  });

  it('should create client with custom headers', () => {
    const client = createGasCityClient({ headers: { 'X-Custom-Header': 'custom-value' } });
    expect(client).toBeDefined();
  });

  it('should create client with all config options', () => {
    const client = createGasCityClient({
      baseUrl: 'http://localhost:8080',
      token: 'test-token',
      timeout: 60000,
      headers: { 'X-Custom-Header': 'custom-value' },
    });
    expect(client).toBeDefined();
  });
});
