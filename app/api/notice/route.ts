import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import {
  getActiveNotices,
  getNoticesWithReadStatus,
  markNoticeAsRead,
  getUnreadNoticesForUser
} from '@/lib/db/notice';

// GET /api/notice - 공지사항 목록 조회
async function getNotices(
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    
    // 인증된 사용자인 경우 읽음 상태 포함
    if (context.userId) {
      // 읽지 않은 공지사항만 조회
      if (type === 'unread') {
        const unreadNotices = await getUnreadNoticesForUser(context.userId);
        return {
          success: true,
          message: '읽지 않은 공지사항 목록을 가져왔습니다',
          data: unreadNotices
        };
      }
      
      // 읽음 상태가 포함된 공지사항 목록
      const result = await getNoticesWithReadStatus(context.userId, {
        page,
        limit,
        active: true
      });
      
      return {
        success: true,
        message: '공지사항 목록을 가져왔습니다',
        data: {
          notices: result.notices,
          hasMore: result.hasMore,
          totalCount: result.totalCount
        }
      };
    }
    
    // 비인증 사용자 - 활성 공지사항만 조회
    const result = await getActiveNotices({
      page,
      limit,
      active: true
    });
    
    // Transform notices for frontend
    const transformedNotices = result.notices.map(notice => ({
      id: notice.uid,
      title: notice.title,
      content: notice.content,
      link: notice.link,
      createdAt: notice.createdTime,
      startsAt: notice.startsTime,
      endsAt: notice.endsTime,
      readCount: notice._count.reads,
      isImportant: false, // Can be determined by business logic
      author: { name: '관리자' }
    }));
    
    return {
      success: true,
      message: '공지사항 목록을 가져왔습니다',
      data: {
        notices: transformedNotices,
        hasMore: result.hasMore,
        totalCount: result.totalCount
      }
    };
  } catch (error) {
    console.error('GET /api/notice error:', error);
    return {
      success: false,
      message: '공지사항 목록을 가져오는데 실패했습니다',
      data: null
    };
  }
}

// POST /api/notice - 공지사항 읽음 처리
async function markAsRead(
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> {
  try {
    if (!context.userId) {
      return {
        success: false,
        message: '로그인이 필요합니다',
        data: null
      };
    }
    
    const body = await request.json();
    const { noticeId } = body;
    
    if (!noticeId) {
      return {
        success: false,
        message: '공지사항 ID가 필요합니다',
        data: null
      };
    }
    
    await markNoticeAsRead(noticeId, context.userId);
    
    return {
      success: true,
      message: '공지사항을 읽음으로 표시했습니다',
      data: { noticeId, read: true }
    };
  } catch (error) {
    console.error('POST /api/notice error:', error);
    return {
      success: false,
      message: '읽음 처리에 실패했습니다',
      data: null
    };
  }
}

// Export handlers
export const GET = handler(getNotices, {
  auth: false, // Allow non-authenticated access
  limit: true
});

export const POST = handler(markAsRead, {
  auth: false, // Auth check is done in handler
  limit: true
});