import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db/prisma';

interface LikeDetailResponse {
  postId: string;
  postTitle: string;
  totalLikes: number;
  uniqueUsers: number;
  anonymousLikes: number;
  likes: Array<{
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    ip: string;
    likedAt: Date;
    isAnonymous: boolean;
  }>;
  likesByDate: Array<{
    date: string;
    count: number;
  }>;
  likesByHour: Array<{
    hour: number;
    count: number;
  }>;
}

async function handleGetPostLikes(
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult<LikeDetailResponse>> {
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

    // 상세 좋아요 기록 가져오기
    const likes = await prisma.like.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    // 날짜별 좋아요 통계 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const likesByDate = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM likes 
      WHERE post_id = ${uid} 
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // 시간대별 좋아요 통계 (24시간)
    const likesByHour = await prisma.$queryRaw<Array<{ hour: bigint; count: bigint }>>`
      SELECT 
        EXTRACT(hour FROM created_at) as hour,
        COUNT(*) as count
      FROM likes 
      WHERE post_id = ${uid}
      GROUP BY EXTRACT(hour FROM created_at)
      ORDER BY hour
    `;

    // 통계 계산
    const totalLikes = likes.length;
    const uniqueUsers = new Set(likes.map(l => l.userId)).size;
    const anonymousLikes = 0; // Like model doesn't support anonymous likes

    return {
      success: true,
      data: {
        postId: uid,
        postTitle: post.title,
        totalLikes,
        uniqueUsers,
        anonymousLikes,
        likes: likes.map(like => ({
          id: like.uid,
          userId: like.userId,
          userName: like.user?.name || null,
          userEmail: like.user?.email || null,
          ip: 'N/A', // Like model doesn't track IP
          likedAt: like.createdAt,
          isAnonymous: false // All likes are from logged-in users
        })),
        likesByDate: likesByDate.map(item => ({
          date: item.date,
          count: Number(item.count)
        })),
        likesByHour: Array.from({ length: 24 }, (_, hour) => {
          const found = likesByHour.find(item => Number(item.hour) === hour);
          return {
            hour,
            count: found ? Number(found.count) : 0
          };
        })
      }
    };
  } catch (error) {
    console.error('Error fetching post likes:', error);
    return {
      success: false,
      message: 'Failed to fetch post likes'
    };
  }
}

export const GET = handler(handleGetPostLikes, {
  auth: true,
  roles: ['admin', 'editor']
});