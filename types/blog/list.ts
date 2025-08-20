// Blog List Component Type Definitions

import { Post, Category, Tag } from './post';

// List item sub-component props
export interface ListItemContentProps {
  readonly title: string;
  readonly description: string;
  readonly tags?: readonly Tag[];
  readonly category?: Category;
  readonly author?: string;
  readonly createdAt: string | Date;
  readonly className?: string;
}

export interface ListItemImageProps {
  readonly imageUrl?: string;
  readonly title: string;
  readonly category?: Category;
  readonly className?: string;
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