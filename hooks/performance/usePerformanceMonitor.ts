import { useEffect, useRef, useCallback } from 'react';
import type { PerformanceMetrics } from '@/types/hooks/performance';
import { logger } from '@/lib/services/logger';

export function usePerformanceMonitor(label: string, enabled: boolean = true) {
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  
  const start = useCallback(() => {
    if (!enabled) return;
    
    metricsRef.current = {
      startTime: performance.now(),
      memoryUsed: (performance as any).memory?.usedJSHeapSize
    };
  }, [enabled]);
  
  const end = useCallback(() => {
    if (!enabled || !metricsRef.current) return;
    
    const endTime = performance.now();
    const duration = endTime - metricsRef.current.startTime;
    
    metricsRef.current = {
      ...metricsRef.current,
      endTime,
      duration
    };
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${label}: ${duration.toFixed(2)}ms`, 'PERFORMANCE', {
        startTime: metricsRef.current.startTime,
        endTime,
        duration,
        memoryUsed: metricsRef.current.memoryUsed
      });
    }
    
    return metricsRef.current;
  }, [enabled, label]);
  
  const measure = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    start();
    try {
      const result = await operation();
      return result;
    } finally {
      end();
    }
  }, [start, end]);
  
  return {
    start,
    end,
    measure,
    metrics: metricsRef.current
  };
}

// Hook for component render performance
export function useRenderPerformance(componentName: string, dependencies?: React.DependencyList) {
  const renderCount = useRef(0);
  const lastRender = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      const timeSinceLastRender = now - lastRender.current;
      logger.debug(`${componentName} - Count: ${renderCount.current}, Time since last: ${timeSinceLastRender.toFixed(2)}ms`, 'RENDER');
    }
    
    lastRender.current = now;
  }, dependencies);
  
  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRender.current
  };
}

// Hook for API call performance tracking
export function useApiPerformance() {
  const trackApiCall = useCallback((url: string, method: string, duration: number, success: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`${method} ${url} - ${duration.toFixed(2)}ms - ${success ? 'Success' : 'Failed'}`, 'API');
    }
    
    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      logger.warn(`Slow request: ${method} ${url} took ${duration.toFixed(2)}ms`, 'API');
    }
  }, []);
  
  return { trackApiCall };
}