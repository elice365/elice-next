import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { deleteSessionById, terminateSessionById, getSessionWithUser } from '@/lib/db/session';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/session/[sessionId]
 * 특정 세션 정보 조회
 * ---------------------------------------------------------------- */
const getSession = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return setMessage('InvalidField', null, 400);
    }

    // 세션 정보 조회 (사용자 정보 포함)
    const session = await getSessionWithUser(sessionId);

    if (!session) {
      return setMessage('NotFound', null, 404);
    }

    // 응답 데이터 포맷팅
    const formattedSession = {
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
      updateTime: session.updateTime,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        imageUrl: session.user.imageUrl,
        status: session.user.status,
        roles: session.user.userRoles.map(ur => ur.role.name)
      }
    };

    return setRequest(formattedSession);

  } catch (error) {
    logger.error('[API] /admin/session/[sessionId] GET error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/session/[sessionId]
 * 특정 세션 완전 삭제
 * ---------------------------------------------------------------- */
const deleteSession = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return setMessage('InvalidField', null, 400);
    }

    // 세션 존재 여부 확인
    const existingSession = await getSessionWithUser(sessionId);
    if (!existingSession) {
      return setMessage('NotFound', null, 404);
    }

    // 세션 완전 삭제
    await deleteSessionById(sessionId);
    
    return setRequest({ 
      message: '세션이 성공적으로 삭제되었습니다.',
      sessionId 
    });

  } catch (error) {
    logger.error('[API] /admin/session/[sessionId] DELETE error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * PATCH /api/admin/session/[sessionId]
 * 특정 세션 종료 (비활성화)
 * ---------------------------------------------------------------- */
const terminateSession = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return setMessage('InvalidField', null, 400);
    }

    // 세션 존재 여부 확인
    const existingSession = await getSessionWithUser(sessionId);
    if (!existingSession) {
      return setMessage('NotFound', null, 404);
    }

    // 세션 종료 (비활성화)
    await terminateSessionById(sessionId);
    
    return setRequest({ 
      message: '세션이 성공적으로 종료되었습니다.',
      sessionId 
    });

  } catch (error) {
    logger.error('[API] /admin/session/[sessionId] PATCH error', 'API', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getSession, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteSession, {
  auth: true,
  roles: ['admin']
});

export const PATCH = handler(terminateSession, {
  auth: true,
  roles: ['admin']
});