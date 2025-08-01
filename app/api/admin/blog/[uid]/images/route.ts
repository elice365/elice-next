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
 * GET /api/admin/blog/[uid]/images
 * Get all images for a blog post from R2
 * ---------------------------------------------------------------- */
const getImages = async (
  request: NextRequest,
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

    // In production, this would list files from Cloudflare R2
    // For now, return sample data or empty array
    // TODO: Implement actual R2 list operation
    
    const images: string[] = [];

    const result = {
      images
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
    (req: NextRequest, authContext: AuthInfo) => getImages(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};