import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { updateUser, getAdminUsers, getUserWithRelations } from '@/lib/db/user';
import { Prisma } from '@prisma/client';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/users
 * 관리자용 사용자 목록 조회 (페이지네이션, 검색, 필터링)
 * ---------------------------------------------------------------- */
const getUsers = async (
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
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 사용자 목록 조회
    const { users, totalCount } = await getAdminUsers({
      page,
      limit,
      search,
      status,
      role,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    // 응답 데이터 포맷팅
    const formattedUsers = users.map((user: Prisma.UserGetPayload<{
      include: {
        userRoles: {
          include: {
            role: true
          }
        };
        sessions: {
          where: {
            active: true
          };
          select: {
            sessionId: true;
            lastActivityTime: true;
            deviceInfo: true;
            ipAddress: true
          };
          orderBy: {
            lastActivityTime: "desc"
          };
          take: 1
        };
        auth: {
          select: {
            emailVerified: true;
            phoneVerified: true;
            twoFactor: true;
            status: true
          }
        };
        _count: {
          select: {
            sessions: {
              where: {
                active: true
              }
            };
            notifications: true
          }
        };
      }
    }>) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      gender: user.gender,
      birthDate: user.birthDate,
      marketing: user.marketing,
      terms: user.terms,
      status: user.status,
      lastLoginTime: user.lastLoginTime,
      createdTime: user.createdTime,
      updateTime: user.updateTime,
      roles: user.userRoles.map(ur => ur.role.name),
      auth: user.auth,
      lastSession: user.sessions[0] || null,
      activeSessions: user._count.sessions,
      totalNotifications: user._count.notifications
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      users: formattedUsers,
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
    logger.error('[API] /admin/users GET error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * PATCH /api/admin/users
 * 사용자 정보 수정 (관리자용)
 * ---------------------------------------------------------------- */
const updateUsers = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return setMessage('InvalidField', null, 400);
    }

    // 허용된 필드만 업데이트
    const allowedFields = ['name', 'phoneNumber', 'status', 'marketing', 'terms'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field];
      }
    }

    // 사용자 정보 업데이트
    await updateUser({ id: userId }, updateData);
    
    // 업데이트된 사용자 정보 조회 (관계 포함)
    const userWithRelations = await getUserWithRelations(userId);

    return setRequest(userWithRelations);

  } catch (error) {
    logger.error('[API] /admin/users PATCH error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getUsers, {
  auth: true,
  roles: ['admin']
});

export const PATCH = handler(updateUsers, {
  auth: true,
  roles: ['admin']
});