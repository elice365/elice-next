import { NextRequest } from 'next/server';
import { setMessage, setRequest } from '@/lib/response';
import { getRoleById, getRoleWithUsers, updateRole, deleteRole } from '@/lib/db/roles';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/services/logger';

type RoleWithUsers = Prisma.RoleGetPayload<{
  include: {
    userRoles: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            status: true;
            createdTime: true;
          };
        };
      };
    };
  };
}>;

// Helper function to format role with users
const formatRoleWithUsers = (roleData: RoleWithUsers) => ({
  id: roleData.id,
  name: roleData.name,
  description: roleData.description,
  users: roleData.userRoles.map((userRole: any) => ({
    id: userRole.user.id,
    name: userRole.user.name,
    email: userRole.user.email,
    status: userRole.user.status,
    createdTime: userRole.user.createdTime
  })),
  userCount: roleData.userRoles.length
});

/* ------------------------------------------------------------------
 * GET /api/admin/roles/[id]
 * 특정 역할 상세 정보 조회
 * ---------------------------------------------------------------- */
const getRoleDetail = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    const { searchParams } = new URL(request.url);
    const includeUsers = searchParams.get('includeUsers') === 'true';

    const roleData = includeUsers
      ? await getRoleWithUsers(id)
      : await getRoleById(id);

    if (!roleData) {
      return await setMessage('NotFound', null, 404);
    }

    const result = includeUsers && 'userRoles' in roleData
      ? formatRoleWithUsers(roleData as RoleWithUsers)
      : roleData;

    return setRequest(result);

  } catch (error) {
    logger.error('[API] /admin/roles/[id] GET error', 'API', error);
    return await setMessage('NetworkError', null, 500);
  }
};

// Helper function to validate and build update data
const buildUpdateData = (name: unknown, description: unknown) => {
  const updateData: Record<string, any> = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('InvalidName');
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description === 'string') {
      updateData.description = description.trim() || null;
    } else {
      updateData.description = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('NoUpdateData');
  }

  return updateData;
};

/* ------------------------------------------------------------------
 * PATCH /api/admin/roles/[id]
 * 역할 정보 수정
 * ---------------------------------------------------------------- */
const updateRoleInfo = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    const existingRole = await getRoleById(id);
    if (!existingRole) {
      return await setMessage('NotFound', null, 404);
    }

    const body = await request.json();
    const { name, description } = body;
    
    const updateData = buildUpdateData(name, description);
    const updatedRole = await updateRole(id, updateData);

    return setRequest(updatedRole);

  } catch (error: any) {
    logger.error('[API] /admin/roles/[id] PATCH error', 'API', error);

    if (error.message === 'InvalidName' || error.message === 'NoUpdateData') {
      return await setMessage('InvalidField', null, 400);
    }

    if (error.code === 'P2002') {
      return await setMessage('DuplicateField', null, 409);
    }

    return await setMessage('NetworkError', null, 500);
  }
};

// Helper function to validate role deletion
const validateRoleDeletion = (role: any) => {
  const systemRoles = ['admin', 'user'];
  return !systemRoles.includes(role.name.toLowerCase());
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/roles/[id]
 * 역할 삭제
 * ---------------------------------------------------------------- */
const deleteRoleById = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { id } = await context.params;

    if (!id) {
      return await setMessage('InvalidField', null, 400);
    }

    const existingRole = await getRoleById(id);
    if (!existingRole) {
      return await setMessage('NotFound', null, 404);
    }

    if (!validateRoleDeletion(existingRole)) {
      return await setMessage('Forbidden', null, 403);
    }

    await deleteRole(id);

    return setRequest({
      success: true,
      message: '역할이 성공적으로 삭제되었습니다.',
      deletedRole: existingRole
    });

  } catch (error: any) {
    logger.error('[API] /admin/roles/[id] DELETE error', 'API', error);

    if (error.code === 'P2003') {
      return await setMessage('ConflictError', null, 409);
    }

    return await setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * 핸들러 내보내기
 * ---------------------------------------------------------------- */
export const GET = handler(getRoleDetail, {
  auth: true,
  roles: ['admin']
});

export const PATCH = handler(updateRoleInfo, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteRoleById, {
  auth: true,
  roles: ['admin']
});