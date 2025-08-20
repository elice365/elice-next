import { prisma } from './prisma';

// ================================
// TypeScript Interfaces
// ================================

export interface SearchParams {
  query: string;
  type?: 'posts' | 'tags' | 'all';
  category?: string;
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'views' | 'likes';
}

export interface SearchResult {
  posts: any[];
  tags?: any[];
  total: number;
  suggestions?: string[];
}

// ================================
// Common Select Patterns
// ================================

const searchPostSelect = {
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
  category: {
    select: {
      uid: true,
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
      view: true,
      likes: true
    }
  }
};

// ================================
// Search Operations
// ================================

/**
 * Search blog posts with filters and pagination.
 * @param params - Search parameters
 * @returns Search results with posts and metadata
 */
export const searchBlogPosts = async (params: SearchParams): Promise<SearchResult> => {
  const {
    query,
    type = 'posts',
    category,
    dateRange = 'all',
    page = 1,
    limit = 10,
    sortBy = 'relevance'
  } = params;

  const skip = (page - 1) * limit;

  // Build where conditions
  const where: Record<string, any> = {
    status: 'published'
  };

  // Search query
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { some: { name: { contains: query, mode: 'insensitive' } } } }
    ];
  }

  // Category filter
  if (category) {
    where.categoryId = category;
  }

  // Date range filter
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    where.publishedAt = { gte: startDate };
  }

  // Determine sort order
  let orderBy: any = {};
  switch (sortBy) {
    case 'date':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'views':
      orderBy = { view: { _count: 'desc' } };
      break;
    case 'likes':
      orderBy = { likeCount: 'desc' };
      break;
    case 'relevance':
    default:
      // For relevance, we'll use publishedAt as a proxy
      // In a real implementation, you might want to use full-text search
      orderBy = { publishedAt: 'desc' };
      break;
  }

  // Execute search
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: searchPostSelect
    }),
    prisma.post.count({ where })
  ]);

  // Get search suggestions (related tags)
  let suggestions: string[] = [];
  if (query && type !== 'tags') {
    const relatedTags = await prisma.tag.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      select: { name: true },
      take: 5
    });
    suggestions = relatedTags.map(tag => tag.name);
  }

  // Search tags if requested
  let tags: any[] = [];
  if (type === 'tags' || type === 'all') {
    tags = await prisma.tag.findMany({
      where: query ? {
        name: { contains: query, mode: 'insensitive' }
      } : {},
      select: {
        uid: true,
        name: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: { _count: 'desc' }
      },
      take: 10
    });
  }

  // Transform posts to SearchItem format
  const transformedPosts = posts.map(post => ({
    id: post.uid,
    title: post.title,
    description: post.description || '',
    url: `/blog/${post.uid}`,
    image: Array.isArray(post.images) && post.images.length > 0 
      ? post.images[0] 
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post%3C/text%3E%3C/svg%3E",
    category: post.category?.name,
    createdTime: post.publishedAt?.toISOString() || post.createdTime.toISOString(),
    views: post._count.view,
    likeCount: post.likeCount || 0
  }));

  return {
    posts: transformedPosts,
    tags,
    total: totalCount,
    suggestions
  };
};

// ================================
// Recent Posts Operations
// ================================

/**
 * Get recent blog posts.
 * @param limit - Number of posts to return
 * @param category - Optional category filter
 * @returns Recent posts
 */
export const getRecentPosts = async (limit: number = 5, category?: string) => {
  const where: Record<string, any> = {
    status: 'published'
  };

  if (category) {
    where.categoryId = category;
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      uid: true,
      title: true,
      description: true,
      url: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      category: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          view: true
        }
      }
    }
  });

  // Transform to SearchItem format
  return posts.map(post => ({
    id: post.uid,
    title: post.title,
    description: post.description || '',
    url: `/blog/${post.uid}`,
    image: Array.isArray(post.images) && post.images.length > 0 
      ? post.images[0] 
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post%3C/text%3E%3C/svg%3E",
    category: post.category?.name,
    createdTime: post.publishedAt?.toISOString() || new Date().toISOString(),
    views: post._count.view,
    likeCount: post.likeCount || 0
  }));
};

// ================================
// Popular Posts Operations
// ================================

/**
 * Get popular posts by views.
 * @param limit - Number of posts to return
 * @param dateRange - Time period for popularity calculation
 * @returns Popular posts
 */
export const getPopularPostsByViews = async (
  limit: number = 5,
  dateRange: 'day' | 'week' | 'month' | 'all' = 'week'
) => {
  // Calculate date filter
  let viewDateFilter: any = {};
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    viewDateFilter = { viewedAt: { gte: startDate } };
  }

  // Get posts with view counts for the specified period
  const postsWithViews = await prisma.post.findMany({
    where: {
      status: 'published',
      view: dateRange !== 'all' ? {
        some: viewDateFilter
      } : undefined
    },
    select: {
      uid: true,
      title: true,
      description: true,
      url: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      category: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          view: {
            where: viewDateFilter
          }
        }
      }
    }
  });

  // Sort by view count and take top posts
  const sortedPosts = postsWithViews
    .sort((a, b) => b._count.view - a._count.view)
    .slice(0, limit);

  // Transform to SearchItem format
  return sortedPosts.map(post => ({
    id: post.uid,
    title: post.title,
    description: post.description || '',
    url: `/blog/${post.uid}`,
    image: Array.isArray(post.images) && post.images.length > 0 
      ? post.images[0] 
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post%3C/text%3E%3C/svg%3E",
    category: post.category?.name,
    createdTime: post.publishedAt?.toISOString() || new Date().toISOString(),
    views: post._count.view,
    likeCount: post.likeCount || 0
  }));
};

/**
 * Get popular posts by likes.
 * @param limit - Number of posts to return
 * @param dateRange - Time period for popularity calculation
 * @returns Popular posts
 */
export const getPopularPostsByLikes = async (
  limit: number = 5,
  dateRange: 'day' | 'week' | 'month' | 'all' = 'week'
) => {
  // Calculate date filter
  let dateFilter: any = {};
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    dateFilter = { publishedAt: { gte: startDate } };
  }

  const posts = await prisma.post.findMany({
    where: {
      status: 'published',
      ...dateFilter
    },
    orderBy: { likeCount: 'desc' },
    take: limit,
    select: {
      uid: true,
      title: true,
      description: true,
      url: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      category: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          view: true
        }
      }
    }
  });

  // Transform to SearchItem format
  return posts.map(post => ({
    id: post.uid,
    title: post.title,
    description: post.description || '',
    url: `/blog/${post.uid}`,
    image: Array.isArray(post.images) && post.images.length > 0 
      ? post.images[0] 
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post%3C/text%3E%3C/svg%3E",
    category: post.category?.name,
    createdTime: post.publishedAt?.toISOString() || new Date().toISOString(),
    views: post._count.view,
    likeCount: post.likeCount || 0
  }));
};

// ================================
// Tag Operations
// ================================

/**
 * Get recommended/popular tags.
 * @param limit - Number of tags to return
 * @returns Popular tags with post counts
 */
export const getRecommendedTags = async (limit: number = 10) => {
  const tags = await prisma.tag.findMany({
    select: {
      uid: true,
      name: true,
      _count: {
        select: {
          posts: {
            where: {
              status: 'published'
            }
          }
        }
      }
    },
    orderBy: {
      posts: {
        _count: 'desc'
      }
    },
    take: limit
  });

  // Transform to include count as a number
  return tags.map(tag => ({
    uid: tag.uid,
    name: tag.name,
    count: tag._count.posts
  }));
};

/**
 * Get trending tags based on recent post activity.
 * @param limit - Number of tags to return
 * @param days - Number of days to consider for trending
 * @returns Trending tags
 */
export const getTrendingTags = async (limit: number = 10, days: number = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const tags = await prisma.tag.findMany({
    where: {
      posts: {
        some: {
          status: 'published',
          publishedAt: {
            gte: startDate
          }
        }
      }
    },
    select: {
      uid: true,
      name: true,
      _count: {
        select: {
          posts: {
            where: {
              status: 'published',
              publishedAt: {
                gte: startDate
              }
            }
          }
        }
      }
    },
    orderBy: {
      posts: {
        _count: 'desc'
      }
    },
    take: limit
  });

  return tags.map(tag => ({
    uid: tag.uid,
    name: tag.name,
    count: tag._count.posts
  }));
};

// ================================
// Related Posts Operations
// ================================

/**
 * Get related posts based on tags and category.
 * @param postId - Current post ID
 * @param limit - Number of related posts to return
 * @returns Related posts
 */
export const getRelatedPosts = async (postId: string, limit: number = 5) => {
  // Get the current post's tags and category
  const currentPost = await prisma.post.findUnique({
    where: { uid: postId },
    select: {
      categoryId: true,
      tags: {
        select: { uid: true }
      }
    }
  });

  if (!currentPost) {
    return [];
  }

  const tagIds = currentPost.tags.map(tag => tag.uid);

  // Find posts with similar tags or same category
  const relatedPosts = await prisma.post.findMany({
    where: {
      status: 'published',
      uid: { not: postId },
      OR: [
        {
          tags: {
            some: {
              uid: { in: tagIds }
            }
          }
        },
        {
          categoryId: currentPost.categoryId
        }
      ]
    },
    select: {
      uid: true,
      title: true,
      description: true,
      url: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      category: {
        select: {
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
          view: true
        }
      }
    },
    orderBy: [
      { likeCount: 'desc' },
      { publishedAt: 'desc' }
    ],
    take: limit
  });

  return relatedPosts;
};

// ================================
// Autocomplete Operations
// ================================

/**
 * Get search suggestions for autocomplete.
 * @param query - Partial search query
 * @param limit - Number of suggestions to return
 * @returns Autocomplete suggestions
 */
export const getSearchSuggestions = async (query: string, limit: number = 5) => {
  if (!query || query.length < 2) {
    return { posts: [], tags: [] };
  }

  const [posts, tags] = await Promise.all([
    // Get matching post titles
    prisma.post.findMany({
      where: {
        status: 'published',
        title: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        uid: true,
        title: true,
        url: true
      },
      take: limit
    }),
    // Get matching tags
    prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        uid: true,
        name: true
      },
      take: limit
    })
  ]);

  return { posts, tags };
};

// ================================
// Statistics Operations
// ================================

/**
 * Get search statistics.
 * @returns Search-related statistics
 */
export const getSearchStats = async () => {
  const [
    totalPosts,
    totalTags,
    mostViewedPost,
    mostLikedPost,
    popularTags
  ] = await Promise.all([
    // Total published posts
    prisma.post.count({
      where: { status: 'published' }
    }),
    
    // Total tags
    prisma.tag.count(),
    
    // Most viewed post
    prisma.post.findFirst({
      where: { status: 'published' },
      orderBy: {
        view: { _count: 'desc' }
      },
      select: {
        uid: true,
        title: true,
        _count: {
          select: { view: true }
        }
      }
    }),
    
    // Most liked post
    prisma.post.findFirst({
      where: { status: 'published' },
      orderBy: { likeCount: 'desc' },
      select: {
        uid: true,
        title: true,
        likeCount: true
      }
    }),
    
    // Top 5 popular tags
    prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: { _count: 'desc' }
      },
      take: 5
    })
  ]);

  return {
    totalPosts,
    totalTags,
    mostViewedPost,
    mostLikedPost,
    popularTags: popularTags.map(tag => ({
      name: tag.name,
      count: tag._count.posts
    }))
  };
};