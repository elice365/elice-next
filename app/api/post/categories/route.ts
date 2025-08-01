import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';

/* ------------------------------------------------------------------
 * GET /api/post/categories
 * Get all blog categories
 * ---------------------------------------------------------------- */
const getCategories = async (
  request: NextRequest
): Promise<APIResult> => {
  try {
    // Get all categories
    const categories = await BlogDB.getAllCategories();
    
    // Format response
    const formattedCategories = categories.map(cat => ({
      uid: cat.uid,
      code: cat.code,
      name: cat.name,
      slug: cat.slug,
      path: cat.path,
      level: cat.level,
      postCount: cat._count.posts
    }));

    const result = {
      categories: formattedCategories
    };

    return setRequest(result);

  } catch (error) {
    return setMessage('NetworkError', null, 500);
  }
};

/* ------------------------------------------------------------------
 * Export handler
 * ---------------------------------------------------------------- */
export const GET = handler(getCategories, {
  auth: false // Public endpoint
});