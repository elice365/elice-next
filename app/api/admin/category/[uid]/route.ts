import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import * as CategoryDB from '@/lib/db/category';
import { categoryValidation } from '@/utils/regex/admin';
import { logger } from '@/lib/services/logger';

/* ------------------------------------------------------------------
 * GET /api/admin/category/[uid]
 * Get single category
 * ---------------------------------------------------------------- */
const getCategory = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { uid } = await context.params;
    
    const category = await CategoryDB.getCategoryById(uid);

    if (!category) {
      return { success: false, message: 'NotFoundData' };
    }

    const result = {
      category
    };

    return { success: true, data: result };

  } catch (error) {
    logger.error('카테고리 조회 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
};

/* ------------------------------------------------------------------
 * PUT /api/admin/category/[uid]
 * Update category
 * ---------------------------------------------------------------- */
const updateCategory = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { uid } = await context.params;
    const body = await request.json();
    const { code, name, slug, parentId } = body;

    // Validate format if provided
    if (code && !categoryValidation.code.test(code)) {
      return { success: false, message: 'InvalidField' };
    }

    if (slug && !categoryValidation.slug.test(slug)) {
      return { success: false, message: 'InvalidField' };
    }

    // Update category
    try {
      const updatedCategory = await CategoryDB.updateCategory(uid, {
        code,
        name,
        slug,
        parentId
      });

      const result = {
        success: true,
        message: '카테고리가 수정되었습니다.',
        category: updatedCategory
      };

      return { success: true, data: result };
    } catch (error: any) {
      if (error.message === 'Category not found') {
        return { success: false, message: 'NotFoundData' };
      }
      if (error.message.includes('already exists')) {
        return { success: false, message: 'DuplicateField' };
      }
      if (error.message.includes('Cannot set')) {
        return { success: false, message: 'BadRequest' };
      }
      if (error.message.includes('own parent')) {
        return { success: false, message: 'BadRequest' };
      }
      throw error;
    }

  } catch (error) {
    logger.error('카테고리 수정 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
};

/* ------------------------------------------------------------------
 * DELETE /api/admin/category/[uid]
 * Delete single category
 * ---------------------------------------------------------------- */
const deleteCategory = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> => {
  try {
    const { uid } = await context.params;

    // Delete category
    try {
      await CategoryDB.deleteCategory(uid);

      const result = {
        success: true,
        message: '카테고리가 삭제되었습니다.'
      };

      return { success: true, data: result };
    } catch (error: any) {
      if (error.message === 'Category not found') {
        return { success: false, message: 'NotFoundData' };
      }
      if (error.message.includes('Cannot delete')) {
        return { success: false, message: 'BadRequest' };
      }
      throw error;
    }

  } catch (error) {
    logger.error('카테고리 삭제 실패', 'API', error);
    return { success: false, message: '서버 오류가 발생했습니다' };
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const GET = handler(getCategory, {
  auth: true,
  roles: ['admin']
});

export const PUT = handler(updateCategory, {
  auth: true,
  roles: ['admin']
});

export const DELETE = handler(deleteCategory, {
  auth: true,
  roles: ['admin']
});