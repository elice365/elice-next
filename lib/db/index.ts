// ================================
// Database Module Index
// ================================
// 통합 DB 모듈 exports for consistent data access layer

export * as User from './user';
export * as Session from './session';
export * as Role from './roles';
export * as Notification from './notification';

// Core Prisma client export
export { prisma } from './prisma';

// Connection management utilities
export { 
  getConnectionStatus,
  withRetry,
  batchQuery,
  cleanupConnections 
} from './connection-manager';

// Query cache utilities
export { clearQueryCache } from './middleware';

// ================================
// Type Exports
// ================================

// User module types
export type { AdminUserParams } from './user';

// Role module types - none currently exported

// Session module types - none currently exported  

// Notification module types
export type { 
  AdminNotificationParams,
  NotificationCreateData,
  BulkNotificationCreateData 
} from './notification';

// ================================
// Utility Functions
// ================================

/**
 * 모든 DB 연결 상태를 확인합니다.
 * @returns DB 연결 상태 정보
 */
export const checkDbConnection = async () => {
  try {
    const { prisma } = await import('./prisma');
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'disconnected', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
};

/**
 * 모든 테이블의 기본 통계를 조회합니다.
 * @returns 테이블별 레코드 수
 */
export const getDbStats = async () => {
  try {
    const { prisma } = await import('./prisma');
    
    const [
      userCount,
      sessionCount, 
      roleCount,
      notificationCount,
      noticeCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.role.count(),
      prisma.notification.count(),
      prisma.notice.count()
    ]);

    return {
      users: userCount,
      sessions: sessionCount,
      roles: roleCount,
      notifications: notificationCount,
      notices: noticeCount,
      total: userCount + sessionCount + roleCount + notificationCount + noticeCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};