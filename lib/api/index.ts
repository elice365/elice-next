/**
 * Unified API Export
 * Central export point for all API-related utilities
 */

export { 
  simpleFetch, 
  retryFetch, 
  createApiClient, 
  api, 
  apiUtils as default 
} from './client';

export type { ApiResponse, FetchOptions } from './client';

// Re-export axios-based API for backward compatibility
export { createAPI } from '@/lib/fetch/api';
export type { ApiClientConfig } from '@/lib/fetch/api';