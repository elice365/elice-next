import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/blog/stats
 * Get blog statistics for admin dashboard
 * ---------------------------------------------------------------- */
const getBlogStats = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    // Get blog statistics
    const stats = await BlogDB.getBlogStats();
    
    // Get all categories for filter options
    const categories = await BlogDB.getAllCategories();

    const result = {
      ...stats,
      categories: categories.map(cat => ({
        uid: cat.uid,
        name: cat.name,
        count: cat._count.posts
      }))
    };

    return setRequest(result);

  } catch (error) {
    logger.error('Blog stats fetch failed', 'STATS', error);
    return setMessage('NetworkError', 'Failed to fetch blog statistics', 500);
  }
};

/* ------------------------------------------------------------------
 * Export handler
 * ---------------------------------------------------------------- */
export const GET = handler(getBlogStats, {
  auth: true,
  roles: ['admin']
});