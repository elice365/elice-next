import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { logger } from '@/lib/services/logger';
import { PAGINATION_DEFAULTS } from '@/constants/admin/pagination';
import { BLOG_DEFAULTS, BLOG_STATUS, URL_SLUG_REGEX } from '@/constants/admin/blog';
import { ADMIN_MESSAGES } from '@/constants/admin/responses';

/* ------------------------------------------------------------------
 * GET /api/admin/blog
 * Admin blog post list (pagination, search, filtering)
 * ---------------------------------------------------------------- */
const getBlogPosts = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || PAGINATION_DEFAULTS.PAGE.toString(), 10);
    const limit = parseInt(searchParams.get('limit') || PAGINATION_DEFAULTS.LIMIT.toString(), 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const sortBy = searchParams.get('sortBy') || PAGINATION_DEFAULTS.SORT_BY;
    const sortOrder = (searchParams.get('sortOrder') || PAGINATION_DEFAULTS.SORT_ORDER) as 'asc' | 'desc';

    // Get blog posts from DB
    const { posts, totalCount } = await BlogDB.getAdminBlogPosts({
      page,
      limit,
      search,
      category,
      status,
      type,
      sortBy,
      sortOrder
    });

    // Format response
    const formattedPosts = posts.map((post: any) => {
      return {
        ...post,
        id: post.uid, // Map uid to id for frontend compatibility
        status: post.status || BLOG_DEFAULTS.STATUS,
        views: post._count?.view || 0, // PostView 테이블에서 계산된 조회수
        likeCount: post.likeCount || 0
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    };

    return setRequest(result);

  } catch (error) {
    logger.error(ADMIN_MESSAGES.BLOG_LIST_ERROR, 'API', error);
    return { success: false, message: ADMIN_MESSAGES.SERVER_ERROR };
  }
};

/* ------------------------------------------------------------------
 * POST /api/admin/blog
 * Create new blog post
 * ---------------------------------------------------------------- */
const createBlogPost = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const {
      type = BLOG_DEFAULTS.TYPE,
      title,
      description,
      url: providedUrl,
      categoryId,
      tags = BLOG_DEFAULTS.TAGS,
      images,
      status = BLOG_DEFAULTS.STATUS,
      publishedAt
    } = body;

    // Validate required fields
    if (!title || !description) {
      return setMessage('InvalidField', null, 400);
    }

    // Use provided URL or create URL slug from title
    const url = providedUrl || title
      .toLowerCase()
      .replace(URL_SLUG_REGEX.NORMALIZE, '-')
      .replace(URL_SLUG_REGEX.TRIM, '');

    // Prepare post data
    const postData: any = {
      type,
      title,
      description,
      url,
      images: images || {},
      categoryId,
      status
    };

    // Add publishedAt if provided and status is published
    if (publishedAt && status === BLOG_STATUS.PUBLISHED) {
      postData.publishedAt = new Date(publishedAt);
    } else if (status === BLOG_STATUS.PUBLISHED && !publishedAt) {
      postData.publishedAt = new Date();
    }

    // Create blog post
    const newPost = await BlogDB.createBlogPost(postData, tags);

    const result = {
      success: true,
      message: ADMIN_MESSAGES.BLOG_CREATED,
      post: newPost
    };

    return setRequest(result);

  } catch (error) {
    logger.error(ADMIN_MESSAGES.BLOG_CREATE_ERROR, 'API', error);
    return { success: false, message: ADMIN_MESSAGES.SERVER_ERROR };
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]
 * Update blog post
 * ---------------------------------------------------------------- */
const updateBlogPost = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { uid } = body; // Extract uid from body since it's not in URL path for this route

    if (!uid) {
      return setMessage('InvalidField', null, 400);
    }

    const {
      type,
      title,
      description,
      categoryId,
      tags,
      images,
      status
    } = body;

    // Update blog post
    const updatedPost = await BlogDB.updateBlogPost(
      uid,
      {
        type,
        title,
        description,
        images,
        categoryId,
        status
      },
      tags
    );

    const result = {
      success: true,
      message: ADMIN_MESSAGES.BLOG_UPDATED,
      post: updatedPost
    };

    return setRequest(result);

  } catch (error) {
    logger.error(ADMIN_MESSAGES.BLOG_UPDATE_ERROR, 'API', error);
    return { success: false, message: ADMIN_MESSAGES.SERVER_ERROR };
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/blog
 * Delete multiple blog posts
 * ---------------------------------------------------------------- */
const deleteBlogPosts = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { postIds } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return setMessage('InvalidField', null, 400);
    }

    // Delete blog posts
    const deleteResult = await BlogDB.deleteBulkBlogPosts(postIds);

    const result = {
      success: true,
      message: ADMIN_MESSAGES.BLOG_BULK_DELETED(deleteResult.count),
      deletedCount: deleteResult.count
    };

    return setRequest(result);

  } catch (error) {
    logger.error(ADMIN_MESSAGES.BLOG_DELETE_ERROR, 'API', error);
    return { success: false, message: ADMIN_MESSAGES.SERVER_ERROR };
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = handler(getBlogPosts, {
  auth: true,
  roles: ['admin']
});

export const POST = handler(createBlogPost, {
  auth: true,
  roles: ['admin']
});

export const PUT = handler(updateBlogPost, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteBlogPosts, {
  auth: true,
  roles: ['admin']
});