import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { deleteUserSessions } from '@/lib/db/session';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';

/* ------------------------------------------------------------------
 * DELETE /api/admin/session/user/[userId]
 * 특정 사용자의 모든 세션 종료
 * ---------------------------------------------------------------- */
const deleteUserSessionsHandler = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return setMessage('InvalidField', null, 400);
    }

    // 사용자의 모든 세션 종료 (비활성화)
    const result = await deleteUserSessions(userId);
    
    return setRequest({ 
      message: '사용자의 모든 세션이 종료되었습니다.',
      userId,
      terminatedCount: result.count
    });

  } catch (error) {
    console.error('[API] /admin/session/user/[userId] DELETE error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const DELETE = handler(deleteUserSessionsHandler, {
  auth: true,
  roles: ['admin']
});