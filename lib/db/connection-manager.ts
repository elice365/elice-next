/**
 * Prisma 연결 관리자
 * Supabase 연결 수 제한 문제 해결을 위한 유틸리티
 */

import { prisma } from './prisma';

// 연결 상태 추적
let activeConnections = 0;
const MAX_CONNECTIONS = process.env.NODE_ENV === 'production' ? 10 : 3;

/**
 * 연결 풀 상태 확인
 */
export const getConnectionStatus = async () => {
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = current_database()`;
    return {
      active: activeConnections,
      database: result,
      max: MAX_CONNECTIONS,
    };
  } catch (error) {
    console.error('Failed to get connection status:', error);
    return {
      active: activeConnections,
      max: MAX_CONNECTIONS,
      error: 'Failed to query database connections',
    };
  }
};

/**
 * 트랜잭션 래퍼 with 재시도 로직
 * Supabase 연결 풀 타임아웃 문제 해결
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 연결 풀 타임아웃 에러 체크
      if (error.message?.includes('Timed out fetching a new connection') || 
          error.message?.includes('connection pool')) {
        
        console.warn(`Connection pool timeout, retry ${i + 1}/${maxRetries}`);
        
        // 재시도 전 대기 (지수 백오프)
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 2번째 재시도 시 연결 재설정 시도
        if (i === 1) {
          try {
            console.log('Attempting to reset connection...');
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 500));
            await prisma.$connect();
          } catch (reconnectError) {
            console.error('Failed to reconnect:', reconnectError);
          }
        }
      } else {
        // 다른 에러는 즉시 throw
        throw error;
      }
    }
  }
  
  throw lastError;
};

/**
 * 배치 쿼리 실행
 * 여러 쿼리를 하나의 트랜잭션으로 묶어 연결 수 절약
 */
export const batchQuery = async <T>(
  queries: Array<any>
): Promise<T[]> => {
  return withRetry(async () => {
    return prisma.$transaction(queries);
  });
};

/**
 * 연결 정리 (개발 환경)
 */
export const cleanupConnections = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      activeConnections = 0;
      console.log('Connections cleaned up');
    } catch (error) {
      console.error('Failed to cleanup connections:', error);
    }
  }
};

// 개발 환경: 주기적 연결 정리
if (process.env.NODE_ENV === 'development') {
  // 5분마다 유휴 연결 정리
  setInterval(() => {
    if (activeConnections === 0) {
      prisma.$disconnect().catch(console.error);
    }
  }, 5 * 60 * 1000);
}