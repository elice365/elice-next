import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getRouterById, updateRouter, deleteRouter, checkRouterNameExists, checkRouterPathExists } from '@/lib/db/router';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { Redis } from "@upstash/redis";
import { logger } from '@/lib/services/logger';

// Redis 인스턴스
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// 라우터 캐시 무효화 함수
const invalidateRouterCache = async (oldRoles?: string[], newRoles?: string[]) => {
  try {
    const cacheKeys = ['router:admin', 'router:user'];
    
    // 효율적인 캐시 무효화: 역할이 변경되었거나 admin 역할이 포함된 경우
    const allRoles = [...(oldRoles || []), ...(newRoles || [])];
    const keysToInvalidate = allRoles.includes('admin') ? cacheKeys : ['router:user'];
    
    // 병렬 캐시 삭제
    await Promise.all(
      keysToInvalidate.map(key => redis.del(key))
    );
    
    logger.info(`[Cache] Invalidated router cache: ${keysToInvalidate.join(', ')}`, 'CACHE');
  } catch (error) {
    logger.error('[Cache] Failed to invalidate router cache', 'CACHE', error);
    // 캐시 무효화 실패는 시스템을 중단시키지 않음
  }
};

/* ------------------------------------------------------------------
 * GET /api/admin/router/[id]
 * 특정 웹 라우터 상세 정보 조회
 * ---------------------------------------------------------------- */
const getRouterDetail = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = context.params;

    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    // 라우터 정보 조회
    const routerData = await getRouterById(id);

    if (!routerData) {
      return await setMessage('NotFound', null, 404);
    }

    return setRequest(routerData);

  } catch (error) {
    logger.error('[API] /admin/router/[id] GET error', 'API', error);
    return await setMessage('NetworkError', null, 500);
  }
};

// 라우터 업데이트 데이터 검증
const validateUpdateData = (body: unknown) => {
  const { name, path, icon, role } = body as { name?: unknown; path?: unknown; icon?: unknown; role?: unknown };
  const updateData: Record<string, any> = {};
  
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { error: setMessage('InvalidField', { field: 'name', message: '라우터명은 필수입니다.' }, 400) };
    }
    updateData.name = name.trim();
  }

  if (path !== undefined) {
    if (typeof path !== 'string' || path.trim().length === 0) {
      return { error: setMessage('InvalidField', { field: 'path', message: '경로는 필수입니다.' }, 400) };
    }
    
    const trimmedPath = path.trim();
    if (!trimmedPath.startsWith('/')) {
      return { error: setMessage('InvalidField', { field: 'path', message: '경로는 /로 시작해야 합니다.' }, 400) };
    }
    
    updateData.path = trimmedPath;
  }

  if (icon !== undefined) {
    if (typeof icon !== 'string' || icon.trim().length === 0) {
      return { error: setMessage('InvalidField', { field: 'icon', message: '아이콘은 필수입니다.' }, 400) };
    }
    updateData.icon = icon.trim();
  }

  if (role !== undefined) {
    if (!Array.isArray(role) || role.length === 0) {
      return { error: setMessage('InvalidField', { field: 'role', message: '역할은 최소 하나 이상 선택해야 합니다.' }, 400) };
    }
    updateData.role = role.filter((r: string) => r && typeof r === 'string');
  }

  if (Object.keys(updateData).length === 0) {
    return { error: setMessage('InvalidField', { message: '업데이트할 데이터가 없습니다.' }, 400) };
  }

  return { updateData };
};

// 라우터 중복 체크
const checkDuplicateFields = async (updateData: any, existingRouter: any, id: string) => {
  const checkPromises = [];
  
  if (updateData.name && updateData.name !== existingRouter.name) {
    checkPromises.push(checkRouterNameExists(updateData.name, id));
  } else {
    checkPromises.push(Promise.resolve(false));
  }
  
  if (updateData.path && updateData.path !== existingRouter.path) {
    checkPromises.push(checkRouterPathExists(updateData.path, id));
  } else {
    checkPromises.push(Promise.resolve(false));
  }

  const [nameExists, pathExists] = await Promise.all(checkPromises);

  if (nameExists) {
    return setMessage('DuplicateField', { field: 'name', message: '이미 존재하는 라우터명입니다.' }, 409);
  }

  if (pathExists) {
    return setMessage('DuplicateField', { field: 'path', message: '이미 존재하는 경로입니다.' }, 409);
  }

  return null;
};

// Prisma 에러 처리
const handlePrismaError = (error: any) => {
  if (error.code === 'P2002') {
    const target = error.meta?.target;
    if (target?.includes('name')) {
      return setMessage('DuplicateField', { field: 'name' }, 409);
    }
    if (target?.includes('path')) {
      return setMessage('DuplicateField', { field: 'path' }, 409);
    }
    return setMessage('DuplicateField', null, 409);
  }
  return setMessage('NetworkError', null, 500);
};

/* ------------------------------------------------------------------
 * PATCH /api/admin/router/[id]
 * 웹 라우터 정보 수정
 * ---------------------------------------------------------------- */
const updateRouterInfo = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = context.params;
    const body = await request.json();

    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    // 기존 라우터 존재 확인
    const existingRouter = await getRouterById(id);
    if (!existingRouter) {
      return await setMessage('NotFound', null, 404);
    }

    // 업데이트 데이터 검증
    const validation = validateUpdateData(body);
    if (validation.error) {
      return await validation.error;
    }

    const { updateData } = validation;

    // 중복 체크
    const duplicateError = await checkDuplicateFields(updateData, existingRouter, id);
    if (duplicateError) {
      return duplicateError;
    }

    // 라우터 정보 업데이트
    const updatedRouter = await updateRouter(id, updateData);

    // 캐시 무효화
    await invalidateRouterCache(existingRouter.role, updateData.role || existingRouter.role);

    return setRequest(updatedRouter);

  } catch (error: any) {
    logger.error('[API] /admin/router/[id] PATCH error', 'API', error);
    return await handlePrismaError(error);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/router/[id]
 * 웹 라우터 삭제
 * ---------------------------------------------------------------- */
const deleteRouterById = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = context.params;

    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    // 기존 라우터 존재 확인
    const existingRouter = await getRouterById(id);
    if (!existingRouter) {
      return await setMessage('NotFound', null, 404);
    }

    // 라우터 삭제
    await deleteRouter(id);

    // 캐시 무효화 (삭제된 라우터의 역할에 따라)
    await invalidateRouterCache(existingRouter.role);

    return setRequest({ 
      success: true, 
      message: '라우터가 성공적으로 삭제되었습니다.',
      deletedRouter: existingRouter 
    });

  } catch (error: any) {
    logger.error('[API] /admin/router/[id] DELETE error', 'API', error);
    
    // Prisma foreign key constraint 에러 처리
    if (error.code === 'P2003') {
      return await setMessage('ConflictError', { message: '다른 시스템에서 사용 중이어서 삭제할 수 없습니다.' }, 409);
    }
    
    return await setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getRouterDetail, {
  auth: true,
  roles: ['admin']
});

export const PATCH = handler(updateRouterInfo, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteRouterById, {
  auth: true,
  roles: ['admin']
});