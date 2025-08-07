import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
}

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
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`, {
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
export function useRenderPerformance(componentName: string, dependencies?: any[]) {
  const renderCount = useRef(0);
  const lastRender = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      const timeSinceLastRender = now - lastRender.current;
      console.log(`[Render] ${componentName} - Count: ${renderCount.current}, Time since last: ${timeSinceLastRender.toFixed(2)}ms`);
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
      console.log(`[API] ${method} ${url} - ${duration.toFixed(2)}ms - ${success ? 'Success' : 'Failed'}`);
    }
    
    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.warn(`[API] Slow request: ${method} ${url} took ${duration.toFixed(2)}ms`);
    }
  }, []);
  
  return { trackApiCall };
}