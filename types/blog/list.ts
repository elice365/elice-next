// Blog List Component Type Definitions

import { Post, Category, Tag } from './post';

// List item sub-component props
export interface ListItemContentProps {
  title: string;
  description: string;
  tags?: Tag[];
  category?: Category;
  author?: string;
  createdAt: string | Date;
  className?: string;
}

export interface ListItemImageProps {
  imageUrl?: string;
  title: string;
  category?: Category;
  className?: string;
}

export interface ListItemMetaProps {
  likeCount?: number;
  viewCount?: number;
  commentCount?: number;
  createdAt: string | Date;
  className?: string;
}

// Main list component props
export interface BlogListItemProps {
  post: Post;
  onLike?: (uid: string) => void;
  onBookmark?: (uid: string) => void;
  onShare?: (uid: string) => void;
  className?: string;
}

export interface BlogListProps {
  posts: Post[];
  loading?: boolean;
  error?: string | null;
  layout?: 'card' | 'list';
  onLike?: (uid: string) => void;
  onBookmark?: (uid: string) => void;
  onShare?: (uid: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}