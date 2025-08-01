import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getAdminRouters, createRouter, getRouterStats, checkRouterNameExists, checkRouterPathExists } from '@/lib/db/router';
import { getAllRoles } from '@/lib/db/roles';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { Redis } from "@upstash/redis";

// Redis 인스턴스
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// 라우터 캐시 무효화 함수
const invalidateRouterCache = async (roles?: string[]) => {
  try {
    const cacheKeys = ['router:admin', 'router:user'];
    
    // 역할별 캐시 키 결정 (효율성을 위해)
    let keysToInvalidate = cacheKeys;
    if (roles) {
      keysToInvalidate = roles.includes('admin') ? cacheKeys : ['router:user'];
    }
    
    // 병렬 캐시 삭제
    await Promise.all(
      keysToInvalidate.map(key => redis.del(key))
    );
    
    console.log(`[Cache] Invalidated router cache: ${keysToInvalidate.join(', ')}`);
  } catch (error) {
    console.error('[Cache] Failed to invalidate router cache:', error);
    // 캐시 무효화 실패는 시스템을 중단시키지 않음
  }
};

/* ------------------------------------------------------------------
 * GET /api/admin/router
 * 관리자용 웹 라우터 목록 조회 (페이지네이션, 검색, 필터링)
 * ---------------------------------------------------------------- */
const getRouters = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const includeStats = searchParams.get('includeStats') === 'true';

    // 통계 정보가 필요한 경우
    if (includeStats) {
      const stats = await getRouterStats();
      return setRequest(stats);
    }

    // 라우터 목록 조회
    const result = await getAdminRouters({
      page,
      limit,
      search,
      role
    });

    return setRequest(result);

  } catch (error) {
    console.error('[API] /admin/router GET error:', error);
    return await setMessage('NetworkError', null, 500);
  }
};

// 라우터 데이터 유효성 검사
const validateRouterData = async (data: any): Promise<APIResult | null> => {
  const { name, path, icon, role } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return await setMessage('InvalidField', { field: 'name', message: '라우터명은 필수입니다.' }, 400);
  }

  if (!path || typeof path !== 'string' || path.trim().length === 0) {
    return await setMessage('InvalidField', { field: 'path', message: '경로는 필수입니다.' }, 400);
  }

  if (!icon || typeof icon !== 'string' || icon.trim().length === 0) {
    return await setMessage('InvalidField', { field: 'icon', message: '아이콘은 필수입니다.' }, 400);
  }

  if (!role || !Array.isArray(role) || role.length === 0) {
    return await setMessage('InvalidField', { field: 'role', message: '역할은 최소 하나 이상 선택해야 합니다.' }, 400);
  }

  // 역할 존재 여부 검증
  try {
    const existingRoles = await getAllRoles();
    const existingRoleNames = existingRoles.map(r => r.name);
    const invalidRoles = role.filter((r: string) => !existingRoleNames.includes(r));
    
    if (invalidRoles.length > 0) {
      return await setMessage('InvalidField', { 
        field: 'role', 
        message: `존재하지 않는 역할이 포함되어 있습니다: ${invalidRoles.join(', ')}` 
      }, 400);
    }
  } catch (error) {
    console.error('역할 검증 중 오류:', error);
    return await setMessage('NetworkError', null, 500);
  }

  const trimmedPath = path.trim();
  if (!trimmedPath.startsWith('/')) {
    return await setMessage('InvalidField', { field: 'path', message: '경로는 /로 시작해야 합니다.' }, 400);
  }

  return null; // 유효성 검사 통과
};

// 중복 검사
const checkDuplicates = async (name: string, path: string): Promise<APIResult | null> => {
  const [nameExists, pathExists] = await Promise.all([
    checkRouterNameExists(name),
    checkRouterPathExists(path)
  ]);

  if (nameExists) {
    return await setMessage('DuplicateField', { field: 'name', message: '이미 존재하는 라우터명입니다.' }, 409);
  }

  if (pathExists) {
    return await setMessage('DuplicateField', { field: 'path', message: '이미 존재하는 경로입니다.' }, 409);
  }

  return null; // 중복 없음
};

// Prisma 에러 처리
const handlePrismaError = async (error: any): Promise<APIResult> => {
  if (error.code === 'P2002') {
    const target = error.meta?.target;
    if (target?.includes('name')) {
      return await setMessage('DuplicateField', { field: 'name' }, 409);
    }
    if (target?.includes('path')) {
      return await setMessage('DuplicateField', { field: 'path' }, 409);
    }
    return await setMessage('DuplicateField', null, 409);
  }
  
  return await setMessage('NetworkError', null, 500);
};

/* ------------------------------------------------------------------
 * POST /api/admin/router
 * 새로운 웹 라우터 생성
 * ---------------------------------------------------------------- */
const createNewRouter = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();

    // 유효성 검사
    const validationError = await validateRouterData(body);
    if (validationError) return validationError;

    const { name, path, icon, role } = body;
    const trimmedPath = path.trim();

    // 중복 검사
    const duplicateError = await checkDuplicates(name.trim(), trimmedPath);
    if (duplicateError) return duplicateError;

    const routerData = {
      name: name.trim(),
      path: trimmedPath,
      icon: icon.trim(),
      role: role.filter((r: string) => r && typeof r === 'string')
    };

    // 새 라우터 생성
    const newRouter = await createRouter(routerData);

    // 캐시 무효화 (새로 생성된 라우터의 역할에 따라)
    await invalidateRouterCache(routerData.role);

    return setRequest(newRouter);

  } catch (error: any) {
    console.error('[API] /admin/router POST error:', error);
    return await handlePrismaError(error);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getRouters, {
  auth: true,
  roles: ['admin']
});

export const POST = handler(createNewRouter, {
  auth: true,
  roles: ['admin']
});