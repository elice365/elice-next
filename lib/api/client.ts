/**
 * Unified API Client
 * Provides consistent interface for all API calls in the application
 */

import { createAPI } from '@/lib/fetch/api';
import { TokenManager } from '@/lib/services/token/types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Simple fetch wrapper for cases where full axios client isn't needed
 */
export const simpleFetch = async <T = unknown>(
  url: string, 
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as ApiResponse<T>;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
};

/**
 * Enhanced fetch with automatic retry logic
 */
export const retryFetch = async <T = unknown>(
  url: string,
  options: FetchOptions & { maxRetries?: number; retryDelay?: number } = {}
): Promise<ApiResponse<T>> => {
  const { maxRetries = 3, retryDelay = 1000, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await simpleFetch<T>(url, fetchOptions);
      
      if (result.success || attempt === maxRetries) {
        return result;
      }
      
      // If not successful and we have retries left, continue
      lastError = new Error(result.error || 'Request failed');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // If this is our last attempt, don't retry
      if (attempt === maxRetries) {
        break;
      }
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Request failed after retries',
  };
};

/**
 * Creates an API client instance for authenticated requests
 */
export const createApiClient = (tokenManager?: TokenManager) => {
  return createAPI({
    baseURL: '/api',
    timeout: 10000,
    tokenManager,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Default API client instance
 */
export const api = createApiClient();

/**
 * Utility functions for common API patterns
 */
export const apiUtils = {
  /**
   * GET request with simple interface
   */
  get: <T = unknown>(url: string, options?: FetchOptions) => 
    simpleFetch<T>(url, { ...options, method: 'GET' }),
  
  /**
   * POST request with simple interface
   */
  post: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) => 
    simpleFetch<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  /**
   * PUT request with simple interface
   */
  put: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) => 
    simpleFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  /**
   * DELETE request with simple interface
   */
  delete: <T = unknown>(url: string, options?: FetchOptions) => 
    simpleFetch<T>(url, { ...options, method: 'DELETE' }),
  
  /**
   * External API fetch (for third-party APIs)
   */
  external: <T = unknown>(url: string, options?: FetchOptions) => 
    retryFetch<T>(url, options),
};

export default apiUtils;