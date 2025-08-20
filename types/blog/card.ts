// Blog Card Component Type Definitions

import { Post, PostType, Tag, Category } from './post';

// Card sub-component props
export interface CardActionsProps {
  post: PostType;
  mobile: boolean;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

export interface MobileActionsProps {
  post: PostType;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

export interface DesktopActionsProps {
  post: PostType;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

export interface LikeButtonProps {
  isLiked: boolean;
  isAnimating: boolean;
  onClick: (e: React.MouseEvent) => void;
  mobile: boolean;
}

export interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
  mobile: boolean;
}

export interface ViewMoreButtonProps {
  postId: string;
  mobile: boolean;
}

// Card content props
export interface CardContentProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
  formatDate: (date: Date) => string;
}

export interface CardTitleProps {
  readonly title: string;
  readonly mobile: boolean;
  readonly tablet: boolean;
}

export interface CardDescriptionProps {
  description: string;
  mobile: boolean;
}

export interface CardStatsProps {
  post: import('./post').PostType;
  mobile: boolean;
  formatDate: (date: Date) => string;
}

export interface StatsItemsProps {
  post: import('./post').PostType;
  mobile: boolean;
}

export interface StatItemProps {
  icon: string;
  value: string;
  mobile: boolean;
  filled?: boolean;
}

export interface DateDisplayProps {
  date: Date;
  mobile: boolean;
  formatDate: (date: Date) => string;
}

// Card effects props
export interface CardEffectsProps {
  mobile: boolean;
}

// Card image props
export interface CardImageProps {
  post: import('./post').PostType;
  mobile: boolean;
  tablet: boolean;
  imageError: boolean;
  onImageError: () => void;
}

export interface CategoryBadgeProps {
  category: Category;
  mobile: boolean;
}

export interface TagsListProps {
  tags: Tag[];
  mobile: boolean;
}

export interface TagItemProps {
  tag: Tag;
  mobile: boolean;
  index: number;
}

export interface RemainingTagsCountProps {
  count: number;
  mobile: boolean;
}

// Main card props
export interface BlogCardProps {
  post: Post;
  layout?: 'card' | 'list';
  className?: string;
  onLike?: (uid: string) => void;
  onBookmark?: (uid: string) => void;
  onShare?: (uid: string) => void;
}