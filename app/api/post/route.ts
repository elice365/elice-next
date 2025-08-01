import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db/prisma';
import { safeBody } from '@/utils/parse/body';

// Types for blog post API
interface PostListRequest {
  type: 'list';
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'views';
}

interface PostDetailRequest {
  type: 'post';
  uid: string;
  language?: string;
}

interface NoticeListRequest {
  type: 'notice';
  page?: number;
  limit?: number;
}

interface PostListResponse {
  posts: Array<{
    uid: string;
    type: string;
    title: string;
    description: string;
    url: string;
    images: any;
    views: number;
    likeCount: number;
    createdTime: Date;
    category?: {
      name: string;
      slug: string;
    };
    tags: Array<{
      name: string;
    }>;
    isLiked?: boolean;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

interface PostDetailResponse {
  post: {
    uid: string;
    type: string;
    title: string;
    description: string;
    url: string;
    images: any;
    views: number;
    likeCount: number;
    createdTime: Date;
    category?: {
      name: string;
      slug: string;
    };
    tags: Array<{
      name: string;
    }>;
    isLiked?: boolean;
  };
  content?: {
    language: string;
    data: any;
  };
}

interface NoticeListResponse {
  notices: Array<{
    uid: string;
    title: string;
    content: string;
    link?: string;
    startsTime: Date;
    endsTime?: Date;
    createdTime: Date;
    isRead?: boolean;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

// Helper function to fetch content from CDN
async function fetchCDNContent(uid: string, language: string = 'ko') {
  try {
    const cdnUrl = `https://cdn.elice.pro/post/${uid}/${language}.json`;
    const response = await fetch(cdnUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      // CDN content fetch failed with status: ${response.status}
      return null;
    }
    
    const data = await response.json();
    return {
      language,
      data,
    };
  } catch (error) {
    // Error fetching CDN content
    return null;
  }
}

// POST handler with type-based routing
async function handlePostRequest(
  request: NextRequest, 
  context: AuthInfo
): Promise<APIResult<PostListResponse | PostDetailResponse | NoticeListResponse>> {
  try {
    const body = await safeBody(request);
    const { type } = body;

    switch (type) {
      case 'list':
        return handlePostList(body as PostListRequest, context);
      
      case 'post':
        return handlePostDetail(body as PostDetailRequest, context);
      
      case 'notice':
        return handleNoticeList(body as NoticeListRequest, context);
      
      default:
        return {
          success: false,
          message: 'Invalid request type',
        };
    }
  } catch (error) {
    // POST /api/post error
    return {
      success: false,
      message: 'Failed to process request',
    };
  }
}

// Handle post list request
async function handlePostList(
  body: PostListRequest,
  context: AuthInfo
): Promise<APIResult<PostListResponse>> {
  const page = Math.max(1, body.page || 1);
  const limit = Math.min(50, Math.max(1, body.limit || 10));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    type: { not: 'notice' }, // Exclude notices
  };

  if (body.category) {
    where.category = {
      slug: body.category,
    };
  }

  if (body.tag) {
    where.tags = {
      some: {
        name: body.tag,
      },
    };
  }

  if (body.search) {
    where.OR = [
      { title: { contains: body.search, mode: 'insensitive' } },
      { description: { contains: body.search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy
  let orderBy: any = { createdTime: 'desc' }; // Default to latest
  if (body.sortBy === 'popular') {
    orderBy = { likeCount: 'desc' };
  } else if (body.sortBy === 'views') {
    orderBy = { views: 'desc' };
  }

  // Fetch posts with pagination
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
        likes: context.userId ? {
          where: {
            userId: context.userId,
          },
          select: {
            uid: true,
          },
        } : false,
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Transform posts to include isLiked flag
  const transformedPosts = posts.map((post: any) => ({
    ...post,
    isLiked: context.userId ? (post.likes as any[]).length > 0 : false,
    likes: undefined, // Remove likes array from response
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: {
      posts: transformedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
      },
    },
  };
}

// Handle post detail request
async function handlePostDetail(
  body: PostDetailRequest,
  context: AuthInfo
): Promise<APIResult<PostDetailResponse>> {
  const { uid, language = 'ko' } = body;

  // Fetch post details
  const post = await prisma.post.findUnique({
    where: { uid },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
      likes: context.userId ? {
        where: {
          userId: context.userId,
        },
        select: {
          uid: true,
        },
      } : false,
    },
  });

  if (!post) {
    return {
      success: false,
      message: 'Post not found',
    };
  }

  // Increment view count asynchronously
  prisma.post.update({
    where: { uid },
    data: { views: { increment: 1 } },
  }).catch((error: any) => {
    // Failed to increment view count
  });

  // Track detailed view if user is logged in
  if (context.userId) {
    prisma.postView.create({
      data: {
        postId: uid,
        userId: context.userId,
        ip: context.deviceInfo.ipAddress,
        userAgent: context.deviceInfo.userAgent,
      },
    }).catch((error: any) => {
      // Failed to track post view
    });
  }

  // Fetch content from CDN
  const content = await fetchCDNContent(uid, language);

  // Transform post to include isLiked flag
  const transformedPost = {
    ...post,
    isLiked: context.userId ? (post.likes as any[]).length > 0 : false,
    likes: undefined, // Remove likes array from response
  };

  return {
    success: true,
    data: {
      post: {
        ...transformedPost,
        category: transformedPost.category || undefined
      } as any,
      content: content || undefined,
    },
  };
}

// Handle notice list request
async function handleNoticeList(
  body: NoticeListRequest,
  context: AuthInfo
): Promise<APIResult<NoticeListResponse>> {
  const page = Math.max(1, body.page || 1);
  const limit = Math.min(50, Math.max(1, body.limit || 10));
  const skip = (page - 1) * limit;

  const now = new Date();

  // Build where clause for active notices
  const where = {
    startsTime: { lte: now },
    OR: [
      { endsTime: null },
      { endsTime: { gte: now } },
    ],
  };

  // Fetch notices with pagination
  const [notices, totalCount] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsTime: 'desc' },
      include: {
        reads: context.userId ? {
          where: {
            userId: context.userId,
          },
          select: {
            readTime: true,
          },
        } : false,
      },
    }),
    prisma.notice.count({ where }),
  ]);

  // Transform notices to include isRead flag
  const transformedNotices = notices.map((notice: any) => ({
    uid: notice.uid,
    title: notice.title,
    content: notice.content,
    link: notice.link,
    startsTime: notice.startsTime!,
    endsTime: notice.endsTime,
    createdTime: notice.createdTime!,
    isRead: context.userId ? (notice.reads as any[]).length > 0 : false,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: {
      notices: transformedNotices,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
      },
    },
  };
}

// Export handlers with authentication
export const POST = handler(handlePostRequest, {
  auth: false, // Allow public access, but include auth info if available
  limit: true,
});

// GET handler for fetching categories and tags
async function handleGetRequest(
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult<any>> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'categories':
        const categories = await prisma.category.findMany({
          orderBy: { name: 'asc' },
          select: {
            uid: true,
            code: true,
            name: true,
            slug: true,
            path: true,
            level: true,
            _count: {
              select: {
                posts: true,
              },
            },
          },
        });
        
        return {
          success: true,
          data: { categories },
        };

      case 'tags':
        const tags = await prisma.tag.findMany({
          orderBy: { name: 'asc' },
          select: {
            uid: true,
            name: true,
            _count: {
              select: {
                posts: true,
              },
            },
          },
        });
        
        return {
          success: true,
          data: { tags },
        };

      default:
        return {
          success: false,
          message: 'Invalid request type',
        };
    }
  } catch (error) {
    // GET /api/post error
    return {
      success: false,
      message: 'Failed to process request',
    };
  }
}

export const GET = handler(handleGetRequest, {
  auth: false,
  limit: true,
});