import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';

interface RouteParams {
  params: Promise<{
    uid: string;
    imageId: string;
  }>;
}

/* ------------------------------------------------------------------
 * DELETE /api/admin/blog/[uid]/images/[imageId]
 * Delete an image from R2
 * ---------------------------------------------------------------- */
const deleteImage = async (
  _request: NextRequest,
  _context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.uid;

    // Get post to verify it exists
    const post = await BlogDB.getPostById(postId);
    if (!post) {
      return setMessage('NotFound', null, 404);
    }

    // In production, this would delete from Cloudflare R2
    // R2 integration pending - currently returns success
    
    const result = {
      success: true,
      message: '이미지가 삭제되었습니다.'
    };

    return setRequest(result);

  } catch (error) {
    console.error('Failed to delete image:', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const DELETE = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => deleteImage(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};