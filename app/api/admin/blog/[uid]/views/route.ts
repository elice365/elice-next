import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/services/logger';

interface ViewDetailResponse {
  postId: string;
  postTitle: string;
  totalViews: number;
  uniqueUsers: number;
  anonymousViews: number;
  views: Array<{
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    ip: string;
    userAgent: string;
    viewedAt: Date;
    isAnonymous: boolean;
  }>;
  viewsByDate: Array<{
    date: string;
    count: number;
  }>;
  viewsByHour: Array<{
    hour: number;
    count: number;
  }>;
}

async function handleGetPostViews(
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult<ViewDetailResponse>> {
  try {
    // Next.js 15에서는 URL에서 직접 파라미터 추출
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const uidIndex = pathSegments.indexOf('blog') + 1;
    const uid = pathSegments[uidIndex];
    
    if (!uid) {
      return {
        success: false,
        message: 'Post ID is required'
      };
    }
    
    // 게시글 정보 조회
    const post = await prisma.post.findUnique({
      where: { uid },
      select: { uid: true, title: true }
    });

    if (!post) {
      return {
        success: false,
        message: 'Post not found'
      };
    }

    // 상세 조회 기록 가져오기
    const views = await prisma.postView.findMany({
      where: { postId: uid },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    });

    // 날짜별 조회수 통계 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as count
      FROM post_views 
      WHERE post_id = ${uid} 
        AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
    `;

    // 시간대별 조회수 통계 (24시간)
    const viewsByHour = await prisma.$queryRaw<Array<{ hour: bigint; count: bigint }>>`
      SELECT 
        EXTRACT(hour FROM viewed_at) as hour,
        COUNT(*) as count
      FROM post_views 
      WHERE post_id = ${uid}
      GROUP BY EXTRACT(hour FROM viewed_at)
      ORDER BY hour
    `;

    // 통계 계산
    const totalViews = views.length;
    const uniqueUsers = new Set(views.filter(v => v.userId).map(v => v.userId)).size;
    const anonymousViews = views.filter(v => !v.userId).length;

    return {
      success: true,
      data: {
        postId: uid,
        postTitle: post.title,
        totalViews,
        uniqueUsers,
        anonymousViews,
        views: views.map(view => ({
          id: view.id,
          userId: view.userId,
          userName: view.user?.name || null,
          userEmail: view.user?.email || null,
          ip: view.ip || 'Unknown',
          userAgent: view.userAgent || 'Unknown',
          viewedAt: view.viewedAt,
          isAnonymous: !view.userId
        })),
        viewsByDate: viewsByDate.map(item => ({
          date: item.date,
          count: Number(item.count)
        })),
        viewsByHour: Array.from({ length: 24 }, (_, hour) => {
          const found = viewsByHour.find(item => Number(item.hour) === hour);
          return {
            hour,
            count: found ? Number(found.count) : 0
          };
        })
      }
    };
  } catch (error) {
    logger.error('Error fetching post views', 'API', error);
    return {
      success: false,
      message: 'Failed to fetch post views'
    };
  }
}

export const GET = handler(handleGetPostViews, {
  auth: true,
  roles: ['admin', 'editor']
});