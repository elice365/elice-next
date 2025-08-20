// FLO 최적화 유틸리티 - 메모리 관리, 성능 최적화
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

/**
 * 디바운스 훅 - 입력 최적화
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // 콜백 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 디바운스된 함수
  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // 취소 함수
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
}

/**
 * 쓰로틀 훅 - 이벤트 빈도 제한
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Intersection Observer 훅 - 레이지 로딩
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => callbackRef.current(entries),
        options
      );
    }
    observerRef.current.observe(element);
  }, [options]);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { observe, unobserve, disconnect };
}

/**
 * 메모리 누수 방지 훅
 */
export function useMountedState() {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isMounted = useCallback(() => mountedRef.current, []);

  return isMounted;
}

/**
 * 이미지 프리로드 유틸리티
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}

/**
 * 배치 업데이트 유틸리티
 */
export function batchUpdate<T>(
  updates: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const total = updates.length;
      let processed = 0;

      for (let i = 0; i < total; i += batchSize) {
        const batch = updates.slice(i, Math.min(i + batchSize, total));
        await processor(batch);
        
        processed += batch.length;
        onProgress?.(processed, total);
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 메모리 사용량 모니터링
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

/**
 * 성능 측정 유틸리티
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined || (endMark && end === undefined)) {
      logger.flo.warn('Performance mark not found', { name, startMark, endMark });
      return null;
    }

    const duration = (end || performance.now()) - start;
    
    logger.flo.debug('Performance measurement', {
      name,
      duration: `${duration.toFixed(2)}ms`,
      start: startMark,
      end: endMark || 'now'
    });

    return duration;
  }

  clear() {
    this.marks.clear();
  }
}

/**
 * 리스트 최적화 - 중복 제거
 */
export function deduplicateBy<T, K>(
  items: T[],
  keySelector: (item: T) => K
): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keySelector(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 청크 분할 유틸리티
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 레이지 초기화 패턴
 */
export class LazyInitializer<T> {
  private value?: T;
  private initializer: () => T;

  constructor(initializer: () => T) {
    this.initializer = initializer;
  }

  get(): T {
    if (this.value === undefined) {
      this.value = this.initializer();
    }
    return this.value;
  }

  reset() {
    this.value = undefined;
  }
}