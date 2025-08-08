import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getAdminRoles, createRole, getRoleStats } from '@/lib/db/roles';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';

/* ------------------------------------------------------------------
 * GET /api/admin/roles
 * 관리자용 역할 목록 조회 (페이지네이션, 검색, 필터링)
 * ---------------------------------------------------------------- */
const getRoles = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const includeStats = searchParams.get('includeStats') === 'true';

    // 통계 정보가 필요한 경우
    if (includeStats) {
      const stats = await getRoleStats();
      return setRequest(stats);
    }

    // 역할 목록 조회
    const { roles, totalCount } = await getAdminRoles({
      page,
      limit,
      search,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    // 응답 데이터 포맷팅
    const formattedRoles = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.userRoles,
      createdTime: role.createdTime,
      updateTime: role.updateTime
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      roles: formattedRoles,
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
    console.error('[API] /admin/roles GET error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * POST /api/admin/roles
 * 새로운 역할 생성
 * ---------------------------------------------------------------- */
const createNewRole = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { name, description } = body;

    // 필수 필드 검증
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return setMessage('InvalidField', null, 400);
    }

    // 역할 이름 중복 체크는 Prisma unique constraint에서 처리됨
    const roleData = {
      name: name.trim(),
      description: description?.trim() || null
    };

    // 새 역할 생성
    const newRole = await createRole(roleData);

    return setRequest(newRole);

  } catch (error: any) {
    console.error('[API] /admin/roles POST error:', error);
    
    // Prisma unique constraint 에러 처리
    if (error.code === 'P2002') {
      return setMessage('DuplicateField', null, 409);
    }
    
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getRoles, {
  auth: true,
  roles: ['admin']
});

export const POST = handler(createNewRole, {
  auth: true,
  roles: ['admin']
});