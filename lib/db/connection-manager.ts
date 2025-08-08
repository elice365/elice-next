/**
 * Prisma 연결 관리자
 * Supabase 연결 수 제한 문제 해결을 위한 유틸리티
 */

import { prisma } from './prisma';
import { logger } from '@/lib/services/logger';

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
    logger.error('Failed to get connection status', 'DB', error);
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
// Helper function to check if error is connection pool error
const isConnectionPoolError = (error: unknown): boolean => {
  const err = error as Error;
  return !!err.message && (
    err.message.includes('Timed out fetching a new connection') || 
    err.message.includes('connection pool')
  );
};

// Helper function to wait with exponential backoff
const waitWithBackoff = async (retryNumber: number, baseDelay: number): Promise<void> => {
  const waitTime = baseDelay * Math.pow(2, retryNumber);
  await new Promise(resolve => setTimeout(resolve, waitTime));
};

// Helper function to reset database connection
const resetConnection = async (): Promise<void> => {
  try {
    logger.info('Attempting to reset connection...', 'DB');
    await prisma.$disconnect();
    await new Promise(resolve => setTimeout(resolve, 500));
    await prisma.$connect();
  } catch (reconnectError) {
    logger.error('Failed to reconnect', 'DB', reconnectError);
  }
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      if (!isConnectionPoolError(error)) {
        // 다른 에러는 즉시 throw
        throw error;
      }
      
      logger.warn(`Connection pool timeout, retry ${i + 1}/${maxRetries}`, 'DB');
      
      // 재시도 전 대기 (지수 백오프)
      await waitWithBackoff(i, delay);
      
      // 2번째 재시도 시 연결 재설정 시도
      if (i === 1) {
        await resetConnection();
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
    return prisma.$transaction(queries) as Promise<T[]>;
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
      logger.info('Connections cleaned up', 'DB');
    } catch (error) {
      logger.error('Failed to cleanup connections', 'DB', error);
    }
  }
};

// 개발 환경: 주기적 연결 정리
if (process.env.NODE_ENV === 'development') {
  // 5분마다 유휴 연결 정리
  setInterval(() => {
    if (activeConnections === 0) {
      prisma.$disconnect().catch(error => logger.error('Failed to disconnect', 'DB', error));
    }
  }, 5 * 60 * 1000);
}