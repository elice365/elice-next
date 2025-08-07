/**
 * Type definitions for optimization utilities and hooks
 */

// Performance monitoring types
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
}

export interface ApiPerformanceData {
  url: string;
  method: string;
  duration: number;
  success: boolean;
  timestamp: number;
}

// Modal state management types
export interface ModalStateConfig {
  modalNames: string[];
  fetchData?: (item?: any) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export interface EnhancedModalState<T = any> {
  modalStates: Record<string, boolean>;
  selectedItem: T | null;
  loading: boolean;
  error: string | null;
  openModalWithData: (modalName: string, item?: T) => Promise<void>;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
}

// API call hook types
export interface ApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showAlert?: boolean;
  successMessage?: string;
}

export interface ApiCallState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ApiCallHookReturn<T> extends ApiCallState {
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

// Memoization types
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  isExpired?: boolean;
}

export interface AsyncCacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
  isResolved: boolean;
  value?: T;
  error?: any;
}

export type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  cache?: Map<string, any>;
  clear?: () => void;
};

// Error handling types
export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  timestamp?: number;
  additionalInfo?: Record<string, any>;
}

export interface StandardizedError {
  message: string;
  code?: string | number;
  originalError?: any;
  context?: ErrorContext;
  isRetryable?: boolean;
}

// Response types optimization
export interface OptimizedResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  status: number;
  timestamp?: number;
  requestId?: string;
}

export interface PaginatedResponse<T = any> extends OptimizedResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

// Utility types for performance
export type PerformanceTimer = {
  start: () => void;
  end: () => PerformanceMetrics | undefined;
  measure: <T>(operation: () => Promise<T>) => Promise<T>;
};

export type ComponentRenderMetrics = {
  renderCount: number;
  lastRenderTime: number;
};

// Common optimization patterns
export interface OptimizationConfig {
  enableMemoization?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorBoundaries?: boolean;
  cacheStrategy?: 'memory' | 'localStorage' | 'sessionStorage';
  maxCacheSize?: number;
  cacheTTL?: number;
}

// Batch operations
export interface BatchOperation<T, R> {
  items: T[];
  operation: (item: T) => Promise<R>;
  onProgress?: (completed: number, total: number) => void;
  onSuccess?: (results: R[]) => void;
  onError?: (errors: Error[], results: (R | null)[]) => void;
  batchSize?: number;
  concurrent?: boolean;
}