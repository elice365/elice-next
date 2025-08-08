import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db/prisma';
import { safeBody } from '@/utils/parse/body';
import { trackPostView } from '@/lib/db/views';
import { logger } from '@/lib/services/logger';

// Types for blog post API
type PostImages = string[] | Record<string, string> | string;

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
    images: PostImages;
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
    images: PostImages;
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
    data: Record<string, unknown>;
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
    logger.error('Error fetching CDN content', 'CDN_FETCH', error);
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
    logger.info('📝 POST /api/post request body', 'API', body);
    const { type } = body;

    switch (type) {
      case 'list':
        return handlePostList(body as PostListRequest, context);
      
      case 'post':
        return handlePostDetail(body as PostDetailRequest, context, request);
      
      case 'notice':
        return handleNoticeList(body as NoticeListRequest, context);
      
      default:
        return {
          success: false,
          message: 'Invalid request type',
        };
    }
  } catch (error) {
    logger.error('❌ POST /api/post error', 'API', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process request',
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
  const where: Record<string, unknown> = {
    type: { not: 'notice' }, // Exclude notices
    status: 'published', // Only show published posts to users
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

  // Build orderBy (views 컬럼 제거로 인해 views 정렬 비활성화)
  let orderBy: Record<string, 'asc' | 'desc'> = { createdTime: 'desc' }; // Default to latest
  if (body.sortBy === 'popular') {
    orderBy = { likeCount: 'desc' };
  }
  // views 정렬은 컬럼 제거로 비활성화 - createdTime 사용

  // Fetch posts with pagination (views calculated from PostView relationship)
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
        _count: {
          select: {
            view: true, // PostView 관계에서 자동 계산
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Transform posts to include isLiked flag and calculated views
  const transformedPosts = posts.map((post) => ({
    ...post,
    images: post.images as PostImages,
    category: post.category || undefined, // Convert null to undefined
    views: (post as { _count: { view: number } })._count.view, // PostView 관계에서 계산된 조회수
    isLiked: context.userId ? ((post as { likes?: Array<{ uid: string }> }).likes?.length ?? 0) > 0 : false,
    likes: undefined, // Remove likes array from response
    _count: undefined, // Remove _count from response
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
  context: AuthInfo,
  request: NextRequest
): Promise<APIResult<PostDetailResponse>> {
  const { uid, language = 'ko' } = body;

  // Fetch post details (with calculated views)
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
      _count: {
        select: {
          view: true, // PostView 관계에서 자동 계산
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

  // Check if post is published (only admins/editors can view drafts)
  const hasAdminRole = context.roles?.includes('admin') || context.roles?.includes('editor');
  if (post.status !== 'published' && !hasAdminRole) {
    return {
      success: false,
      message: 'Post not found',
    };
  }

  // Track view with duplicate checking using real client info from cookie
  const deviceInfoCookie = request.cookies.get('deviceInfo');
  logger.info('🍪 Device info cookie', 'API', deviceInfoCookie?.value);
  
  if (deviceInfoCookie) {
    try {
      const { ipAddress, userAgent } = JSON.parse(deviceInfoCookie.value);
      logger.info('📱 Parsed device info', 'API', { ipAddress, userAgent, userId: context.userId });
      
      // Track view asynchronously (includes duplicate check and view increment)
      const trackResult = await trackPostView({
        postId: uid,
        userId: context.userId || null,
        ip: ipAddress,
        userAgent: userAgent,
      });
      
      logger.info('📊 Track result', 'API', trackResult ? 'View counted' : 'Duplicate view');
    } catch (error) {
      logger.error('Failed to parse device info cookie', 'API', error);
    }
  } else {
    logger.info('❌ No device info cookie found', 'API');
  }

  // Fetch content from CDN
  const content = await fetchCDNContent(uid, language);

  // Transform post to include isLiked flag and calculated views
  const transformedPost = {
    ...post,
    images: post.images as PostImages,
    category: post.category || undefined, // Convert null to undefined
    views: post._count.view, // PostView 관계에서 계산된 조회수
    isLiked: context.userId ? ((post.likes as Array<{ uid: string }> | false) !== false && post.likes.length > 0) : false,
    likes: undefined, // Remove likes array from response
    _count: undefined, // Remove _count from response
  };

  return {
    success: true,
    data: {
      post: transformedPost,
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
  const transformedNotices = notices.map((notice) => ({
    uid: notice.uid,
    title: notice.title,
    content: notice.content,
    link: notice.link || undefined,
    startsTime: notice.startsTime!,
    endsTime: notice.endsTime || undefined,
    createdTime: notice.createdTime!,
    isRead: context.userId ? ((notice as { reads?: Array<{ readTime: Date }> }).reads?.length ?? 0) > 0 : false,
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
      case 'categories': {
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
      }

      case 'tags': {
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
      }

      default:
        return {
          success: false,
          message: 'Invalid request type',
        };
    }
  } catch (error) {
    logger.error('POST request processing failed', 'POST_REQUEST', error);
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