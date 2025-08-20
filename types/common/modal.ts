// Modal Component Type Definitions

import { Category } from '../blog/post';

// ==========================================
// Blog Modals
// ==========================================

export interface BlogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// BlogData type moved to types/ui/modal.ts to avoid duplication
import type { BlogData } from '../ui/modal';

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

// UseModalStateReturn is already exported from hooks.ts

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

export interface ModalSliceState {
  readonly search: boolean;
  readonly auth: boolean;
  readonly form: import('../auth/auth').FormType;
}