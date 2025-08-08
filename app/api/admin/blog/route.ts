import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { logger } from '@/lib/services/logger';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const sortBy = searchParams.get('sortBy') || 'createdTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

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
        status: post.status || 'draft',
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
    logger.error('블로그 목록 조회 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
};

/* ------------------------------------------------------------------
 * POST /api/admin/blog
 * Create new blog post
 * ---------------------------------------------------------------- */
const createBlogPost = async (
  request: NextRequest,
  context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const {
      type = 'post',
      title,
      description,
      categoryId,
      tags = [],
      images,
      status = 'draft'
    } = body;

    // Validate required fields
    if (!title || !description) {
      return setMessage('InvalidField', null, 400);
    }

    // Create URL slug from title
    const url = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create blog post
    const newPost = await BlogDB.createBlogPost({
      type,
      title,
      description,
      url,
      images: images || {},
      categoryId,
      status
    }, tags);

    const result = {
      success: true,
      message: '블로그 글이 생성되었습니다.',
      post: newPost
    };

    return setRequest(result);

  } catch (error) {
    logger.error('블로그 글 생성 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]
 * Update blog post
 * ---------------------------------------------------------------- */
const updateBlogPost = async (
  request: NextRequest,
  context: AuthInfo
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
      message: '블로그 글이 수정되었습니다.',
      post: updatedPost
    };

    return setRequest(result);

  } catch (error) {
    logger.error('블로그 글 수정 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
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
      message: `${deleteResult.count}개의 글이 삭제되었습니다.`,
      deletedCount: deleteResult.count
    };

    return setRequest(result);

  } catch (error) {
    logger.error('블로그 글 삭제 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
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