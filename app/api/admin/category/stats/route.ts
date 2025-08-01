import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import * as CategoryDB from '@/lib/db/category';

/* ------------------------------------------------------------------
 * GET /api/admin/category/stats
 * Get category statistics
 * ---------------------------------------------------------------- */
const getCategoryStats = async (
  _request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const stats = await CategoryDB.getCategoryStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: 'NetworkError' };
  }
};

/* ------------------------------------------------------------------
 * Export handler
 * ---------------------------------------------------------------- */
export const GET = handler(getCategoryStats, {
  auth: true,
  roles: ['admin']
});