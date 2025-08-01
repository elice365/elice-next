import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { setUserRole, getUserRole, checkRole, getUserRoles, getAllRoles, removeUserRole } from '@/lib/db/roles';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';

// ================================
// Route Handlers
// ================================

/**
 * GET /api/admin/users/[userId]/roles
 * 특정 사용자의 역할 목록 조회
 */
const rolesList = async (
  _request: NextRequest,
  _context: AuthInfo,
  params?: { userId: string }
): Promise<APIResult> => {
  try {
    const userId = params?.userId;
    if (!userId) {
      return setMessage('InvalidField', null, 400);
    }

    // 사용자 역할 조회
    const userRoles = await getUserRoles(userId);

    // 모든 사용 가능한 역할 조회
    const allRoles = await getAllRoles();

    const result = {
      userRoles: userRoles.map(ur => ur.role),
      availableRoles: allRoles
    };

    return setRequest(result);

  } catch (error) {
    console.error('[API] /admin/users/[userId]/roles GET error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/**
 * POST /api/admin/users/[userId]/roles
 * 사용자에게 역할 추가
 */
const addRole = async (
  request: NextRequest,
  _context: AuthInfo,
  params?: { userId: string }
): Promise<APIResult> => {
  try {
    const userId = params?.userId;
    if (!userId) {
      return setMessage('InvalidField', null, 400);
    }

    const { roleId } = await request.json();

    if (!roleId) {
      return setMessage('InvalidField', null, 400);
    }

    // 중복 체크
    const existingRole = await checkRole(userId, roleId);

    if (existingRole) {
      return setMessage('BadRequest', null, 400);
    }

    // 역할 추가
    await setUserRole(userId, roleId);
    
    // 생성된 역할 정보 조회
    const userRole = await getUserRole(userId, roleId);

    return setRequest(userRole);

  } catch (error) {
    console.error('[API] /admin/users/[userId]/roles POST error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/**
 * DELETE /api/admin/users/[userId]/roles
 * 사용자에서 역할 제거
 */
const removeRole = async (
  request: NextRequest,
  _context: AuthInfo,
  params?: { userId: string }
): Promise<APIResult> => {
  try {
    const userId = params?.userId;
    if (!userId) {
      return setMessage('InvalidField', null, 400);
    }

    const { roleId } = await request.json();

    if (!roleId) {
      return setMessage('InvalidField', null, 400);
    }

    // 역할 제거
    await removeUserRole(userId, roleId);


    return setRequest({ success: true });

  } catch (error) {
    console.error('[API] /admin/users/[userId]/roles DELETE error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

// ================================
// Handler Factory
// ================================

/**
 * Dynamic Route 핸들러 생성
 */
const createHandler = (
  handlerFn: (req: NextRequest, ctx: AuthInfo, params?: { userId: string }) => Promise<APIResult>
) => {
  return handler(async (request: NextRequest, context: AuthInfo) => {
    const pathSegments = request.nextUrl.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 2]; // .../users/[userId]/roles
    return handlerFn(request, context, { userId });
  }, {
    auth: true,
    roles: ['admin']
  });
};

export const GET = createHandler(rolesList);
export const POST = createHandler(addRole);
export const DELETE = createHandler(removeRole);