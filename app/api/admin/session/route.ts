import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getAdminSessions } from '@/lib/db/session';
import { Prisma } from '@prisma/client';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/session
 * 관리자용 세션 목록 조회 (페이지네이션, 검색, 필터링)
 * ---------------------------------------------------------------- */
const getSessions = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {

    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const loginType = searchParams.get('loginType') || '';
    const sortBy = searchParams.get('sortBy') || 'lastActivityTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 세션 목록 조회
    const { sessions, totalCount } = await getAdminSessions({
      page,
      limit,
      search,
      status,
      loginType,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    // 응답 데이터 포맷팅
    const formattedSessions = sessions.map((session: Prisma.SessionGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            email: true;
            name: true;
            imageUrl: true;
            status: true;
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    }>) => ({
      sessionId: session.sessionId,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      loginType: session.loginType,
      active: session.active,
      lastActivityTime: session.lastActivityTime,
      expiresTime: session.expiresTime,
      createdTime: session.createdTime,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        imageUrl: session.user.imageUrl,
        status: session.user.status,
        roles: session.user.userRoles.map(ur => ur.role.name)
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      sessions: formattedSessions,
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
    logger.error('[API] /admin/session GET error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getSessions, {
  auth: true,
  roles: ['admin']
});