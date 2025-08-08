import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { logger } from '@/lib/services/logger';

interface RouteParams {
  params: Promise<{
    uid: string;
  }>;
}

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]/status
 * Update blog post status (publish/unpublish)
 * ---------------------------------------------------------------- */
const updateBlogPostStatus = async (
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
    const { status } = body;

    if (!status || !['draft', 'published'].includes(status)) {
      return setMessage('InvalidField', null, 400);
    }

    // Update blog post status
    await BlogDB.updateBlogPostStatus(uid, status);

    const result = {
      success: true,
      message: status === 'published' ? '글이 게시되었습니다.' : '글이 비공개 처리되었습니다.'
    };

    return setRequest(result);

  } catch (error) {
    logger.error('Blog post status update failed', 'UPDATE_STATUS', error);
    return setMessage('NetworkError', 'Status update failed', 500);
  }
};

/* ------------------------------------------------------------------
 * Export handler
 * ---------------------------------------------------------------- */
export const PUT = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => updateBlogPostStatus(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};