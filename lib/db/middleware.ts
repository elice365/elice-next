import { prisma } from './prisma';

/**
 * Prisma 미들웨어: 쿼리 최적화 및 연결 관리
 */

// 쿼리 캐싱 (개발 환경)
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5초

// 쿼리 미들웨어 설정
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  
  // 개발 환경에서만 로깅
  if (process.env.NODE_ENV === 'development') {
    // 특정 쿼리 캐싱 (findUnique, findFirst)
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      const cacheKey = `${params.model}-${params.action}-${JSON.stringify(params.args)}`;
      const cached = queryCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache Hit] ${params.model}.${params.action}`);
        return cached.data;
      }
    }
  }
  
  try {
    const result = await next(params);
    
    // 개발 환경 캐싱
    if (process.env.NODE_ENV === 'development') {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        const cacheKey = `${params.model}-${params.action}-${JSON.stringify(params.args)}`;
        queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        // 캐시 크기 제한
        if (queryCache.size > 100) {
          const firstKey = queryCache.keys().next().value;
          if (firstKey) {
            queryCache.delete(firstKey);
          }
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    // 느린 쿼리 경고 (1초 이상)
    if (duration > 1000) {
      console.warn(`[Slow Query] ${params.model}.${params.action} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Query Error] ${params.model}.${params.action} failed after ${duration}ms`, error);
    throw error;
  }
});

// 캐시 정리 함수
export const clearQueryCache = () => {
  queryCache.clear();
};

// 주기적 캐시 정리 (개발 환경)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        queryCache.delete(key);
      }
    }
  }, 30000); // 30초마다
}