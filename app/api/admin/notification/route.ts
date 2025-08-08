import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as NotificationDB from '@/lib/db/notification';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/notification
 * 관리자용 알림 목록 조회 (페이지네이션, 검색, 필터링)
 * ---------------------------------------------------------------- */
const getNotifications = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // 새로운 db 모듈 사용
    const { notifications, totalCount } = await NotificationDB.getAdminNotifications({
      page,
      limit,
      search,
      category,
      status,
      sortBy,
      sortOrder
    });

    // 응답 데이터 포맷팅
    const formattedNotifications = notifications.map((notif) => ({
      id: notif.uid,
      userId: notif.userId,
      user: notif.user,
      category: notif.category,
      title: notif.title,
      content: notif.content,
      link: notif.link,
      read: notif.read,
      readTime: notif.readTime,
      createdTime: notif.createdTime
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      notifications: formattedNotifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    };

    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/notification GET error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * POST /api/admin/notification
 * 관리자용 알림 생성 - 개별 사용자 또는 전체 사용자에게 알림 발송
 * ---------------------------------------------------------------- */
const createNotification = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { 
      targetType, // 'individual', 'all', 'bulk'
      targetUserIds = [], 
      category, 
      title, 
      content, 
      link 
    } = body;

    // 필수 필드 검증
    if (!targetType || !category || !title || !content) {
      return setMessage('InvalidField', null, 400);
    }

    let targetUsers: string[] = [];

    // 타겟 사용자 결정
    switch (targetType) {
      case 'all':
        // 전체 활성 사용자 - 새로운 db 모듈의 배치 처리 사용
        targetUsers = await NotificationDB.getAllActiveUserIds();
        break;
      
      case 'individual':
        // 개별 사용자
        if (!targetUserIds || targetUserIds.length === 0) {
          return setMessage('InvalidField', null, 400);
        }
        targetUsers = targetUserIds;
        break;
      
      case 'bulk':
        // 대량 발송
        targetUsers = targetUserIds;
        break;
      
      default:
        return setMessage('InvalidField', null, 400);
    }

    // 대량 알림 생성 - 새로운 db 모듈의 배치 처리 사용
    await NotificationDB.createBulkNotifications(
      targetUsers,
      {
        category,
        title,
        content,
        link
      }
    );

    // 생성 통계
    const result = {
      success: true,
      message: `${targetUsers.length}명의 사용자에게 알림을 발송했습니다.`,
      targetCount: targetUsers.length,
      category,
      title
    };

    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/notification POST error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/notification
 * 관리자용 알림 삭제 - 선택된 알림들 일괄 삭제
 * ---------------------------------------------------------------- */
const deleteNotifications = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return setMessage('InvalidField', null, 400);
    }

    // 알림 삭제 - 새로운 db 모듈 사용
    const deleteResult = await NotificationDB.deleteBulkNotifications(notificationIds);

    const result = {
      success: true,
      message: `${deleteResult.count}개의 알림이 삭제되었습니다.`,
      deletedCount: deleteResult.count
    };

    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/notification DELETE error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getNotifications, {
  auth: true,
  roles: ['admin']
});

export const POST = handler(createNotification, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteNotifications, {
  auth: true,
  roles: ['admin']
});