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
  content: import('./post').PostContent | null;
  mobile?: boolean;
  isLoading?: boolean;
}

export interface BlogPostHeaderProps {
  post: PostType;
  mobile?: boolean;
  tablet?: boolean;
}

export interface BlogPostContentProps {
  sections: import('./content').ContentSection[];
  mobile: boolean;
  tablet: boolean;
}

export interface BlogPostContentFullProps {
  content: BlogContent | null;
  mobile?: boolean;
  tablet?: boolean;
}

export interface BlogPostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export interface BlogPostGalleryProps {
  products: import('./content').ProductItem[];
  author?: import('./content').AuthorInfo;
  mobile: boolean;
  tablet: boolean;
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
  author: import('./content').AuthorInfo;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

// Blog Content Section Interfaces
export interface AccentSectionProps {
  section: import('./content').ContentSection;
  mobile: boolean;
  tablet: boolean;
  isInView: boolean;
}

export interface PrimarySectionProps {
  section: import('./content').ContentSection;
  mobile: boolean;
  tablet: boolean;
  isInView: boolean;
}

export interface ContentSectionItemProps {
  section: import('./content').ContentSection;
  index: number;
  mobile: boolean;
  tablet: boolean;
}

export interface ListItemMetaProps {
  readonly views: number;
  readonly likeCount: number;
  readonly isLiked: boolean;
  readonly createdTime: Date;
  readonly mobile: boolean;
  readonly handleLike: (e: React.MouseEvent | React.KeyboardEvent) => void;
  readonly isLikeAnimating: boolean;
  readonly formatDate: (date: Date) => string;
  readonly getMetaClassNames: (mobile: boolean) => string;
}

export interface ListItemContentProps {
  readonly post: import('./post').PostType;
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly getTitleTextSize: (mobile: boolean, tablet: boolean) => string;
}

export interface ListItemImageProps {
  images: string[];
  title: string;
  mobile: boolean;
  tablet: boolean;
  isVisible: boolean;
  onInteraction: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  slideContainerRef: React.RefObject<HTMLDivElement>;
  toggleBtnRef: React.RefObject<HTMLDivElement>;
  getImageDimensions: (mobile: boolean, tablet: boolean) => string;
}


// Display Component Interfaces
export interface BlogDisplayPost {
  uid: string;
  title: string;
  description: string;
  url?: string;
  images?: string[];
  tags?: import('./post').Tag[];
  author?: {
    name: string;
    profileImage?: string;
    description?: string;
  };
  views?: number;
  likeCount?: number;
  createdTime?: string;
  category?: {
    name: string;
    slug: string;
  };
}

export interface BlogDisplayProps {
  readonly posts: readonly BlogDisplayPost[];
  readonly isLoading?: boolean;
  readonly locale?: string;
  readonly defaultView?: "card" | "list";
}