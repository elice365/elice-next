import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface AdminCategoryParams {
  page: number;
  limit: number;
  search?: string;
  level?: number;
  parent?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryCreateData {
  code: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface CategoryUpdateData {
  code?: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
}

// ================================
// Common Select Patterns
// ================================

const basicCategorySelect = {
  uid: true,
  code: true,
  name: true,
  slug: true,
  path: true,
  level: true,
  parentId: true
};

const categoryWithRelationsSelect = {
  ...basicCategorySelect,
  parent: {
    select: {
      uid: true,
      name: true,
      code: true
    }
  },
  _count: {
    select: {
      children: true,
      posts: true
    }
  }
};

// ================================
// Helper Functions
// ================================

/**
 * Generate category path based on parent.
 * @param parentId - Parent category ID
 * @param slug - Category slug
 * @returns Generated path
 */
export const generatePath = async (parentId: string | null, slug: string): Promise<string> => {
  if (!parentId) {
    return `/${slug}`;
  }

  const parent = await prisma.category.findUnique({
    where: { uid: parentId },
    select: { path: true }
  });

  if (!parent) {
    throw new Error('Parent category not found');
  }

  return `${parent.path}/${slug}`;
};

/**
 * Calculate category level based on parent.
 * @param parentId - Parent category ID
 * @returns Category level
 */
export const calculateLevel = async (parentId: string | null): Promise<number> => {
  if (!parentId) {
    return 0;
  }

  const parent = await prisma.category.findUnique({
    where: { uid: parentId },
    select: { level: true }
  });

  if (!parent) {
    throw new Error('Parent category not found');
  }

  return parent.level + 1;
};

/**
 * Update children paths and levels recursively.
 * @param categoryUid - Category ID
 * @param newPath - New path
 * @param newLevel - New level
 */
export const updateChildrenPathsAndLevels = async (
  categoryUid: string,
  newPath: string,
  newLevel: number
): Promise<void> => {
  const children = await prisma.category.findMany({
    where: { parentId: categoryUid },
    select: { uid: true, slug: true }
  });

  for (const child of children) {
    const childNewPath = `${newPath}/${child.slug}`;
    const childNewLevel = newLevel + 1;
    
    await prisma.category.update({
      where: { uid: child.uid },
      data: { 
        path: childNewPath,
        level: childNewLevel
      }
    });

    // Recursively update grandchildren
    await updateChildrenPathsAndLevels(child.uid, childNewPath, childNewLevel);
  }
};

// ================================
// Category CRUD Operations
// ================================

/**
 * Create a new category.
 * @param data - Category data
 * @returns Created category
 */
export const createCategory = async (data: CategoryCreateData) => {
  const { code, name, slug, parentId } = data;

  // Check if code already exists
  const existingCode = await prisma.category.findUnique({
    where: { code }
  });

  if (existingCode) {
    throw new Error('Category code already exists');
  }

  // Validate parent if provided
  if (parentId) {
    const parentExists = await prisma.category.findUnique({
      where: { uid: parentId }
    });

    if (!parentExists) {
      throw new Error('Parent category not found');
    }
  }

  // Generate path and calculate level
  const path = await generatePath(parentId || null, slug);
  const level = await calculateLevel(parentId || null);

  // Check if path already exists
  const existingPath = await prisma.category.findFirst({
    where: { path }
  });

  if (existingPath) {
    throw new Error('Category path already exists');
  }

  return prisma.category.create({
    data: {
      code,
      name,
      slug,
      path,
      level,
      parentId: parentId || null
    },
    select: categoryWithRelationsSelect
  });
};

// Helper functions to reduce complexity
const validateCategoryCode = async (code: string, categoryId: string) => {
  const existingCode = await prisma.category.findFirst({
    where: { 
      code: code,
      uid: { not: categoryId }
    }
  });

  if (existingCode) {
    throw new Error('Category code already exists');
  }
};

const validateParentCategory = async (
  parentId: string | null, 
  categoryId: string, 
  currentPath: string
) => {
  if (!parentId) return;
  
  if (parentId === categoryId) {
    throw new Error('Category cannot be its own parent');
  }

  const parentExists = await prisma.category.findUnique({
    where: { uid: parentId },
    select: { path: true }
  });

  if (!parentExists) {
    throw new Error('Parent category not found');
  }

  if (parentExists.path.startsWith(currentPath + '/')) {
    throw new Error('Cannot set descendant as parent');
  }
};

const prepareUpdateData = (
  data: CategoryUpdateData,
  currentCategory: { slug: string; parentId: string | null }
) => {
  const updateData: Record<string, unknown> = {};
  let needsPathUpdate = false;
  let needsLevelUpdate = false;

  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  
  if (data.slug !== undefined && data.slug !== currentCategory.slug) {
    updateData.slug = data.slug;
    needsPathUpdate = true;
  }

  if (data.parentId !== undefined && data.parentId !== currentCategory.parentId) {
    updateData.parentId = data.parentId;
    needsPathUpdate = true;
    needsLevelUpdate = true;
  }

  return { updateData, needsPathUpdate, needsLevelUpdate };
};

const updatePathAndLevel = async (
  data: CategoryUpdateData,
  currentCategory: { slug: string; parentId: string | null; path: string },
  categoryId: string,
  updateData: Record<string, unknown>,
  needsPathUpdate: boolean,
  needsLevelUpdate: boolean
) => {
  if (needsPathUpdate) {
    const newSlug = data.slug || currentCategory.slug;
    const newParentId = data.parentId !== undefined ? data.parentId : currentCategory.parentId;
    
    const newPath = await generatePath(newParentId, newSlug);
    
    const existingPath = await prisma.category.findFirst({
      where: { 
        path: newPath,
        uid: { not: categoryId }
      }
    });

    if (existingPath) {
      throw new Error('Category path already exists');
    }

    updateData.path = newPath;
  }

  if (needsLevelUpdate) {
    const newParentId = data.parentId !== undefined ? data.parentId : currentCategory.parentId;
    updateData.level = await calculateLevel(newParentId);
  }

  return updateData;
};

/**
 * Update a category.
 * @param categoryId - Category ID
 * @param data - Update data
 * @returns Updated category
 */
export const updateCategory = async (categoryId: string, data: CategoryUpdateData) => {
  const currentCategory = await prisma.category.findUnique({
    where: { uid: categoryId }
  });

  if (!currentCategory) {
    throw new Error('Category not found');
  }

  // Validate code change
  if (data.code && data.code !== currentCategory.code) {
    await validateCategoryCode(data.code, categoryId);
  }

  // Validate parent change
  if (data.parentId !== undefined) {
    await validateParentCategory(data.parentId, categoryId, currentCategory.path);
  }

  // Prepare update data
  const { updateData, needsPathUpdate, needsLevelUpdate } = prepareUpdateData(
    data,
    currentCategory
  );

  // Update path and level if needed
  const finalUpdateData = await updatePathAndLevel(
    data,
    currentCategory,
    categoryId,
    updateData,
    needsPathUpdate,
    needsLevelUpdate
  );

  // Update category in transaction
  return await prisma.$transaction(async (tx) => {
    const category = await tx.category.update({
      where: { uid: categoryId },
      data: finalUpdateData,
      select: categoryWithRelationsSelect
    });

    // Update children if path or level changed
    if (needsPathUpdate || needsLevelUpdate) {
      await updateChildrenPathsAndLevels(categoryId, category.path, category.level);
    }

    return category;
  });
};

/**
 * Delete a category.
 * @param categoryId - Category ID
 * @returns Deleted category
 */
export const deleteCategory = async (categoryId: string) => {
  // Get category with counts
  const category = await prisma.category.findUnique({
    where: { uid: categoryId },
    include: {
      _count: {
        select: {
          children: true,
          posts: true
        }
      }
    }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Check if category has posts
  if (category._count.posts > 0) {
    throw new Error(`Cannot delete category with ${category._count.posts} posts`);
  }

  // Check if category has children
  if (category._count.children > 0) {
    throw new Error(`Cannot delete category with ${category._count.children} subcategories`);
  }

  return prisma.category.delete({
    where: { uid: categoryId },
    select: basicCategorySelect
  });
};

/**
 * Delete multiple categories.
 * @param categoryIds - Array of category IDs
 * @returns Delete result
 */
export const deleteBulkCategories = async (categoryIds: string[]) => {
  // Get all categories to delete (including children)
  const categoriesToDelete = await prisma.category.findMany({
    where: {
      uid: { in: categoryIds }
    },
    select: {
      uid: true,
      path: true,
      name: true,
      _count: {
        select: {
          posts: true
        }
      }
    }
  });

  // Find all categories that are descendants of the selected categories
  const allCategoriesToDelete = categoriesToDelete.filter(cat => {
    return categoryIds.includes(cat.uid) || categoryIds.some(id => {
      const parent = categoriesToDelete.find(p => p.uid === id);
      return parent && cat.path.startsWith(parent.path + '/');
    });
  });

  // Check if any categories have posts
  const categoriesWithPosts = allCategoriesToDelete.filter(cat => cat._count.posts > 0);
  if (categoriesWithPosts.length > 0) {
    throw new Error(
      `Cannot delete categories with posts: ${categoriesWithPosts.map(c => c.name).join(', ')}`
    );
  }

  // Delete categories (children first)
  const sortedCategories = allCategoriesToDelete.sort((a, b) => b.path.length - a.path.length);
  
  return await prisma.$transaction(async (tx) => {
    let deletedCount = 0;
    for (const category of sortedCategories) {
      await tx.category.delete({
        where: { uid: category.uid }
      });
      deletedCount++;
    }
    return { count: deletedCount };
  });
};

// ================================
// Category Query Operations
// ================================

/**
 * Find category by ID.
 * @param categoryId - Category ID
 * @returns Category or null
 */
export const findCategoryById = async (categoryId: string) => {
  return prisma.category.findUnique({
    where: { uid: categoryId },
    select: categoryWithRelationsSelect
  });
};

/**
 * Get category by ID with full details.
 * @param categoryId - Category ID
 * @returns Category with full details
 */
export const getCategoryById = async (categoryId: string) => {
  return prisma.category.findUnique({
    where: { uid: categoryId },
    include: {
      parent: {
        select: {
          uid: true,
          name: true,
          code: true
        }
      },
      children: {
        select: {
          uid: true,
          name: true,
          code: true,
          level: true
        },
        orderBy: { name: 'asc' }
      },
      _count: {
        select: {
          children: true,
          posts: true
        }
      }
    }
  });
};

/**
 * Get admin categories with pagination and filters.
 * @param params - Admin query parameters
 * @returns Categories and total count
 */
export const getAdminCategories = async (params: AdminCategoryParams) => {
  const {
    page,
    limit,
    search,
    level,
    parent,
    sortBy = 'path',
    sortOrder = 'asc'
  } = params;

  const skip = (page - 1) * limit;

  // Build where conditions
  const whereCondition: Record<string, any> = {};

  if (search) {
    whereCondition.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (level !== undefined) {
    whereCondition.level = level;
  }

  if (parent === 'null') {
    whereCondition.parentId = null;
  } else if (parent) {
    whereCondition.parentId = parent;
  }

  // Query categories
  const [categories, totalCount] = await Promise.all([
    prisma.category.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: [
        { level: 'asc' },
        { [sortBy]: sortOrder }
      ],
      select: categoryWithRelationsSelect
    }),
    prisma.category.count({ where: whereCondition })
  ]);

  return { categories, totalCount };
};

// ================================
// Statistics Operations
// ================================

/**
 * Get category statistics.
 * @returns Category statistics
 */
export const getCategoryStats = async () => {
  const [
    totalCategories,
    topLevelCategories,
    categoryLevels,
    categoriesWithPosts,
    topCategories
  ] = await Promise.all([
    // Total categories
    prisma.category.count(),
    
    // Top level categories (level 0)
    prisma.category.count({
      where: { level: 0 }
    }),
    
    // Category levels distribution
    prisma.category.groupBy({
      by: ['level'],
      _count: true,
      orderBy: { level: 'asc' }
    }),
    
    // Categories with their post counts
    prisma.category.findMany({
      select: {
        uid: true,
        name: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    }),
    
    // Top categories for filter options
    prisma.category.findMany({
      where: { level: 0 },
      select: {
        uid: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' },
      take: 20
    })
  ]);

  // Calculate derived stats
  const totalPosts = categoriesWithPosts.reduce((sum, cat) => sum + cat._count.posts, 0);
  const avgPostsPerCategory = totalCategories > 0 ? Math.round(totalPosts / totalCategories * 10) / 10 : 0;
  const topLevelPercent = totalCategories > 0 ? Math.round((topLevelCategories / totalCategories) * 100) : 0;
  const maxLevel = categoryLevels.length > 0 ? Math.max(...categoryLevels.map(l => l.level)) : 0;

  // Categories by level for additional insights
  const levelDistribution = categoryLevels.map(level => ({
    level: level.level,
    count: level._count
  }));

  // Most active categories (with most posts)
  const mostActiveCategories = categoriesWithPosts
    .sort((a, b) => b._count.posts - a._count.posts)
    .slice(0, 5)
    .map(cat => ({
      uid: cat.uid,
      name: cat.name,
      postCount: cat._count.posts
    }));

  // Categories without posts
  const emptyCategoriesCount = categoriesWithPosts.filter(cat => cat._count.posts === 0).length;

  return {
    // Basic counts
    total: totalCategories,
    thisMonth: 0, // No timestamp field available in Category model
    topLevel: topLevelCategories,
    topLevelPercent,
    
    // Post-related stats
    totalPosts,
    avgPostsPerCategory,
    emptyCategoriesCount,
    
    // Level distribution
    maxLevel,
    levelDistribution,
    
    // Active categories
    mostActiveCategories,
    
    // For filters
    topCategories
  };
};

/**
 * Get all categories.
 * @returns Category list
 */
export const getAllCategories = async () => {
  return prisma.category.findMany({
    select: {
      uid: true,
      code: true,
      name: true,
      slug: true,
      path: true,
      level: true,
      parentId: true,
      _count: {
        select: { posts: true }
      }
    },
    orderBy: [
      { level: 'asc' },
      { path: 'asc' }
    ]
  });
};