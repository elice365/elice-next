import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { withRetry } from './connection-manager';
import { logger } from '@/utils/logger';

// ================================
// TypeScript Interfaces
// ================================

export interface AdminUserParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ================================
// Common Select Patterns
// ================================

const userRoleSelect = {
  select: {
    role: {
      select: {
        id: true,
        name: true
      }
    }
  }
};

const authSelect = {
  select: {
    emailVerified: true,
    phoneVerified: true,
    twoFactor: true,
    status: true
  }
};

const basicUserSelect = {
  id: true,
  email: true,
  name: true,
  imageUrl: true,
  status: true
};

// ================================
// User CRUD Operations
// ================================

/**
 * 새로운 사용자를 생성합니다.
 * @param data - 생성할 사용자 데이터.
 * @returns 생성된 사용자.
 */
export const createUser = async (data: Prisma.UserCreateInput) => {
  return prisma.user.create({ data });
};

/**
 * 사용자 정보를 업데이트합니다.
 * @param where - 업데이트할 사용자를 찾는 조건.
 * @param data - 업데이트할 사용자 데이터.
 * @returns 업데이트된 사용자.
 */
export const updateUser = async (where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({ where, data });
};

// ================================
// User Query Operations
// ================================

/**
 * 이메일로 사용자를 찾습니다.
 * @param email - 찾을 사용자의 이메일.
 * @returns 찾은 사용자 또는 null.
 */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      ...basicUserSelect,
      userRoles: userRoleSelect
    }
  });
};

/**
 * ID로 사용자를 찾습니다. (N+1 최적화)
 * @param id - 찾을 사용자의 ID.
 * @returns 찾은 사용자 또는 null.
 */
export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...basicUserSelect,
      userRoles: userRoleSelect
    }
  });
};

/**
 * 이메일로 사용자를 찾고 인증 정보를 포함합니다. (N+1 최적화)
 * 재시도 로직 포함하여 연결 풀 문제 해결
 * @param email - 찾을 사용자의 이메일.
 * @returns 찾은 사용자 및 인증 정보 또는 null.
 */
export const findUser = async (email: string) => {
  return withRetry(() => 
    prisma.user.findUnique({
      where: { email },
      select: {
        ...basicUserSelect,
        auth: {
          select: {
            id: true,
            passwordHash: true,
            emailVerified: true,
            emailVerificationToken: true,
            emailVerificationExpires: true
          }
        },
        userRoles: userRoleSelect
      }
    })
  );
};

// ================================
// Social Account Operations
// ================================

/**
 * 소셜 계정을 생성하고 사용자에게 연결합니다.
 * @param data - 생성할 소셜 계정 데이터.
 * @returns 생성된 소셜 계정.
 */
export const createSocialAccount = async (data: Prisma.SocialCreateInput) => {
  return prisma.social.create({ data });
};

/**
 * 소셜 ID와 프로바이더로 소셜 계정을 찾습니다. (N+1 최적화)
 * @param socialId - 소셜 계정의 ID.
 * @param provider - 소셜 프로바이더 이름.
 * @returns 찾은 소셜 계정 또는 null.
 */
export const findSocialAccount = async (socialId: string, provider: string) => {
  return prisma.social.findFirst({
    where: {
      social: provider,
      socialId: socialId,
    },
    select: {
      id: true,
      user: {
        select: {
          ...basicUserSelect,
          userRoles: userRoleSelect
        }
      }
    }
  });
};

/**
 * 소셜 계정 정보를 업데이트합니다.
 * @param socialId - 업데이트할 소셜 계정의 ID.
 * @param data - 업데이트할 소셜 계정 데이터.
 * @returns 업데이트된 소셜 계정.
 */
export const updateSocialAccount = async (socialId: string, data: Prisma.SocialUpdateInput) => {
  return prisma.social.update({
    where: { id: socialId },
    data,
  });
};

// ================================
// Authentication Operations
// ================================

/**
 * 이메일 인증 토큰으로 사용자를 찾고 인증 정보를 포함합니다.
 * @param token - 찾을 이메일 인증 토큰.
 * @returns 찾은 사용자 및 인증 정보 또는 null.
 */
export const findUserByEmailVerificationToken = async (token: string) => {
  return prisma.user.findFirst({
    where: {
      auth: {
        emailVerificationToken: token,
      },
    },
    select: {
      auth: {
        select: {
          id: true,
          passwordHash: true,
          emailVerified: true,
          emailVerificationToken: true,
          emailVerificationExpires: true
        }
      },
    },
  });
};

/**
 * 사용자의 인증 정보를 업데이트합니다.
 * @param userId - 인증 정보를 업데이트할 사용자의 ID.
 * @param data - 업데이트할 인증 데이터.
 * @returns 업데이트된 인증 정보.
 */
export const updateUserAuth = async (userId: string, data: Prisma.AuthUpdateInput) => {
  return prisma.auth.update({
    where: { id: userId },
    data,
  });
};

/**
 * 사용자 ID로 인증 정보를 업데이트합니다.
 * @param userId - 인증 정보를 업데이트할 사용자의 ID.
 * @param data - 업데이트할 인증 데이터.
 * @returns 업데이트된 인증 정보.
 */
export const updateUserAuthByUserId = async (userId: string, data: Prisma.AuthUpdateInput) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      auth: {
        update: data,
      },
    },
    select: {
      auth: true,
    },
  });
};

// ================================
// Admin Operations
// ================================

/**
 * 관리자용 사용자 목록을 조회합니다 (페이지네이션, 검색, 필터링 포함).
 * @param params - 조회 매개변수
 * @returns 사용자 목록과 총 개수
 */
export const getAdminUsers = async (params: AdminUserParams) => {
  const { page, limit, search, status, role, sortBy = 'createdTime', sortOrder = 'desc' } = params;
  const skip = (page - 1) * limit;

  // 검색 조건 구성
  const whereCondition: Record<string, any> = {};

  if (search) {
    whereCondition.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    whereCondition.status = status;
  }

  // 역할 필터링
  if (role) {
    whereCondition.userRoles = {
      some: {
        role: {
          name: role
        }
      }
    };
  }

  // 사용자 목록 조회
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        sessions: {
          where: {
            active: true
          },
          select: {
            sessionId: true,
            lastActivityTime: true,
            deviceInfo: true,
            ipAddress: true
          },
          orderBy: {
            lastActivityTime: 'desc'
          },
          take: 1
        },
        auth: {
          select: {
            emailVerified: true,
            phoneVerified: true,
            twoFactor: true,
            status: true
          }
        },
        _count: {
          select: {
            sessions: {
              where: {
                active: true
              }
            },
            notifications: true
          }
        }
      }
    }),
    prisma.user.count({ where: whereCondition })
  ]);

  return { users, totalCount };
};

/**
 * 관리자용 사용자 정보를 관계와 함께 조회합니다.
 * @param userId - 조회할 사용자 ID
 * @returns 사용자 정보 (관계 포함) 또는 null
 */
export const getUserWithRelations = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      },
      auth: authSelect
    }
  });
};

/**
 * 사용자 통계를 조회합니다.
 * @returns 사용자 통계 정보
 */
export const getUserStats = async () => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      statusCounts
    ] = await Promise.all([
      // 전체 사용자 수
      prisma.user.count(),
      
      // 활성 사용자 수
      prisma.user.count({
        where: { status: 'active' }
      }),
      
      // 비활성 사용자 수
      prisma.user.count({
        where: { status: 'inactive' }
      }),
      
      // 상태별 통계
      prisma.user.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    // 역할별 통계
    const roles = await prisma.role.findMany({
      select: { id: true, name: true }
    });

    const roleStatsWithNames = await Promise.all(
      roles.map(async (role) => {
        const count = await prisma.userRole.count({
          where: { roleId: role.id }
        });
        return { roleName: role.name, count };
      })
    );

    // 인증 통계
    const verificationStats = {
      emailVerified: await prisma.user.count({
        where: { auth: { emailVerified: true } }
      }),
      phoneVerified: await prisma.user.count({
        where: { auth: { phoneVerified: true } }
      }),
      twoFactorEnabled: await prisma.user.count({
        where: { auth: { twoFactor: true } }
      })
    };

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      statusCounts: statusCounts.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      roleCounts: roleStatsWithNames.reduce<Record<string, number>>((acc, item) => {
        acc[item.roleName] = item.count;
        return acc;
      }, {}),
      verificationStats
    };
  } catch (error) {
    logger.error('Database connection error in getUserStats', 'DB', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      statusCounts: {},
      roleCounts: {},
      verificationStats: {
        emailVerified: 0,
        phoneVerified: 0,
        twoFactorEnabled: 0
      }
    };
  }
};

