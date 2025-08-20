import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface NoticeParams {
  page?: number;
  limit?: number;
  active?: boolean;
}

export interface NoticeCreateData {
  title: string;
  content: string;
  link?: string;
  startsTime?: Date;
  endsTime?: Date;
}

export interface NoticeUpdateData {
  title?: string;
  content?: string;
  link?: string;
  startsTime?: Date;
  endsTime?: Date;
}

// ================================
// Common Select Patterns
// ================================

const basicNoticeSelect = {
  uid: true,
  title: true,
  content: true,
  link: true,
  createdTime: true,
  startsTime: true,
  endsTime: true
};

const noticeWithReadsSelect = {
  ...basicNoticeSelect,
  _count: {
    select: {
      reads: true
    }
  }
};

// ================================
// Notice CRUD Operations
// ================================

/**
 * Create a new notice.
 * @param data - Notice data
 * @returns Created notice
 */
export const createNotice = async (data: NoticeCreateData) => {
  return prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      link: data.link,
      startsTime: data.startsTime || new Date(),
      endsTime: data.endsTime
    },
    select: basicNoticeSelect
  });
};

/**
 * Update a notice.
 * @param noticeId - Notice ID
 * @param data - Update data
 * @returns Updated notice
 */
export const updateNotice = async (noticeId: string, data: NoticeUpdateData) => {
  return prisma.notice.update({
    where: { uid: noticeId },
    data,
    select: basicNoticeSelect
  });
};

/**
 * Delete a notice.
 * @param noticeId - Notice ID
 * @returns Deleted notice
 */
export const deleteNotice = async (noticeId: string) => {
  return prisma.notice.delete({
    where: { uid: noticeId },
    select: basicNoticeSelect
  });
};

// ================================
// Notice Query Operations
// ================================

/**
 * Find notice by ID.
 * @param noticeId - Notice ID
 * @returns Notice or null
 */
export const findNoticeById = async (noticeId: string) => {
  return prisma.notice.findUnique({
    where: { uid: noticeId },
    select: noticeWithReadsSelect
  });
};

/**
 * Get active notices with pagination.
 * @param params - Query parameters
 * @returns Notices and total count
 */
export const getActiveNotices = async (params: NoticeParams = {}) => {
  const {
    page = 1,
    limit = 10,
    active = true
  } = params;

  const skip = (page - 1) * limit;
  const now = new Date();

  // Build where conditions
  const where: any = {};
  
  if (active) {
    where.AND = [
      { startsTime: { lte: now } },
      {
        OR: [
          { endsTime: null },
          { endsTime: { gte: now } }
        ]
      }
    ];
  }

  const [notices, totalCount] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdTime: 'desc' },
      select: noticeWithReadsSelect
    }),
    prisma.notice.count({ where })
  ]);

  return { 
    notices, 
    totalCount,
    hasMore: skip + notices.length < totalCount
  };
};

/**
 * Get all notices (admin).
 * @param params - Query parameters
 * @returns All notices with pagination
 */
export const getAllNotices = async (params: NoticeParams = {}) => {
  const {
    page = 1,
    limit = 10
  } = params;

  const skip = (page - 1) * limit;

  const [notices, totalCount] = await Promise.all([
    prisma.notice.findMany({
      skip,
      take: limit,
      orderBy: { createdTime: 'desc' },
      select: noticeWithReadsSelect
    }),
    prisma.notice.count()
  ]);

  return { 
    notices, 
    totalCount,
    hasMore: skip + notices.length < totalCount
  };
};

/**
 * Mark notice as read by user.
 * @param noticeId - Notice ID
 * @param userId - User ID
 * @returns Read record
 */
export const markNoticeAsRead = async (noticeId: string, userId: string) => {
  return prisma.noticeRead.upsert({
    where: {
      noticeId_userId: {
        noticeId,
        userId
      }
    },
    update: {
      readTime: new Date()
    },
    create: {
      noticeId,
      userId,
      readTime: new Date()
    }
  });
};

/**
 * Check if user has read a notice.
 * @param noticeId - Notice ID
 * @param userId - User ID
 * @returns Boolean indicating if read
 */
export const hasUserReadNotice = async (noticeId: string, userId: string): Promise<boolean> => {
  const read = await prisma.noticeRead.findUnique({
    where: {
      noticeId_userId: {
        noticeId,
        userId
      }
    }
  });
  
  return !!read;
};

/**
 * Get unread notices for user.
 * @param userId - User ID
 * @returns Unread notices
 */
export const getUnreadNoticesForUser = async (userId: string) => {
  const now = new Date();
  
  return prisma.notice.findMany({
    where: {
      AND: [
        { startsTime: { lte: now } },
        {
          OR: [
            { endsTime: null },
            { endsTime: { gte: now } }
          ]
        },
        {
          NOT: {
            reads: {
              some: {
                userId
              }
            }
          }
        }
      ]
    },
    orderBy: { createdTime: 'desc' },
    select: basicNoticeSelect
  });
};

/**
 * Get notices with read status for user.
 * @param userId - User ID
 * @param params - Query parameters
 * @returns Notices with read status
 */
export const getNoticesWithReadStatus = async (userId: string, params: NoticeParams = {}) => {
  const {
    page = 1,
    limit = 10,
    active = true
  } = params;

  const skip = (page - 1) * limit;
  const now = new Date();

  // Build where conditions
  const where: any = {};
  
  if (active) {
    where.AND = [
      { startsTime: { lte: now } },
      {
        OR: [
          { endsTime: null },
          { endsTime: { gte: now } }
        ]
      }
    ];
  }

  const [notices, totalCount] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdTime: 'desc' },
      select: {
        ...basicNoticeSelect,
        reads: {
          where: { userId },
          select: { readTime: true }
        }
      }
    }),
    prisma.notice.count({ where })
  ]);

  // Transform to include read status
  const noticesWithStatus = notices.map(notice => ({
    ...notice,
    isRead: notice.reads.length > 0,
    readTime: notice.reads[0]?.readTime || null,
    reads: undefined // Remove reads array from response
  }));

  return { 
    notices: noticesWithStatus, 
    totalCount,
    hasMore: skip + notices.length < totalCount
  };
};

// ================================
// Statistics Operations
// ================================

/**
 * Get notice statistics.
 * @returns Notice statistics
 */
export const getNoticeStats = async () => {
  const now = new Date();
  
  const [
    totalNotices,
    activeNotices,
    totalReads,
    recentNotices
  ] = await Promise.all([
    // Total notices
    prisma.notice.count(),
    
    // Active notices
    prisma.notice.count({
      where: {
        AND: [
          { startsTime: { lte: now } },
          {
            OR: [
              { endsTime: null },
              { endsTime: { gte: now } }
            ]
          }
        ]
      }
    }),
    
    // Total reads
    prisma.noticeRead.count(),
    
    // Recent notices (last 7 days)
    prisma.notice.count({
      where: {
        createdTime: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Get read statistics for active notices
  const activeNoticesWithReads = await prisma.notice.findMany({
    where: {
      AND: [
        { startsTime: { lte: now } },
        {
          OR: [
            { endsTime: null },
            { endsTime: { gte: now } }
          ]
        }
      ]
    },
    select: {
      uid: true,
      _count: {
        select: { reads: true }
      }
    }
  });

  const avgReadsPerNotice = activeNoticesWithReads.length > 0
    ? activeNoticesWithReads.reduce((sum, n) => sum + n._count.reads, 0) / activeNoticesWithReads.length
    : 0;

  return {
    total: totalNotices,
    active: activeNotices,
    inactive: totalNotices - activeNotices,
    totalReads,
    recent: recentNotices,
    avgReadsPerNotice: Math.round(avgReadsPerNotice)
  };
};