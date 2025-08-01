import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db/prisma';
import { safeBody } from '@/utils/parse/body';

interface LikeRequest {
  postId: string;
  action: 'like' | 'unlike';
}

interface LikeResponse {
  success: boolean;
  liked: boolean;
  likeCount: number;
}

// POST handler for like/unlike actions
async function handleLikeAction(
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult<LikeResponse>> {
  try {
    const body = await safeBody<LikeRequest>(request);
    const { postId, action } = body;

    if (!postId || !['like', 'unlike'].includes(action)) {
      return {
        success: false,
        message: 'Invalid request parameters',
      };
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { uid: postId },
      select: { uid: true, likeCount: true },
    });

    if (!post) {
      return {
        success: false,
        message: 'Post not found',
      };
    }

    const userId = context.userId!;
    let liked = false;
    let likeCount = post.likeCount;

    if (action === 'like') {
      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (!existingLike) {
        // Create like and increment count in a transaction
        await prisma.$transaction([
          prisma.like.create({
            data: {
              userId,
              postId,
            },
          }),
          prisma.post.update({
            where: { uid: postId },
            data: { likeCount: { increment: 1 } },
          }),
        ]);
        liked = true;
        likeCount += 1;
      } else {
        // Already liked
        liked = true;
      }
    } else {
      // Unlike action
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existingLike) {
        // Delete like and decrement count in a transaction
        await prisma.$transaction([
          prisma.like.delete({
            where: {
              userId_postId: {
                userId,
                postId,
              },
            },
          }),
          prisma.post.update({
            where: { uid: postId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);
        liked = false;
        likeCount -= 1;
      } else {
        // Not liked
        liked = false;
      }
    }

    return {
      success: true,
      data: {
        success: true,
        liked,
        likeCount: Math.max(0, likeCount), // Ensure non-negative
      },
    };
  } catch (error) {
    // POST /api/post/like error
    return {
      success: false,
      message: 'Failed to process like action',
    };
  }
}

// GET handler to check like status
async function checkLikeStatus(
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult<{ liked: boolean; likeCount: number }>> {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return {
        success: false,
        message: 'Post ID is required',
      };
    }

    // Get post with like status
    const post = await prisma.post.findUnique({
      where: { uid: postId },
      select: { 
        likeCount: true,
        likes: {
          where: {
            userId: context.userId!,
          },
          select: {
            uid: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        message: 'Post not found',
      };
    }

    return {
      success: true,
      data: {
        liked: post.likes.length > 0,
        likeCount: post.likeCount,
      },
    };
  } catch (error) {
    // GET /api/post/like error
    return {
      success: false,
      message: 'Failed to check like status',
    };
  }
}

// Export handlers with authentication required
export const POST = handler(handleLikeAction, {
  auth: true,
  limit: true,
});

export const GET = handler(checkLikeStatus, {
  auth: true,
  limit: true,
});