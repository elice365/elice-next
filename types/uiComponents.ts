// UI Component Type Definitions
// Props and types for reusable UI components

// ==========================================
// Card Components
// ==========================================

export interface CardImageProps {
  images: string[];
  title: string;
  category?: { name: string; slug: string };
  tags?: Array<{ uid: string; name: string }>;
  mobile?: boolean;
}

export interface CategoryBadgeProps {
  category: { name: string; slug: string };
  mobile?: boolean;
}

export interface TagsListProps {
  tags: Array<{ uid: string; name: string }>;
  mobile?: boolean;
}

export interface CardContentProps {
  title: string;
  description: string;
  viewCount: number;
  likeCount: number;
  createdTime: string;
  mobile?: boolean;
}

export interface CardActionsProps {
  postId: string;
  isLiked?: boolean;
  likeCount: number;
  onLike?: () => void;
  mobile?: boolean;
}

// ==========================================
// Basic UI Components
// ==========================================

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export interface ReadingProgressIndicatorProps {
  className?: string;
  color?: string;
  height?: number;
}

// ==========================================
// Form Components
// ==========================================

export interface FormFieldProps {
  label?: string;
  name: string;
  type?: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface SelectFieldProps extends FormFieldProps {
  options: Array<{ value: string; label: string }>;
}

// ==========================================
// Table Components
// ==========================================

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  className?: string;
  loading?: boolean;
}

// ==========================================
// Pagination
// ==========================================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}