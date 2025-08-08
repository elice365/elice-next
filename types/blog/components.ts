// Blog Component Type Definitions
// Types for blog-related component props and data structures

import { PostType } from './post';
import { BlogContent } from './content';

// ==========================================
// Blog Display Components
// ==========================================

export interface BlogPost {
  uid: string;
  type: string;
  title: string;
  description: string;
  content?: BlogContent | null;
  images?: string[] | Record<string, unknown>;
  tags?: Array<{ uid: string; name: string }>;
  category?: {
    uid: string;
    name: string;
    slug: string;
  };
  likeCount: number;
  viewCount: number;
  commentCount?: number;
  isLiked?: boolean;
  author?: {
    id: string;
    name?: string;
    email?: string;
    imageUrl?: string;
  };
  publishedAt?: string;
  createdTime: string;
  updatedTime?: string;
}

export interface BlogDisplayProps {
  post: BlogPost;
  mobile?: boolean;
  tablet?: boolean;
}

export interface BlogPostProps {
  post: PostType;
  mobile?: boolean;
}

export interface BlogPostHeaderProps {
  post: PostType;
  mobile?: boolean;
  tablet?: boolean;
}

export interface BlogPostContentProps {
  content: BlogContent | null;
  mobile?: boolean;
  tablet?: boolean;
}

export interface BlogPostActionsProps {
  post: PostType;
  mobile?: boolean;
}

export interface BlogPostGalleryProps {
  images: string[];
  title: string;
  mobile?: boolean;
}

// ==========================================
// Blog List Components
// ==========================================

export interface BlogListItemProps {
  post: PostType;
  className?: string;
}

export interface BlogListProps {
  posts: PostType[];
  loading?: boolean;
  className?: string;
}

// ==========================================
// Related Posts
// ==========================================

export interface RelatedPostsProps {
  currentPostId: string;
  tags?: Array<{ uid: string; name: string }>;
  categoryId?: string;
  className?: string;
}

// ==========================================
// Author/Seller Info
// ==========================================

export interface AuthorInfo {
  id: string;
  name?: string | null;
  email?: string;
  imageUrl?: string | null;
  bio?: string;
  postCount?: number;
  followerCount?: number;
}

export interface AuthorInfoCardProps {
  author: AuthorInfo;
  className?: string;
}