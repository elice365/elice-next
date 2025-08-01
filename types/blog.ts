/**
 * Blog Module Types
 * Type definitions for blog components and features
 */

import { Post, Tag, PostContent } from './post';
import { BlogContent, AuthorInfo, ProductItem, ContentSection } from '@/utils/blog/contentParser';

// Component Props Types
export interface BlogCardProps {
  post: Post;
  className?: string;
}

export interface BlogListProps {
  posts: Post[];
  className?: string;
}

export interface BlogListItemProps {
  post: Post;
  index: number;
}

export interface BlogFiltersProps {
  className?: string;
  onFilterChange?: (filters: BlogFilterState) => void;
}

export interface BlogDisplayProps {
  posts: Post[];
  isLoading?: boolean;
  locale?: string;
  defaultView?: 'card' | 'list';
}

export interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
  isLoading?: boolean;
  className?: string;
}

export interface RelatedPostsProps {
  currentPostId: string;
  tags: Tag[];
  category?: string;
  limit?: number;
}

// Detail Component Props
export interface PostDetailProps {
  post: Post;
  content?: PostContent | null;
  isLoading?: boolean;
}

export interface PostHeaderProps {
  post: Post;
  mobile: boolean;
  tablet: boolean;
}

export interface PostContentProps {
  sections: ContentSection[];
  mobile: boolean;
  tablet: boolean;
}

export interface PostGalleryProps {
  products: ProductItem[];
  author?: AuthorInfo;
  mobile: boolean;
  tablet: boolean;
}

export interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  variant?: 'desktop' | 'mobile';
}

export interface PostSidebarProps {
  post: Post;
  blogContent: BlogContent | null;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export interface PostMobileActionsProps {
  post: Post;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export interface SellerInfoProps {
  author: AuthorInfo;
  variant?: 'desktop' | 'mobile';
}

// Filter and State Types
export interface BlogFilterState {
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'trending' | 'oldest';
}

export interface BlogPaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  replies?: Comment[];
  isLiked?: boolean;
}

// Share Types
export interface ShareOptions {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'kakao';
}

// API Response Types
export interface BlogPostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    pagination: BlogPaginationState;
  };
  error?: string;
}

export interface BlogPostDetailResponse {
  success: boolean;
  data: {
    post: Post;
    content?: PostContent;
  };
  error?: string;
}

export interface BlogActionResponse {
  success: boolean;
  data?: {
    likeCount?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  error?: string;
}

// Hook Return Types
export interface UseBlogActionsReturn {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  isLiking: boolean;
  isBookmarking: boolean;
  handleLike: () => void;
  handleBookmark: () => void;
  handleShare: () => void;
}

export interface UseBlogFiltersReturn {
  filters: BlogFilterState;
  updateFilter: (key: keyof BlogFilterState, value: string | undefined) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

// Animation Variants
export interface BlogAnimationVariants {
  hidden: any;
  visible: any;
  exit?: any;
}

// Metadata Types
export interface BlogMetadata {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  category?: string;
}

// Content Section Types (from Detail Components)
export interface ContentSectionItemProps {
  section: ContentSection;
  index: number;
  mobile: boolean;
  tablet: boolean;
}