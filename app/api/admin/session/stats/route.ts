import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getSessionStats } from '@/lib/db/session';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';

/* ------------------------------------------------------------------
 * GET /api/admin/session/stats
 * 관리자용 세션 통계 조회
 * ---------------------------------------------------------------- */
const getStats = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    // 세션 통계 조회
    const stats = await getSessionStats();

    if (!stats) {
      return setMessage('NotFoundData', null, 404);
    }

    return setRequest(stats);

  } catch (error) {
    console.error('[API] /admin/session/stats GET error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getStats, {
  auth: true,
  roles: ['admin']
});