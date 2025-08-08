import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as NotificationDB from '@/lib/db/notification';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/notification/stats
 * 관리자용 알림 통계 조회
 * ---------------------------------------------------------------- */
const getNotificationStats = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    // 새로운 db 모듈의 통계 함수 사용
    const result = await NotificationDB.getNotificationStats();
    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/notification/stats GET error', 'API', error);
    
    // 오류 발생 시 기본값 반환
    const fallbackStats = {
      total: 0,
      unread: 0, 
      read: 0,
      today: 0,
      readRate: '0',
      categoryStats: [],
      summary: {
        totalUsers: 0,
        avgNotificationsPerUser: '0'
      }
    };
    
    return setRequest(fallbackStats);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getNotificationStats, {
  auth: true,
  roles: ['admin']
});