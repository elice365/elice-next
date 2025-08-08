// Blog System Type Definitions
// Comprehensive type definitions for the blog system

import { Post, PostContent } from './post';
import { User } from '@prisma/client';

// ==========================================
// Core Blog Types
// ==========================================

export interface BlogPost extends Post {
  author?: User;
  category?: BlogCategory;
  tags?: BlogTag[];
  content?: PostContent;
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

// ==========================================
// API Response Types
// ==========================================

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BlogPostResponse {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

export interface BlogActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface BlogStatsResponse {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  categories: BlogCategory[];
}

// ==========================================
// Component Props Types
// ==========================================

export interface BlogCardProps {
  post: BlogPost;
  layout?: 'card' | 'list';
  showActions?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  onLike?: (postId: string) => void;
  onShare?: (post: BlogPost) => void;
  onBookmark?: (postId: string) => void;
  className?: string;
}

export interface BlogListProps {
  posts: BlogPost[];
  loading?: boolean;
  error?: string | null;
  layout?: 'card' | 'list';
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export interface BlogPostDetailProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
  onLike?: (postId: string) => void;
  onShare?: (post: BlogPost) => void;
  onComment?: (comment: BlogComment) => void;
  className?: string;
}

export interface BlogFiltersProps {
  categories: BlogCategory[];
  tags: BlogTag[];
  selectedCategory?: string;
  selectedTags?: string[];
  sortBy?: BlogSortOption;
  onCategoryChange?: (categoryId: string) => void;
  onTagChange?: (tags: string[]) => void;
  onSortChange?: (sort: BlogSortOption) => void;
  onSearchChange?: (search: string) => void;
  className?: string;
}

export interface BlogHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

// ==========================================
// Content Types
// ==========================================

export interface BlogContent {
  product: ProductItem[];
  author: AuthorInfo;
  content: ContentSection[];
}

export interface ProductItem {
  url: string;
  tag: string[];
  title: string;
  description: string;
}

export interface AuthorInfo {
  name: string;
  description: string;
  profileImage: string;
}

export interface ContentSection {
  title: string;
  context: string;
}

export interface BlogImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
  postId?: string;
}

// ==========================================
// Engagement Types
// ==========================================

export interface BlogComment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string;
  replies?: BlogComment[];
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface BlogView {
  id: string;
  postId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  viewedAt: Date;
}

export interface BlogBookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

// ==========================================
// State Management Types
// ==========================================

export interface BlogState {
  posts: BlogPost[];
  currentPost: BlogPost | null;
  relatedPosts: BlogPost[];
  categories: BlogCategory[];
  tags: BlogTag[];
  filters: BlogFilterState;
  pagination: BlogPaginationState;
  layout: BlogLayoutOption;
  isLoading: boolean;
  error: string | null;
}

export interface BlogFilterState {
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: BlogSortOption;
  status?: BlogPostStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface BlogPaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ==========================================
// Configuration Types
// ==========================================

export type BlogLayoutOption = 'card' | 'list';

export type BlogSortOption = 
  | 'latest' 
  | 'popular' 
  | 'trending' 
  | 'mostLiked' 
  | 'mostViewed' 
  | 'alphabetical';

export type BlogPostStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export type BlogSharePlatform = 
  | 'facebook' 
  | 'twitter' 
  | 'linkedin' 
  | 'kakao' 
  | 'naver' 
  | 'telegram' 
  | 'whatsapp' 
  | 'copy';

export interface BlogShareOptions {
  title: string;
  text?: string;
  url: string;
  platform?: BlogSharePlatform;
}

// ==========================================
// Admin Types
// ==========================================

export interface AdminBlogPost extends BlogPost {
  isDraft: boolean;
  scheduledAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
}

export interface AdminBlogFilters extends BlogFilterState {
  authorId?: string;
  hasContent?: boolean;
  hasImages?: boolean;
  languages?: string[];
}

export interface AdminBlogBulkAction {
  action: 'publish' | 'unpublish' | 'delete' | 'archive';
  postIds: string[];
  options?: {
    scheduledAt?: Date;
    notifySubscribers?: boolean;
  };
}

// ==========================================
// Form Types
// ==========================================

export interface BlogPostFormData {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  images?: File[] | string[];
  isDraft?: boolean;
  scheduledAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface BlogCommentFormData {
  content: string;
  parentId?: string;
}

export interface BlogCategoryFormData {
  name: string;
  slug?: string;
  description?: string;
}

// ==========================================
// Hook Return Types
// ==========================================

export interface UseBlogPostReturn {
  post: BlogPost | null;
  loading: boolean;
  error: string | null;
  like: () => Promise<void>;
  share: (platform: BlogSharePlatform) => void;
  bookmark: () => Promise<void>;
}

export interface UseBlogListReturn {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export interface UseBlogFiltersReturn {
  filters: BlogFilterState;
  setCategory: (categoryId: string) => void;
  setTags: (tags: string[]) => void;
  setSearch: (search: string) => void;
  setSortBy: (sort: BlogSortOption) => void;
  reset: () => void;
}

// ==========================================
// Utility Types
// ==========================================

export type BlogPostWithRelations = BlogPost & {
  author: User;
  category: BlogCategory;
  tags: BlogTag[];
  comments: BlogComment[];
  _count: {
    comments: number;
    likes: number;
    views: number;
  };
};

export type BlogPostPreview = Pick<BlogPost, 
  | 'id' 
  | 'title' 
  | 'excerpt' 
  | 'thumbnail' 
  | 'slug' 
  | 'createdAt'
>;

export type BlogPostCard = Pick<BlogPost, 
  | 'id' 
  | 'title' 
  | 'excerpt' 
  | 'thumbnail' 
  | 'slug' 
  | 'createdAt' 
  | 'viewCount' 
  | 'likeCount'
> & {
  author?: Pick<User, 'id' | 'name' | 'image'>;
  category?: Pick<BlogCategory, 'id' | 'name' | 'slug'>;
};

// ==========================================
// Error Types
// ==========================================

export interface BlogError {
  code: string;
  message: string;
  details?: any;
}

export type BlogErrorCode = 
  | 'POST_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR';