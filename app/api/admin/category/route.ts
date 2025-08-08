import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import * as CategoryDB from '@/lib/db/category';
import { categoryValidation } from '@/utils/regex/admin';

/* ------------------------------------------------------------------
 * GET /api/admin/category
 * Admin category list (pagination, search, filtering)
 * ---------------------------------------------------------------- */
const getCategories = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level');
    const parent = searchParams.get('parent') || '';
    
    // Get categories from DB
    const { categories, totalCount } = await CategoryDB.getAdminCategories({
      page,
      limit,
      search,
      level: level !== null && level !== '' ? parseInt(level, 10) : undefined,
      parent
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);

    const result = {
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    };

    return { success: true, data: result };

  } catch (error) {
    return { success: false, message: 'NetworkError' };
  }
};

/* ------------------------------------------------------------------
 * POST /api/admin/category
 * Create new category
 * ---------------------------------------------------------------- */
const createCategory = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { code, name, slug, parentId } = body;

    // Validate required fields
    if (!code || !name || !slug) {
      return { success: false, message: 'InvalidField' };
    }

    // Validate format
    if (!categoryValidation.code.test(code)) {
      return { success: false, message: 'InvalidField' };
    }

    if (!categoryValidation.slug.test(slug)) {
      return { success: false, message: 'InvalidField' };
    }

    // Create category
    try {
      const newCategory = await CategoryDB.createCategory({
        code,
        name,
        slug,
        parentId
      });

      const result = {
        success: true,
        message: '카테고리가 생성되었습니다.',
        category: newCategory
      };

      return { success: true, data: result };
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return { success: false, message: 'DuplicateField' };
      }
      if (error.message.includes('not found')) {
        return { success: false, message: 'NotFoundData' };
      }
      throw error;
    }

  } catch (error) {
    return { success: false, message: 'NetworkError' };
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/category
 * Delete multiple categories
 * ---------------------------------------------------------------- */
const deleteCategories = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const body = await request.json();
    const { categoryIds } = body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return { success: false, message: 'InvalidField' };
    }

    // Delete categories
    try {
      const deleteResult = await CategoryDB.deleteBulkCategories(categoryIds);

      const result = {
        success: true,
        message: `${deleteResult.count}개의 카테고리가 삭제되었습니다.`,
        deletedCount: deleteResult.count
      };

      return { success: true, data: result };
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        return { success: false, message: 'BadRequest' };
      }
      throw error;
    }

  } catch (error) {
    return { success: false, message: 'NetworkError' };
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = handler(getCategories, {
  auth: true,
  roles: ['admin']
});

export const POST = handler(createCategory, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteCategories, {
  auth: true,
  roles: ['admin']
});