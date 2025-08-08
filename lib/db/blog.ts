import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface AdminBlogParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BlogCreateData {
  type: string;
  title: string;
  description: string;
  url?: string;
  images: string[] | Record<string, string> | string;
  categoryId?: string;
  status?: 'draft' | 'published';
  publishedAt?: Date;
}

export interface BlogUpdateData {
  type?: string;
  title?: string;
  description?: string;
  url?: string;
  images?: string[] | Record<string, string> | string;
  categoryId?: string;
  status?: 'draft' | 'published';
  publishedAt?: Date;
}

// ================================
// Common Select Patterns
// ================================

const basicBlogSelect = {
  uid: true,
  type: true,
  title: true,
  description: true,
  url: true,
  images: true,
  status: true,
  publishedAt: true,
  likeCount: true,
  createdTime: true,
  updatedTime: true
};

const blogWithRelationsSelect = {
  ...basicBlogSelect,
  category: {
    select: {
      uid: true,
      code: true,
      name: true,
      slug: true
    }
  },
  tags: {
    select: {
      uid: true,
      name: true
    }
  },
  _count: {
    select: {
      likes: true,
      view: true
    }
  }
};

// ================================
// Blog CRUD Operations
// ================================

/**
 * Create a new blog post.
 * @param data - Blog post data
 * @returns Created blog post
 */
export const createBlogPost = async (data: BlogCreateData, tagNames?: string[]) => {
  // If published status, set publishedAt
  if (data.status === 'published' && !data.publishedAt) {
    data.publishedAt = new Date();
  }

  // Create tags if provided
  const tags = tagNames ? {
    connectOrCreate: tagNames.map(name => ({
      where: { name },
      create: { name }
    }))
  } : undefined;

  // Ensure url is provided (required field in schema)
  const createData: any = {
    type: data.type,
    title: data.title,
    description: data.description,
    url: data.url || data.title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-'),
    images: data.images,
    status: data.status || 'draft',
    publishedAt: data.publishedAt || null,
    categoryId: data.categoryId || null,
    likeCount: 0
  };

  // Add tags if provided
  if (tags) {
    createData.tags = tags;
  }

  return prisma.post.create({
    data: createData,
    select: blogWithRelationsSelect
  });
};

/**
 * Update a blog post.
 * @param postId - Post ID
 * @param data - Update data
 * @param tagNames - Tag names to update
 * @returns Updated blog post
 */
export const updateBlogPost = async (
  postId: string, 
  data: BlogUpdateData,
  tagNames?: string[]
) => {
  // Handle publishedAt for status changes
  if (data.status === 'published') {
    const post = await prisma.post.findUnique({
      where: { uid: postId },
      select: { publishedAt: true }
    });
    
    if (!post?.publishedAt) {
      data.publishedAt = new Date();
    }
  } else if (data.status === 'draft') {
    data.publishedAt = undefined;
  }

  // Handle tags if provided
  const tags = tagNames ? {
    set: [], // Clear existing tags
    connectOrCreate: tagNames.map(name => ({
      where: { name },
      create: { name }
    }))
  } : undefined;

  return prisma.post.update({
    where: { uid: postId },
    data: {
      ...data,
      tags
    },
    select: blogWithRelationsSelect
  });
};

/**
 * Update blog post status (publish/unpublish).
 * @param postId - Post ID
 * @param status - New status
 * @returns Update result
 */
export const updateBlogPostStatus = async (postId: string, status: 'draft' | 'published') => {
  const data: BlogUpdateData = {
    status,
    publishedAt: status === 'published' ? new Date() : undefined
  };

  return prisma.post.update({
    where: { uid: postId },
    data,
    select: basicBlogSelect
  });
};

/**
 * Delete a blog post.
 * @param postId - Post ID
 * @returns Deleted blog post
 */
export const deleteBlogPost = async (postId: string) => {
  return prisma.post.delete({
    where: { uid: postId },
    select: basicBlogSelect
  });
};

/**
 * Delete multiple blog posts.
 * @param postIds - Array of post IDs
 * @returns Delete result
 */
export const deleteBulkBlogPosts = async (postIds: string[]) => {
  return prisma.post.deleteMany({
    where: {
      uid: {
        in: postIds
      }
    }
  });
};

// ================================
// Blog Query Operations
// ================================

/**
 * Find blog post by ID.
 * @param postId - Post ID
 * @returns Blog post or null
 */
export const findBlogPostById = async (postId: string) => {
  return prisma.post.findUnique({
    where: { uid: postId },
    select: blogWithRelationsSelect
  });
};

/**
 * Get post by ID (alias for findBlogPostById).
 * @param postId - Post ID
 * @returns Blog post or null
 */
export const getPostById = async (postId: string) => {
  return findBlogPostById(postId);
};

/**
 * Find blog posts with pagination and filters.
 * @param params - Query parameters
 * @returns Blog posts and total count
 */
export const findBlogPosts = async (params: {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  status?: 'draft' | 'published';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 10,
    category,
    type,
    status,
    search,
    sortBy = 'createdTime',
    sortOrder = 'desc'
  } = params;

  const skip = (page - 1) * limit;

  // Build where conditions
  const where: Record<string, any> = {};

  if (category) {
    where.categoryId = category;
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: blogWithRelationsSelect
    }),
    prisma.post.count({ where })
  ]);

  return { posts, totalCount };
};

// ================================
// Admin Operations
// ================================

/**
 * Get admin blog posts with pagination and filters.
 * @param params - Admin query parameters
 * @returns Blog posts and total count
 */
export const getAdminBlogPosts = async (params: AdminBlogParams) => {
  const {
    page,
    limit,
    search,
    category,
    status,
    type,
    sortBy = 'createdTime',
    sortOrder = 'desc'
  } = params;

  const skip = (page - 1) * limit;

  // Build where conditions
  const whereCondition: Record<string, any> = {};

  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (category) {
    whereCondition.categoryId = category;
  }

  if (status) {
    whereCondition.status = status;
  }

  if (type) {
    whereCondition.type = type;
  }

  // Query posts
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: blogWithRelationsSelect
    }),
    prisma.post.count({ where: whereCondition })
  ]);

  // Get actual view counts for each post
  const postsWithViews = await Promise.all(
    posts.map(async (post) => {
      const viewCount = await prisma.postView.count({
        where: { postId: post.uid }
      });
      
      return {
        ...post,
        _count: {
          ...post._count,
          view: viewCount
        }
      };
    })
  );

  return { posts: postsWithViews, totalCount };
};

// ================================
// Statistics Operations
// ================================

/**
 * Get blog statistics.
 * @returns Blog statistics
 */
export const getBlogStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalViews,
    totalLikes,
    todayViews,
    todayLikes,
    thisMonthPosts,
    categories,
    postsByType
  ] = await Promise.all([
    // Total posts
    prisma.post.count(),
    
    // Published posts
    prisma.post.count({
      where: { status: 'published' }
    }),
    
    // Draft posts
    prisma.post.count({
      where: { status: 'draft' }
    }),
    
    // Total views (count PostView records)
    prisma.postView.count(),
    
    // Total likes
    prisma.post.aggregate({
      _sum: { likeCount: true }
    }),
    
    // Today's views
    prisma.postView.count({
      where: {
        viewedAt: { gte: today }
      }
    }),
    
    // Today's likes
    prisma.like.count({
      where: {
        createdAt: { gte: today }
      }
    }),
    
    // This month's posts
    prisma.post.count({
      where: {
        createdTime: { gte: thisMonth }
      }
    }),
    
    // Categories with post count
    prisma.category.findMany({
      where: {
        posts: { some: {} }
      },
      select: {
        uid: true,
        name: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: { _count: 'desc' }
      }
    }),
    
    // Posts by type
    prisma.post.groupBy({
      by: ['type'],
      _count: { type: true }
    })
  ]);

  // Calculate publish rate
  const publishRate = totalPosts > 0
    ? Math.round((publishedPosts / totalPosts) * 100)
    : 0;

  return {
    total: totalPosts,
    published: publishedPosts,
    draft: draftPosts,
    publishRate,
    totalViews: totalViews || 0, // totalViews는 이제 PostView 개수
    totalLikes: totalLikes._sum.likeCount || 0,
    todayViews,
    todayLikes,
    thisMonth: thisMonthPosts,
    categories,
    typeStats: postsByType.map(stat => ({
      type: stat.type,
      count: stat._count.type
    }))
  };
};

/**
 * Increment post view count.
 * @param postId - Post ID
 * @param userId - User ID (optional)
 * @param ip - IP address
 * @param userAgent - User agent
 * @returns Update result
 */
export const incrementPostView = async (
  postId: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) => {
  // Record view detail
  await prisma.postView.create({
    data: {
      postId,
      userId,
      ip,
      userAgent
    }
  });

  // Return post with view count
  const post = await prisma.post.findUnique({
    where: { uid: postId },
    include: {
      _count: {
        select: { view: true }
      }
    }
  });

  return post;
};

/**
 * Toggle post like.
 * @param postId - Post ID
 * @param userId - User ID
 * @returns Like status
 */
export const togglePostLike = async (postId: string, userId: string) => {
  // Check if already liked
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (existingLike) {
    // Unlike
    await prisma.like.delete({
      where: { uid: existingLike.uid }
    });

    await prisma.post.update({
      where: { uid: postId },
      data: { likeCount: { decrement: 1 } }
    });

    return { liked: false };
  } else {
    // Like
    await prisma.like.create({
      data: { userId, postId }
    });

    await prisma.post.update({
      where: { uid: postId },
      data: { likeCount: { increment: 1 } }
    });

    return { liked: true };
  }
};

// ================================
// Category Operations
// ================================

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
      _count: {
        select: { posts: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

/**
 * Create a category.
 * @param data - Category data
 * @returns Created category
 */
export const createCategory = async (data: {
  code: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId?: string;
}) => {
  return prisma.category.create({
    data,
    select: {
      uid: true,
      code: true,
      name: true,
      slug: true,
      path: true,
      level: true
    }
  });
};