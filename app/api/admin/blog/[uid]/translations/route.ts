import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import { prisma } from '@/lib/db';
import * as BlogDB from '@/lib/db/blog';
import { logger } from '@/lib/services/logger';
import type { APIRouteParams as RouteParams } from '@/types/api/routes';

/* ------------------------------------------------------------------
 * GET /api/admin/blog/[uid]/translations
 * Get blog post translations
 * ---------------------------------------------------------------- */
const getTranslations = async (
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

    // Get translations for the blog post
    const translations = await prisma.postTranslation.findMany({
      where: {
        postId: uid
      },
      select: {
        id: true,
        locale: true,
        title: true,
        description: true,
        content: true,
        createdTime: true,
        updatedTime: true
      },
      orderBy: {
        locale: 'asc'
      }
    });

    return setRequest({ translations });

  } catch (error) {
    logger.error('Failed to get translations', 'TRANSLATIONS', { 
      error, 
      postId: (await params).uid 
    });
    return setMessage('NetworkError', '번역 정보를 불러오는데 실패했습니다', 500);
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/blog/[uid]/translations
 * Update or create translations
 * ---------------------------------------------------------------- */
const updateTranslations = async (
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
    const { translations } = body;

    if (!translations || typeof translations !== 'object') {
      return setMessage('InvalidField', '번역 데이터가 올바르지 않습니다', 400);
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { uid }
    });

    if (!post) {
      return setMessage('NotFound', '게시글을 찾을 수 없습니다', 404);
    }

    // Update or create translations for each locale
    const results = [];
    for (const [locale, data] of Object.entries(translations)) {
      if (data && typeof data === 'object') {
        const translationData = data as { title: string; description: string; content?: string };
        
        // Skip if no title and description
        if (!translationData.title || !translationData.description) {
          continue;
        }

        const result = await BlogDB.upsertPostTranslation(
          uid,
          locale,
          {
            title: translationData.title,
            description: translationData.description,
            content: translationData.content || null
          }
        );
        
        results.push(result);
      }
    }

    logger.info('Translations updated', 'TRANSLATIONS', { 
      postId: uid,
      locales: results.map(r => r.locale),
      userId: context.userId
    });

    return setRequest({
      message: '번역이 저장되었습니다',
      translations: results
    });

  } catch (error) {
    logger.error('Failed to update translations', 'TRANSLATIONS', { 
      error, 
      postId: (await params).uid 
    });
    return setMessage('NetworkError', '번역 저장에 실패했습니다', 500);
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/blog/[uid]/translations
 * Delete translations for specific locales
 * ---------------------------------------------------------------- */
const deleteTranslations = async (
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
    const { locales } = body;

    if (!locales || !Array.isArray(locales)) {
      return setMessage('InvalidField', '삭제할 언어를 지정해주세요', 400);
    }

    // Delete specified translations
    const result = await prisma.postTranslation.deleteMany({
      where: {
        postId: uid,
        locale: {
          in: locales
        }
      }
    });

    logger.info('Translations deleted', 'TRANSLATIONS', { 
      postId: uid,
      locales,
      count: result.count,
      userId: context.userId
    });

    return setRequest({
      message: `${result.count}개의 번역이 삭제되었습니다`,
      deletedCount: result.count
    });

  } catch (error) {
    logger.error('Failed to delete translations', 'TRANSLATIONS', { 
      error, 
      postId: (await params).uid 
    });
    return setMessage('NetworkError', '번역 삭제에 실패했습니다', 500);
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => getTranslations(req, authContext, routeContext),
    { auth: true, roles: ['admin', 'manager', 'editor'] }
  )(request);
};

export const PUT = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => updateTranslations(req, authContext, routeContext),
    { auth: true, roles: ['admin', 'manager', 'editor'] }
  )(request);
};

export const DELETE = async (request: NextRequest, routeContext: RouteParams) => {
  return handler(
    (req: NextRequest, authContext: AuthInfo) => deleteTranslations(req, authContext, routeContext),
    { auth: true, roles: ['admin', 'manager'] }
  )(request);
};