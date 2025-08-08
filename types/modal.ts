// Modal Component Type Definitions

import { Category } from './blog/post';

// ==========================================
// Blog Modals
// ==========================================

export interface BlogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface BlogData {
  uid: string;
  type: 'post' | 'product' | 'notice';
  title: string;
  description: string;
  category?: Category;
  tags: Array<{ uid: string; name: string }>;
  images: string[] | Record<string, unknown>;
  status: 'draft' | 'published';
  publishedAt?: string;
  views: number;
  likeCount: number;
  createdTime: string;
  updatedTime: string;
}

export interface BlogEditModalProps {
  post: BlogData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// ==========================================
// Stats Modals
// ==========================================

export interface LikeDetail {
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  likedAt: string;
}

export interface LikeStatsData {
  totalLikes: number;
  todayLikes: number;
  weekLikes: number;
  monthLikes: number;
  likeDetails: LikeDetail[];
}

export interface BlogLikeStatsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface ViewDetail {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  viewedAt: string;
}

export interface ViewStatsData {
  totalViews: number;
  uniqueViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  viewDetails: ViewDetail[];
}

export interface BlogViewStatsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ==========================================
// Category Modals
// ==========================================

export interface CategoryModalProps {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface CategoryCreateModalProps extends CategoryModalProps {}
export interface CategoryEditModalProps extends CategoryModalProps {}

// ==========================================
// Modal State Management
// ==========================================

export interface ModalState {
  isOpen: boolean;
  data?: any;
  type?: string;
}

export interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseModalFormReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleFieldChange: (name: keyof T, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  clearError: (field: string) => void;
}