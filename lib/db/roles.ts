import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// ================================
// Common Select Patterns
// ================================

const roleSelect = {
  select: {
    id: true,
    name: true
  }
};

// ================================
// Role CRUD Operations
// ================================

/**
 * 새로운 역할을 생성합니다.
 * @param data - 생성할 역할 데이터.
 * @returns 생성된 역할.
 */
export const createRole = async (data: Prisma.RoleCreateInput) => {
  return prisma.role.create({ data });
};

/**
 * 역할 이름으로 역할을 찾습니다.
 * @param name - 찾을 역할의 이름.
 * @returns 찾은 역할 또는 null.
 */
export const searchRole = async (name: string) => {
  return prisma.role.findUnique({ where: { name } });
};

/**
 * 시스템의 모든 사용 가능한 역할을 조회합니다.
 * @returns 모든 역할 목록 (이름 순 정렬).
 */
export const getAllRoles = async () => {
  return prisma.role.findMany({
    orderBy: { name: 'asc' }
  });
};

// ================================
// User Role Operations
// ================================

/**
 * 사용자에게 역할을 할당합니다.
 * @param userId - 역할을 할당할 사용자의 ID.
 * @param roleId - 할당할 역할의 ID.
 * @returns 생성된 사용자 역할.
 */
export const setUserRole = async (userId: string, roleId: string) => {
  return prisma.userRole.create({ data: { userId, roleId } });
};

/**
 * 사용자가 특정 역할을 가지고 있는지 확인합니다 (기본 정보만).
 * @param userId - 사용자 ID.
 * @param roleId - 역할 ID.
 * @returns 역할을 가지고 있으면 UserRole 객체, 없으면 null.
 */
export const checkRole = async (userId: string, roleId: string) => {
  return prisma.userRole.findUnique({
    where: {
      userId_roleId: { userId, roleId }
    }
  });
};

/**
 * 사용자 역할을 조회합니다 (역할 정보 포함).
 * @param userId - 사용자 ID.
 * @param roleId - 역할 ID.
 * @returns 사용자 역할 정보 (역할 포함) 또는 null.
 */
export const getUserRole = async (userId: string, roleId: string) => {
  return prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
    include: { role: true }
  });
};

/**
 * 특정 사용자의 모든 역할을 조회합니다.
 * @param userId - 사용자 ID.
 * @returns 사용자의 역할 목록 (역할 정보 포함).
 */
export const getUserRoles = async (userId: string) => {
  return prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true
    }
  });
};

/**
 * 사용자에서 역할을 제거합니다.
 * @param userId - 사용자 ID.
 * @param roleId - 제거할 역할 ID.
 * @returns 삭제 결과.
 */
export const removeUserRole = async (userId: string, roleId: string) => {
  return prisma.userRole.delete({
    where: {
      userId_roleId: { userId, roleId }
    }
  });
};



export const assignRole = async (userId: string, roleId: string) => {
  return prisma.userRole.create({
    data: {
      userId,
      roleId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  });
};

// ================================
// Role Management Operations
// ================================

/**
 * 역할 정보를 업데이트합니다.
 * @param id - 업데이트할 역할의 ID.
 * @param data - 업데이트할 역할 데이터.
 * @returns 업데이트된 역할.
 */
export const updateRole = async (id: string, data: Prisma.RoleUpdateInput) => {
  return prisma.role.update({
    where: { id },
    data
  });
};

/**
 * 역할을 삭제합니다.
 * @param id - 삭제할 역할의 ID.
 * @returns 삭제 결과.
 */
export const deleteRole = async (id: string) => {
  // 먼저 해당 역할을 가진 사용자들의 역할을 제거
  await prisma.userRole.deleteMany({
    where: { roleId: id }
  });
  
  // 그 다음 역할 삭제
  return prisma.role.delete({
    where: { id }
  });
};

/**
 * 역할 ID로 역할을 조회합니다.
 * @param id - 조회할 역할의 ID.
 * @returns 찾은 역할 또는 null.
 */
export const getRoleById = async (id: string) => {
  return prisma.role.findUnique({
    where: { id }
  });
};

/**
 * 역할과 연관된 사용자들을 함께 조회합니다.
 * @param id - 조회할 역할의 ID.
 * @returns 역할과 사용자 목록.
 */
export const getRoleWithUsers = async (id: string) => {
  return prisma.role.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdTime: true
            }
          }
        }
      }
    }
  });
};

/**
 * 역할 통계를 조회합니다.
 * @returns 역할별 사용자 수와 총계.
 */
export const getRoleStats = async () => {
  const roleStats = await prisma.role.findMany({
    include: {
      _count: {
        select: {
          userRoles: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  const totalRoles = roleStats.length;
  const totalUserRoles = roleStats.reduce((sum, role) => sum + role._count.userRoles, 0);

  return {
    roles: roleStats.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.userRoles
    })),
    totalRoles,
    totalUserRoles
  };
};

/**
 * 페이지네이션과 검색을 지원하는 역할 목록을 조회합니다.
 * @param params - 조회 매개변수
 * @returns 역할 목록과 총 개수
 */
export const getAdminRoles = async (params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const { page, limit, search, sortBy = 'name', sortOrder = 'asc' } = params;
  const skip = (page - 1) * limit;

  // 검색 조건 구성
  const whereCondition: any = {};

  if (search) {
    whereCondition.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 역할 목록 조회
  const [roles, totalCount] = await Promise.all([
    prisma.role.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    }),
    prisma.role.count({ where: whereCondition })
  ]);

  return { roles, totalCount };
};
