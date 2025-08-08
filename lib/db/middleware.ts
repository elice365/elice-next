import { prisma } from './prisma';

/**
 * Prisma 미들웨어: 쿼리 최적화 및 연결 관리
 */

// 쿼리 캐싱 (개발 환경)
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5초
const MAX_CACHE_SIZE = 100;
const isDevelopment = process.env.NODE_ENV === 'development';

// 캐시 키 생성
const getCacheKey = (params: any): string => {
  return `${params.model}-${params.action}-${JSON.stringify(params.args)}`;
};

// 캐시에서 데이터 가져오기
const getCachedData = (params: any) => {
  if (!isDevelopment) return null;
  if (params.action !== 'findUnique' && params.action !== 'findFirst') return null;
  
  const cacheKey = getCacheKey(params);
  const cached = queryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache Hit] ${params.model}.${params.action}`);
    return cached.data;
  }
  
  return null;
};

// 캐시에 데이터 저장
const setCachedData = (params: any, result: any) => {
  if (!isDevelopment) return;
  if (params.action !== 'findUnique' && params.action !== 'findFirst') return;
  
  const cacheKey = getCacheKey(params);
  queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  // 캐시 크기 제한
  if (queryCache.size > MAX_CACHE_SIZE) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) {
      queryCache.delete(firstKey);
    }
  }
};

// 쿼리 성능 로깅
const logQueryPerformance = (params: any, duration: number, isError = false) => {
  if (isError) {
    console.error(`[Query Error] ${params.model}.${params.action} failed after ${duration}ms`);
  } else if (duration > 1000) {
    console.warn(`[Slow Query] ${params.model}.${params.action} took ${duration}ms`);
  }
};

// 쿼리 미들웨어 설정
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  
  // 캐시 확인
  const cachedData = getCachedData(params);
  if (cachedData !== null) {
    return cachedData;
  }
  
  try {
    const result = await next(params);
    
    // 캐시 저장
    setCachedData(params, result);
    
    // 성능 로깅
    const duration = Date.now() - startTime;
    logQueryPerformance(params, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logQueryPerformance(params, duration, true);
    throw error;
  }
});

// 캐시 정리 함수
export const clearQueryCache = () => {
  queryCache.clear();
};

// 주기적 캐시 정리 (개발 환경)
if (isDevelopment) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        queryCache.delete(key);
      }
    }
  }, 30000); // 30초마다
}