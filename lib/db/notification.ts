import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface AdminNotificationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationCreateData {
  userId: string;
  category: string;
  title: string;
  content: string;
  link?: string;
}

export interface BulkNotificationCreateData {
  targetType: 'individual' | 'all' | 'bulk';
  targetUserIds?: string[];
  category: string;
  title: string;
  content: string;
  link?: string;
}

// ================================
// Common Select Patterns
// ================================

const basicNotificationSelect = {
  uid: true,
  userId: true,
  category: true,
  title: true,
  content: true,
  link: true,
  read: true,
  readTime: true,
  createdTime: true
};

const notificationWithUserSelect = {
  ...basicNotificationSelect,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      imageUrl: true,
      status: true
    }
  }
};

// ================================
// Notification CRUD Operations
// ================================

/**
 * 새로운 알림을 생성합니다.
 * @param data - 생성할 알림 데이터
 * @returns 생성된 알림
 */
export const createNotification = async (data: NotificationCreateData) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      category: data.category,
      title: data.title,
      content: data.content,
      link: data.link,
      read: false
    },
    select: basicNotificationSelect
  });
};

/**
 * 대량 알림을 배치 처리로 생성합니다.
 * @param userIds - 대상 사용자 ID 배열
 * @param notificationData - 알림 데이터
 * @param batchSize - 배치 크기 (기본값: 50)
 * @returns 생성된 알림 수
 */
export const createBulkNotifications = async (
  userIds: string[], 
  notificationData: Omit<NotificationCreateData, 'userId'>,
  batchSize: number = 50
) => {
  let createdCount = 0;
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchData = batch.map(userId => ({
      userId,
      category: notificationData.category,
      title: notificationData.title,
      content: notificationData.content,
      link: notificationData.link,
      read: false
    }));
    
    const result = await prisma.notification.createMany({
      data: batchData
    });
    
    createdCount += result.count;
    
    // 배치 간 짧은 지연으로 DB 부하 완화
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return createdCount;
};

/**
 * 알림을 읽음 처리합니다.
 * @param notificationId - 알림 ID
 * @param userId - 사용자 ID (보안 확인용)
 * @returns 업데이트 결과
 */
export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: {
      uid: notificationId,
      userId: userId
    },
    data: {
      read: true,
      readTime: new Date()
    }
  });
};

/**
 * 알림을 삭제합니다.
 * @param notificationId - 삭제할 알림 ID
 * @returns 삭제된 알림
 */
export const deleteNotification = async (notificationId: string) => {
  return prisma.notification.delete({
    where: { uid: notificationId },
    select: basicNotificationSelect
  });
};

/**
 * 여러 알림을 일괄 삭제합니다.
 * @param notificationIds - 삭제할 알림 ID 배열
 * @returns 삭제 결과
 */
export const deleteBulkNotifications = async (notificationIds: string[]) => {
  return prisma.notification.deleteMany({
    where: {
      uid: {
        in: notificationIds
      }
    }
  });
};

// ================================
// Notification Query Operations
// ================================

/**
 * 알림 ID로 알림을 조회합니다.
 * @param notificationId - 조회할 알림 ID
 * @returns 찾은 알림 또는 null
 */
export const findNotificationById = async (notificationId: string) => {
  return prisma.notification.findUnique({
    where: { uid: notificationId },
    select: notificationWithUserSelect
  });
};

/**
 * 사용자의 읽지 않은 알림을 조회합니다.
 * @param userId - 사용자 ID
 * @param limit - 조회할 알림 수 제한 (선택사항)
 * @returns 읽지 않은 알림 목록
 */
export const findUnreadNotifications = async (userId: string, limit?: number) => {
  return prisma.notification.findMany({
    where: {
      userId: userId,
      read: false
    },
    select: basicNotificationSelect,
    orderBy: {
      createdTime: 'desc'
    },
    ...(limit && { take: limit })
  });
};

/**
 * 사용자의 모든 알림을 조회합니다 (페이지네이션 지원).
 * @param userId - 사용자 ID
 * @param page - 페이지 번호
 * @param limit - 페이지당 항목 수
 * @returns 알림 목록과 총 개수
 */
export const findUserNotifications = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: basicNotificationSelect,
      orderBy: { createdTime: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where: { userId } })
  ]);
  
  return { notifications, totalCount };
};

/**
 * 카테고리별 알림을 조회합니다.
 * @param category - 카테고리
 * @param limit - 조회할 알림 수 제한
 * @returns 해당 카테고리의 알림 목록
 */
export const findNotificationsByCategory = async (category: string, limit?: number) => {
  return prisma.notification.findMany({
    where: { category },
    select: notificationWithUserSelect,
    orderBy: { createdTime: 'desc' },
    ...(limit && { take: limit })
  });
};

// ================================
// Notice Read Operations
// ================================

/**
 * 공지사항 읽음 처리를 합니다.
 * @param noticeId - 공지사항 ID
 * @param userId - 사용자 ID
 * @returns 읽음 처리 결과
 */
export const markNoticeAsRead = async (noticeId: string, userId: string) => {
  return prisma.noticeRead.upsert({
    where: {
      noticeId_userId: {
        noticeId: noticeId,
        userId: userId
      }
    },
    update: {
      readTime: new Date()
    },
    create: {
      noticeId: noticeId,
      userId: userId,
      readTime: new Date()
    }
  });
};

/**
 * 사용자의 읽지 않은 공지사항을 조회합니다.
 * @param userId - 사용자 ID
 * @returns 읽지 않은 공지사항 목록
 */
export const findUnreadNotices = async (userId: string) => {
  return prisma.notice.findMany({
    where: {
      AND: [
        { startsTime: { lte: new Date() } },
        {
          OR: [
            { endsTime: null },
            { endsTime: { gte: new Date() } }
          ]
        }
      ],
      NOT: {
        reads: {
          some: {
            userId: userId
          }
        }
      }
    },
    orderBy: {
      createdTime: 'desc'
    }
  });
};

// ================================
// Admin Operations
// ================================

/**
 * 관리자용 알림 목록을 조회합니다 (페이지네이션, 검색, 필터링 포함).
 * @param params - 조회 매개변수
 * @returns 알림 목록과 총 개수
 */
export const getAdminNotifications = async (params: AdminNotificationParams) => {
  const { page, limit, search, category, status, sortBy = 'createdTime', sortOrder = 'desc' } = params;
  const skip = (page - 1) * limit;

  // 검색 조건 구성
  const whereCondition: any = {};

  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (category) {
    whereCondition.category = category;
  }

  if (status) {
    whereCondition.read = status === 'read';
  }

  // 알림 목록 조회
  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: notificationWithUserSelect
    }),
    prisma.notification.count({ where: whereCondition })
  ]);

  return { notifications, totalCount };
};

/**
 * 대량 사용자 조회 (배치 처리로 메모리 효율성 개선).
 * @param batchSize - 배치 크기 (기본값: 1000)
 * @returns 활성 사용자 ID 배열
 */
export const getAllActiveUserIds = async (batchSize: number = 1000): Promise<string[]> => {
  const userIds: string[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const userBatch = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
      skip,
      take: batchSize
    });

    if (userBatch.length === 0) {
      hasMore = false;
    } else {
      userIds.push(...userBatch.map(user => user.id));
      skip += batchSize;
      hasMore = userBatch.length === batchSize;
    }
  }

  return userIds;
};

// ================================
// Statistics Operations
// ================================

/**
 * 알림 통계를 조회합니다.
 * @returns 알림 통계 정보
 */
export const getNotificationStats = async () => {
  // 오늘 날짜 설정
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  // 병렬로 통계 데이터 조회
  const [
    totalNotifications,
    unreadNotifications,
    todayNotifications,
    categoryStats,
    readNotifications
  ] = await Promise.all([
    // 전체 알림 수
    prisma.notification.count(),
    
    // 읽지 않은 알림 수
    prisma.notification.count({
      where: { read: false }
    }),
    
    // 오늘 생성된 알림 수
    prisma.notification.count({
      where: {
        createdTime: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    }),
    
    // 카테고리별 통계
    prisma.notification.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    }),
    
    // 읽은 알림 수
    prisma.notification.count({
      where: { read: true }
    })
  ]);

  // 읽음률 계산
  const readRate = totalNotifications > 0 
    ? ((readNotifications / totalNotifications) * 100).toFixed(1)
    : '0';

  // 카테고리 통계 포맷팅
  const formattedCategoryStats = categoryStats.map(stat => ({
    category: stat.category,
    count: stat._count.category,
    percentage: totalNotifications > 0 
      ? ((stat._count.category / totalNotifications) * 100).toFixed(1)
      : '0'
  }));

  // 사용자 관련 통계
  const totalActiveUsers = await prisma.user.count({ where: { status: 'active' } });

  return {
    total: totalNotifications,
    unread: unreadNotifications,
    read: readNotifications,
    today: todayNotifications,
    readRate,
    categoryStats: formattedCategoryStats,
    summary: {
      totalUsers: totalActiveUsers,
      avgNotificationsPerUser: totalNotifications > 0 && totalActiveUsers > 0
        ? (totalNotifications / totalActiveUsers).toFixed(1)
        : '0'
    }
  };
};

/**
 * 사용자별 알림 통계를 조회합니다.
 * @param userId - 사용자 ID
 * @returns 사용자 알림 통계
 */
export const getUserNotificationStats = async (userId: string) => {
  const [total, unread, read, categoryStats] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.count({ where: { userId, read: true } }),
    prisma.notification.groupBy({
      by: ['category'],
      where: { userId },
      _count: { category: true }
    })
  ]);

  return {
    total,
    unread,
    read,
    readRate: total > 0 ? ((read / total) * 100).toFixed(1) : '0',
    categoryStats: categoryStats.map(stat => ({
      category: stat.category,
      count: stat._count.category
    }))
  };
};

/**
 * 카테고리별 알림 통계를 조회합니다.
 * @returns 카테고리별 통계 목록
 */
export const getCategoryStats = async () => {
  return prisma.notification.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } }
  });
};