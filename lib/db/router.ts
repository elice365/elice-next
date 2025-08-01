import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// ================================
// 웹 라우팅 관리용 데이터베이스 함수들
// ================================

/**
 * 라우터 생성
 */
export const createRouter = async (data: {
  name: string;
  path: string;
  icon: string;
  role: string[];
}) => {
  return prisma.router.create({
    data,
  });
};

/**
 * 관리자용 라우터 목록 조회 (페이지네이션, 검색, 필터링)
 */
export const getAdminRouters = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const { page = 1, limit = 10, search, role } = params;
  const offset = (page - 1) * limit;

  // 검색 조건 구성
  const where: Prisma.RouterWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { path: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = { has: role };
  }

  // 데이터 조회
  const [routers, totalCount] = await Promise.all([
    prisma.router.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdTime: 'desc' },
    }),
    prisma.router.count({ where }),
  ]);

  // 페이지네이션 정보 계산
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    routers,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext,
      hasPrev,
      limit,
    },
  };
};

/**
 * 라우터 상세 조회
 */
export const getRouterById = async (uid: string) => {
  return prisma.router.findUnique({
    where: { uid },
  });
};

/**
 * 라우터 정보 업데이트
 */
export const updateRouter = async (
  uid: string,
  data: Partial<{
    name: string;
    path: string;
    icon: string;
    role: string[];
  }>
) => {
  return prisma.router.update({
    where: { uid },
    data: {
      ...data,
      updateTime: new Date(),
    },
  });
};

/**
 * 라우터 삭제
 */
export const deleteRouter = async (uid: string) => {
  return prisma.router.delete({
    where: { uid },
  });
};

/**
 * 라우터 통계 조회
 */
export const getRouterStats = async () => {
  const [totalRouters, roleStats] = await Promise.all([
    prisma.router.count(),
    prisma.router.groupBy({
      by: ['role'],
      _count: true,
    }),
  ]);

  // 역할별 통계 계산
  const adminRouters = roleStats
    .filter(stat => stat.role.includes('admin'))
    .reduce((sum, stat) => sum + stat._count, 0);

  const userRouters = roleStats
    .filter(stat => stat.role.includes('user'))
    .reduce((sum, stat) => sum + stat._count, 0);

  const publicRouters = roleStats
    .filter(stat => stat.role.includes('public'))
    .reduce((sum, stat) => sum + stat._count, 0);

  return {
    totalRouters,
    adminRouters,
    userRouters,
    publicRouters,
  };
};

/**
 * 라우터 경로 중복 체크
 */
export const checkRouterPathExists = async (path: string, excludeUid?: string) => {
  const where: Prisma.RouterWhereInput = { path };
  
  if (excludeUid) {
    where.uid = { not: excludeUid };
  }

  const existing = await prisma.router.findFirst({ where });
  return !!existing;
};

/**
 * 라우터 이름 중복 체크
 */
export const checkRouterNameExists = async (name: string, excludeUid?: string) => {
  const where: Prisma.RouterWhereInput = { name };
  
  if (excludeUid) {
    where.uid = { not: excludeUid };
  }

  const existing = await prisma.router.findFirst({ where });
  return !!existing;
};

/**
 * 역할별 라우터 조회 (기존 API와 호환성)
 */
export const getRoutersByType = async (type: string, userRoles?: string[]) => {
  let whereCondition: Prisma.RouterWhereInput;

  if (type === 'admin') {
    whereCondition = { role: { has: 'admin' } };
  } else {
    whereCondition = userRoles 
      ? { role: { hasSome: userRoles } }
      : { role: { has: 'public' } };
  }

  return prisma.router.findMany({
    where: whereCondition,
    select: { uid: true, name: true, path: true, icon: true },
    orderBy: { uid: 'asc' },
  });
};