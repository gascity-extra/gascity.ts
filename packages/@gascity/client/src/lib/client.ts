import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { OpenAPI } from '../generated/core/OpenAPI';

/**
 * Gas City API client configuration
 */
export interface GasCityClientConfig {
  baseUrl?: string;
  token?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Create a Gas City API client
 */
export function createGasCityClient(config: GasCityClientConfig = {}): AxiosInstance {
  const baseUrl = config.baseUrl || process.env.GC_API_BASE_URL || 'http://127.0.0.1:8372';
  const token = config.token || process.env.GC_API_TOKEN;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...config.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const axiosConfig: AxiosRequestConfig = {
    baseURL: baseUrl,
    headers,
    timeout: config.timeout || 30000,
  };

  return axios.create(axiosConfig);
}

/**
 * Configure the OpenAPI-generated client with base URL and authentication.
 * This is required for the generated DefaultService methods to work correctly.
 *
 * @param config - Client configuration
 */
export function configureGasCityClient(config: GasCityClientConfig = {}): void {
  const baseUrl = config.baseUrl || process.env.GC_API_BASE_URL || 'http://127.0.0.1:8372';
  const token = config.token || process.env.GC_API_TOKEN;

  // Set OpenAPI.BASE for generated services
  OpenAPI.BASE = baseUrl;

  // Set authentication token for generated services
  if (token) {
    OpenAPI.TOKEN = token;
  } else {
    OpenAPI.TOKEN = undefined;
  }

  // Set additional headers if provided
  if (config.headers) {
    OpenAPI.HEADERS = config.headers;
  }
}

/**
 * Default Gas City API client instance
 */
export const gasCityClient = createGasCityClient();
