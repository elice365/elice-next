import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { uploadJsonToR2, getFromR2, deleteFromR2 } from '@/lib/services/cloudflare/r2';
import { logger } from '@/lib/services/logger';

interface RouteParams {
  params: Promise<{
    uid: string;
  }>;
}

/* ------------------------------------------------------------------
 * GET /api/admin/blog/[uid]/content
 * Get blog content (for loading existing content)
 * ---------------------------------------------------------------- */
const getContent = async (
  request: NextRequest,
  _context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.uid;
    const language = request.nextUrl.searchParams.get('language') || 'ko';

    // Get post metadata from database
    const post = await BlogDB.getPostById(postId);
    if (!post) {
      return setMessage('NotFound', null, 404);
    }

    // Try to fetch content from R2
    const cdnPath = `post/${post.uid}/${language}.json`;
    
    try {
      const r2Content = await getFromR2(cdnPath);
      if (r2Content.success && r2Content.body) {
        const content = JSON.parse(r2Content.body);
        
        const result = {
          post: {
            id: post.uid,
            title: post.title,
            url: post.url
          },
          content,
          cdnUrl: `https://cdn.elice.pro/${cdnPath}`
        };
        
        return setRequest(result);
      }
    } catch (error) {
      // Content doesn't exist yet, return empty template
      logger.debug('Content not found in R2, returning empty template', 'R2');
    }
    
    // Return empty content template if not found
    const result = {
      post: {
        id: post.uid,
        title: post.title,
        url: post.url
      },
      content: {
        product: [],
        author: {
          name: '',
          description: '',
          profileImage: ''
        },
        content: []
      },
      cdnUrl: `https://cdn.elice.pro/${cdnPath}`
    };

    return setRequest(result);

  } catch (error) {
    logger.error('Failed to get blog content', 'BlogContent', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]/content
 * Save blog content (would save to CDN in production)
 * ---------------------------------------------------------------- */
const saveContent = async (
  request: NextRequest,
  _context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.uid;
    const body = await request.json();
    const { language, content } = body;

    if (!language || !content) {
      return setMessage('InvalidField', null, 400);
    }

    // Get post to ensure it exists
    const post = await BlogDB.getPostById(postId);
    if (!post) {
      return setMessage('NotFound', null, 404);
    }

    // Validate content structure
    if (!content.product || !content.author || !content.content) {
      return setMessage('InvalidField', 'Invalid content structure - product, author, and content fields are required', 400);
    }

    // Validate author structure
    if (!content.author.name || !content.author.description) {
      return setMessage('InvalidField', 'Author must have name and description', 400);
    }

    // Validate product array
    if (!Array.isArray(content.product)) {
      return setMessage('InvalidField', 'Product must be an array', 400);
    }

    // Validate content array
    if (!Array.isArray(content.content)) {
      return setMessage('InvalidField', 'Content must be an array', 400);
    }

    // Upload to Cloudflare R2
    const cdnPath = `post/${post.uid}/${language}.json`;
    
    try {
      const uploadResult = await uploadJsonToR2(content, cdnPath);
      
      if (!uploadResult.success) {
        return setMessage('NetworkError', 'Failed to upload content to CDN', 500);
      }
      
      const result = {
        message: '콘텐츠가 성공적으로 저장되었습니다.',
        cdnPath,
        cdnUrl: uploadResult.url
      };

      return setRequest(result);
      
    } catch (error) {
      logger.error('Failed to upload to R2', 'R2', error);
      return setMessage('NetworkError', 'Failed to upload content to CDN', 500);
    }

  } catch (error) {
    logger.error('Failed to save blog content', 'BlogContent', error);
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/blog/[uid]/content
 * Delete blog content for a specific language
 * ---------------------------------------------------------------- */
const deleteContent = async (
  request: NextRequest,
  _context: AuthInfo,
  { params }: RouteParams
): Promise<APIResult> => {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.uid;
    const language = request.nextUrl.searchParams.get('language') || 'ko';

    // Get post to ensure it exists
    const post = await BlogDB.getPostById(postId);
    if (!post) {
      return setMessage('NotFound', null, 404);
    }

    // Delete from R2
    const cdnPath = `post/${post.uid}/${language}.json`;
    
    try {
      await deleteFromR2(cdnPath);
      
      const result = {
        message: `${language} 언어의 콘텐츠가 삭제되었습니다.`,
        language
      };

      return setRequest(result);
      
    } catch (error) {
      // If file doesn't exist, still return success
      logger.debug('Error deleting from R2', 'R2', error);
      if ((error as any)?.Code === 'NoSuchKey') {
        const result = {
          message: `${language} 언어의 콘텐츠가 이미 없습니다.`,
          language
        };
        return setRequest(result);
      }
      
      logger.error('Failed to delete from R2', 'R2', error);
      return setMessage('NetworkError', 'Failed to delete content from CDN', 500);
    }

  } catch (error) {
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => getContent(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};

export const PUT = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => saveContent(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};

export const DELETE = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => deleteContent(req, authContext, routeContext),
    { auth: true, roles: ['admin'] }
  )(request);
};