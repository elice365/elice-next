import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as NotificationDB from '@/lib/db/notification';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * DELETE /api/admin/notification/[id]
 * 개별 알림 삭제
 * ---------------------------------------------------------------- */
const deleteNotification = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const notificationId = context.params.id;

    if (!notificationId) {
      return await setMessage('InvalidField', null, 400);
    }

    // 알림 존재 확인
    const existingNotification = await NotificationDB.findNotificationById(notificationId);

    if (!existingNotification) {
      return await setMessage('NotFound', null, 404);
    }

    // 알림 삭제 - 새로운 db 모듈 사용
    await NotificationDB.deleteNotification(notificationId);

    const result = {
      success: true,
      message: `알림 "${existingNotification.title}"이(가) 삭제되었습니다.`,
      deletedId: notificationId
    };

    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/notification/[id] DELETE error', 'API', error);
    return await setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const DELETE = handler(deleteNotification, {
  auth: true,
  roles: ['admin']
});