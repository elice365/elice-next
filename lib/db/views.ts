import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/services/logger';

interface ViewTrackingData {
  postId: string;
  userId?: string | null;
  ip: string;
  userAgent: string;
}

/**
 * 중복 조회 확인 함수
 * 로그인 시: postId + userId + ip + userAgent 조합 체크
 * 비로그인 시: postId + ip + userAgent 조합 체크
 */
export async function checkViewExists(data: ViewTrackingData): Promise<boolean> {
  try {
    // 24시간 이내 조회 기록 확인
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // 로그인 사용자: userId만으로 중복 체크 (IP 무관)
    // 비로그인 사용자: IP + UserAgent로 중복 체크
    const whereCondition = data.userId ? {
      postId: data.postId,
      userId: data.userId,
      viewedAt: {
        gte: oneDayAgo, // 24시간 이내
      },
    } : {
      postId: data.postId,
      ip: data.ip,
      userAgent: data.userAgent,
      userId: null, // 명시적으로 null 체크
      viewedAt: {
        gte: oneDayAgo, // 24시간 이내
      },
    };

    const existingView = await prisma.postView.findFirst({
      where: whereCondition,
    });

    return !!existingView;
  } catch (error) {
    logger.error('Error checking view exists', 'DB', error);
    return false; // 에러 시 중복이 아닌 것으로 처리
  }
}

/**
 * 새로운 조회 기록 생성 (관계형 자동 계산 방식)
 */
export async function trackPostView(data: ViewTrackingData): Promise<boolean> {
  try {
    logger.info('🔍 Tracking view for', 'DB', data);

    // 트랜잭션 내에서 락을 걸고 순차 처리
    const result = await prisma.$transaction(async (tx) => {
      // 24시간 이내 조회 기록 확인 (트랜잭션 내에서)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      // 로그인 사용자: userId만으로 중복 체크 (IP 무관)
      // 비로그인 사용자: IP + UserAgent로 중복 체크
      const whereCondition = data.userId ? {
        postId: data.postId,
        userId: data.userId,
        viewedAt: {
          gte: oneDayAgo,
        },
      } : {
        postId: data.postId,
        ip: data.ip,
        userAgent: data.userAgent,
        userId: null, // 명시적으로 null 체크
        viewedAt: {
          gte: oneDayAgo,
        },
      };

      // 트랜잭션 내에서 중복 확인
      const existingView = await tx.postView.findFirst({
        where: whereCondition,
      });

      if (existingView) {
        logger.info('⏭️ Duplicate view found, skipping', 'DB');
        return false; // 이미 조회한 기록이 있음
      }

      logger.info('✅ New view, recording...', 'DB');

      // PostView 기록만 생성 (views는 관계형으로 자동 계산됨)
      const postView = await tx.postView.create({
        data: {
          postId: data.postId,
          userId: data.userId || null,
          ip: data.ip,
          userAgent: data.userAgent,
        },
      });
      logger.info('📝 PostView created', 'DB', postView.id);

      return true; // 성공적으로 조회 기록 생성
    });

    if (result) {
      logger.info('🎉 View tracking completed successfully', 'DB');
    }
    return result;
  } catch (error) {
    logger.error('❌ Error tracking post view', 'DB', error);
    return false;
  }
}

/**
 * 특정 포스트의 조회 통계 조회
 */
export async function getPostViewStats(postId: string) {
  try {
    const stats = await prisma.postView.groupBy({
      by: ['postId'],
      where: {
        postId: postId,
      },
      _count: {
        id: true,
      },
    });

    // 고유 IP 수 계산
    const uniqueIps = await prisma.postView.findMany({
      where: { postId },
      select: { ip: true },
      distinct: ['ip'],
    });

    // 로그인 사용자 수 계산
    const uniqueUsers = await prisma.postView.findMany({
      where: { 
        postId,
        userId: { not: null }
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return {
      totalViews: stats[0]?._count.id || 0,
      uniqueIps: uniqueIps.length,
      uniqueUsers: uniqueUsers.length,
    };
  } catch (error) {
    logger.error('Error getting post view stats', 'DB', error);
    return {
      totalViews: 0,
      uniqueIps: 0,
      uniqueUsers: 0,
    };
  }
}