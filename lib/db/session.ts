import { prisma } from './prisma';
import { Prisma } from '@prisma/client'; // Prisma 임포트 추가

export const createSession = async (data: Prisma.SessionCreateInput) => { // 타입 변경
  return prisma.session.create({ data });
};


export const deactivateSession = async (refreshToken: string) => {
  return prisma.session.updateMany({
    where: {
      refreshToken,
      active: true,
    },
    data: {
      active: false,
    },
  });
};

  export const searchSessionId = async (sessionId: string , userId: string) => {
    return prisma.session.findFirst({
      where: {
        sessionId,
        userId,
        active: true,
        expiresTime: { gt: new Date() }
      },
      select: {
      sessionId: true,
      userId: true,
      refreshToken: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      loginType: true,
      active: true,
      expiresTime: true,
      createdTime: true,
      updateTime: true
    }
    });
  };


export const searchSession = async (refreshToken: string, userId: string) => {
  console.log('[DB] searchSession - Input:', {
    userId,
    refreshTokenPrefix: refreshToken.substring(0, 20),
    currentTime: new Date().toISOString()
  });
  
  const result = await prisma.session.findFirst({
    where: {
      refreshToken,
      userId, // Prisma가 자동으로 uid로 변환
      active: true,
      expiresTime: {
        gt: new Date(),
      },
    },
    select: {
      sessionId: true,
      userId: true,
      refreshToken: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      loginType: true,
      active: true,
      expiresTime: true,
      createdTime: true,
      updateTime: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
          status: true,
          
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      },
    },
  });
  
  console.log('[DB] searchSession - Result:', result ? 'Session found' : 'No session found');
  
  // 세션을 찾지 못한 경우 추가 디버깅
  if (!result) {
    const debugSession = await prisma.session.findFirst({
      where: { userId },
      select: {
        sessionId: true,
        active: true,
        expiresTime: true,
        refreshToken: true
      }
    });
    
    if (debugSession) {
      console.log('[DB] searchSession - Debug info:', {
        hasUserSession: true,
        isActive: debugSession.active,
        isExpired: new Date(debugSession.expiresTime) < new Date(),
        tokenMatches: debugSession.refreshToken === refreshToken,
        expiresAt: debugSession.expiresTime
      });
    } else {
      console.log('[DB] searchSession - No sessions found for userId:', userId);
    }
  }
  
  return result;
};

export const updateSession = async (sessionId: string, data: Prisma.SessionUpdateInput) => {
  return prisma.session.update({
    where: { sessionId },
    data,
  });
};

// ================================
// Admin Session Operations
// ================================

/**
 * 관리자용 세션 매개변수 인터페이스
 */
export interface AdminSessionParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  loginType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 관리자용 세션 목록을 조회합니다 (페이지네이션, 검색, 필터링 포함).
 * @param params - 조회 매개변수
 * @returns 세션 목록과 총 개수
 */
export const getAdminSessions = async (params: AdminSessionParams) => {
  const { page, limit, search, status, loginType, sortBy = 'lastActivityTime', sortOrder = 'desc' } = params;
  const skip = (page - 1) * limit;

  // 검색 조건 구성
  const whereCondition: any = {};

  if (search) {
    whereCondition.OR = [
      { 
        user: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } }
          ]
        }
      },
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { deviceInfo: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 상태 필터링
  if (status === 'active') {
    whereCondition.active = true;
    whereCondition.expiresTime = { gt: new Date() };
  } else if (status === 'expired') {
    whereCondition.OR = [
      { active: false },
      { expiresTime: { lte: new Date() } }
    ];
  }

  // 로그인 타입 필터링
  if (loginType) {
    whereCondition.loginType = loginType;
  }

  // 세션 목록 조회
  const [sessions, totalCount] = await Promise.all([
    prisma.session.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            imageUrl: true,
            status: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.session.count({ where: whereCondition })
  ]);

  return { sessions, totalCount };
};

/**
 * 세션을 종료합니다 (비활성화) (관리자용).
 * @param sessionId - 종료할 세션 ID
 * @returns 종료 결과
 */
export const terminateSessionById = async (sessionId: string) => {
  return prisma.session.update({
    where: { sessionId },
    data: {
      active: false,
      updateTime: new Date()
    }
  });
};

/**
 * 세션을 완전히 삭제합니다 (관리자용).
 * @param sessionId - 삭제할 세션 ID
 * @returns 삭제 결과
 */
export const deleteSessionById = async (sessionId: string) => {
  return prisma.session.delete({
    where: { sessionId }
  });
};

/**
 * 사용자의 모든 세션을 삭제합니다 (관리자용).
 * @param userId - 사용자 ID
 * @returns 삭제 결과
 */
export const deleteUserSessions = async (userId: string) => {
  return prisma.session.updateMany({
    where: { 
      userId,
      active: true 
    },
    data: {
      active: false,
      updateTime: new Date()
    }
  });
};

/**
 * 세션 통계를 조회합니다.
 * @returns 세션 통계 정보
 */
export const getSessionStats = async () => {
  try {
    const now = new Date();
    
    const [
      totalSessions,
      activeSessions,
      expiredSessions,
      loginTypeCounts
    ] = await Promise.all([
      // 전체 세션 수
      prisma.session.count(),
      
      // 활성 세션 수
      prisma.session.count({
        where: {
          active: true,
          expiresTime: { gt: now }
        }
      }),
      
      // 만료된 세션 수
      prisma.session.count({
        where: {
          OR: [
            { active: false },
            { expiresTime: { lte: now } }
          ]
        }
      }),
      
      // 로그인 타입별 통계
      prisma.session.groupBy({
        by: ['loginType'],
        where: {
          active: true,
          expiresTime: { gt: now }
        },
        _count: {
          sessionId: true
        }
      })
    ]);

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      loginTypeCounts: loginTypeCounts.reduce((acc, item) => {
        acc[item.loginType] = item._count.sessionId;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Database connection error in getSessionStats:', error);
    // 데이터베이스 연결 실패 시 기본값 반환
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      loginTypeCounts: {}
    };
  }
};

/**
 * 세션 ID로 세션과 사용자 정보를 함께 조회합니다.
 * @param sessionId - 조회할 세션 ID
 * @returns 세션과 사용자 정보 또는 null
 */
export const getSessionWithUser = async (sessionId: string) => {
  return prisma.session.findUnique({
    where: { sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
          status: true,
          userRoles: {
            select: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
};
