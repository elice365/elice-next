/**
 * Advanced memoization utilities for performance optimization
 */

// Simple memoization with LRU cache
class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Memoization with TTL (Time To Live)
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number = 60000, // 1 minute default
  maxSize: number = 50
): T {
  const cache = new LRUCache<string, { value: ReturnType<T>; timestamp: number }>(maxSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && (now - cached.timestamp) < ttlMs) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  }) as T;
}

// Debounced memoization for expensive operations
export function debouncedMemoize<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 300,
  maxSize: number = 20
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Return a promise for async operations
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        const result = fn(...args);
        cache.set(key, result);
        resolve(result);
      }, delayMs);
    }) as ReturnType<T>;
  }) as T;
}

// Memoization for React components with shallow comparison
export function shallowMemoize<T extends (...args: any[]) => any>(fn: T): T {
  let lastArgs: Parameters<T> | undefined;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (lastArgs === undefined || !shallowEqual(args, lastArgs)) {
      lastResult = fn(...args);
      lastArgs = args;
    }
    return lastResult;
  }) as T;
}

function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Memoization for async operations with error handling
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlMs: number = 300000, // 5 minutes default for API calls
  maxSize: number = 30
): T {
  const cache = new LRUCache<string, { 
    promise: Promise<ReturnType<T>>; 
    timestamp: number;
    isResolved: boolean;
    value?: Awaited<ReturnType<T>>;
    error?: any;
  }>(maxSize);

  return (async (...args: Parameters<T>): Promise<any> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached) {
      if ((now - cached.timestamp) < ttlMs) {
        if (cached.isResolved) {
          if (cached.error) {
            throw cached.error;
          }
          return cached.value!;
        }
        return cached.promise;
      }
      cache.clear(); // Clear expired cache
    }

    const promise = fn(...args).then(
      (value) => {
        const cachedEntry = cache.get(key);
        if (cachedEntry) {
          cachedEntry.isResolved = true;
          cachedEntry.value = value;
        }
        return value;
      },
      (error) => {
        const cachedEntry = cache.get(key);
        if (cachedEntry) {
          cachedEntry.isResolved = true;
          cachedEntry.error = error;
        }
        throw error;
      }
    );

    cache.set(key, {
      promise,
      timestamp: now,
      isResolved: false
    });

    return promise;
  }) as T;
}

// Utility to clear all caches (useful for development)
const memoizedFunctions = new WeakSet();

export function clearAllMemoizedCaches() {
  // This is a development utility
  if (process.env.NODE_ENV === 'development') {
    console.log('[Memoization] Clearing all memoized caches');
    // Individual memoized functions would need to implement their own clear methods
  }
}