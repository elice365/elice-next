// 통합 FLO API 훅 - 캐싱, 에러 처리, 로딩 상태 관리
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface UseFetchOptions<T> {
  enabled?: boolean;
  cacheTime?: number; // 캐시 유지 시간 (ms)
  staleTime?: number; // 데이터가 stale 되는 시간 (ms)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 전역 캐시 스토어
const globalCache = new Map<string, CacheEntry<any>>();

// 진행 중인 요청 추적 (중복 요청 방지)
const pendingRequests = new Map<string, Promise<any>>();

export function useFloFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseFetchOptions<T> = {}
) {
  const {
    enabled = true,
    cacheTime = 5 * 60 * 1000, // 5분
    staleTime = 30 * 1000, // 30초
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // 캐시에서 데이터 가져오기
  const getCachedData = useCallback(() => {
    const cached = globalCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;

    // 캐시 만료 확인
    if (age > cacheTime) {
      globalCache.delete(key);
      return null;
    }

    // stale 상태 확인
    setIsStale(age > staleTime);
    return cached.data;
  }, [key, cacheTime, staleTime]);

  // 데이터 페칭 함수
  const fetchData = useCallback(async (isRetry = false) => {
    // 이미 진행 중인 요청이 있는지 확인
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest && !isRetry) {
      try {
        const result = await pendingRequest;
        if (isMountedRef.current) {
          setData(result);
          setError(null);
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as Error);
          onError?.(err as Error);
        }
        throw err;
      }
    }

    // 새로운 요청 시작
    const request = (async () => {
      try {
        if (!isRetry) {
          setLoading(true);
          setError(null);
        }

        // AbortController 설정
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const result = await fetcher();

        // 캐시에 저장
        globalCache.set(key, {
          data: result,
          timestamp: Date.now()
        });

        if (isMountedRef.current) {
          setData(result);
          setError(null);
          setIsStale(false);
          onSuccess?.(result);
        }

        retryCountRef.current = 0;
        return result;
      } catch (err) {
        const error = err as Error;
        
        // 재시도 로직
        if (retryCountRef.current < retry && !error.message.includes('aborted')) {
          retryCountRef.current++;
          logger.flo.warn(`Retrying fetch (${retryCountRef.current}/${retry})`, { key, error });
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
          return fetchData(true);
        }

        if (isMountedRef.current) {
          setError(error);
          onError?.(error);
          logger.flo.error('Fetch failed after retries', { key, error, retries: retryCountRef.current });
        }
        
        throw error;
      } finally {
        if (isMountedRef.current && !isRetry) {
          setLoading(false);
        }
        pendingRequests.delete(key);
      }
    })();

    pendingRequests.set(key, request);
    return request;
  }, [key, fetcher, onSuccess, onError, retry, retryDelay]);

  // 수동 refetch 함수
  const refetch = useCallback(async () => {
    globalCache.delete(key); // 캐시 무효화
    return fetchData();
  }, [key, fetchData]);

  // 캐시 무효화 함수
  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setIsStale(true);
  }, [key]);

  // 초기 데이터 로드 및 stale 데이터 재검증
  useEffect(() => {
    if (!enabled) return;

    // 캐시된 데이터 확인
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      
      // stale 데이터인 경우 백그라운드에서 재검증
      if (isStale) {
        fetchData().catch(err => {
          logger.flo.error('Background revalidation failed', { key, error: err });
        });
      }
    } else {
      // 캐시가 없으면 새로 페칭
      fetchData().catch(err => {
        logger.flo.error('Initial fetch failed', { key, error: err });
      });
    }
  }, [enabled, key]); // getCachedData와 fetchData는 의도적으로 제외

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidate,
    isValidating: loading && !!data // 데이터가 있으면서 로딩 중 = 재검증 중
  };
}

// 캐시 관리 유틸리티
export const floCache = {
  // 특정 키의 캐시 삭제
  delete: (key: string) => {
    globalCache.delete(key);
  },
  
  // 패턴과 일치하는 모든 캐시 삭제
  deleteMatching: (pattern: RegExp | string) => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    Array.from(globalCache.keys())
      .filter(key => regex.test(key))
      .forEach(key => globalCache.delete(key));
  },
  
  // 모든 캐시 삭제
  clear: () => {
    globalCache.clear();
  },
  
  // 캐시 크기 확인
  size: () => globalCache.size,
  
  // 캐시 키 목록
  keys: () => Array.from(globalCache.keys())
};