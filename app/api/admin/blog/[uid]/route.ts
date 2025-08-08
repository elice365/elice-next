import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';

interface RouteParams {
  params: Promise<{
    uid: string;
  }>;
}

/* ------------------------------------------------------------------
 * GET /api/admin/blog/[uid]
 * Get single blog post
 * ---------------------------------------------------------------- */
const getBlogPost = async (
  request: NextRequest,
  context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const { uid } = resolvedParams;

    if (!uid) {
      return setMessage('InvalidField', null, 400);
    }

    const post = await BlogDB.findBlogPostById(uid);

    if (!post) {
      return setMessage('NotFound', null, 404);
    }

    return setRequest({ post });

  } catch (error) {
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]
 * Update blog post
 * ---------------------------------------------------------------- */
const updateBlogPost = async (
  request: NextRequest,
  context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const { uid } = resolvedParams;
    
    if (!uid) {
      return setMessage('InvalidField', null, 400);
    }

    const body = await request.json();
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
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/blog/[uid]
 * Delete single blog post
 * ---------------------------------------------------------------- */
const deleteBlogPost = async (
  request: NextRequest,
  context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const { uid } = resolvedParams;

    if (!uid) {
      return setMessage('InvalidField', null, 400);
    }

    await BlogDB.deleteBlogPost(uid);

    const result = {
      success: true,
      message: '블로그 글이 삭제되었습니다.'
    };

    return setRequest(result);

  } catch (error) {
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => getBlogPost(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};

export const PUT = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => updateBlogPost(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};

export const DELETE = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => deleteBlogPost(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};