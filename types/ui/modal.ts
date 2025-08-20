// Modal Component Type Definitions

// Base modal props
export interface BaseModalExtendedProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  loadingMessage?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

export interface AdminDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate?: () => void;
  readonly title: string;
  readonly entity: any;
  readonly entityName: string;
  readonly endpoint: string;
  readonly confirmationText?: string;
  readonly requiresConfirmation?: boolean;
  readonly warningMessage?: string;
  readonly getDangerLevel?: (entity: any) => 'low' | 'medium' | 'high';
  readonly getDisplayName?: (entity: any) => string;
  readonly onSuccess?: (deletedEntity: any) => void;
  readonly children?: React.ReactNode;
}

export interface FormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate?: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly iconColor?: string;
  readonly endpoint: string;
  readonly method?: 'POST' | 'PATCH';
  readonly fields: import('../admin/admin').FormField[];
  readonly initialData?: Record<string, any>;
  readonly validationRules?: import('../admin/admin').ValidationRules;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly submitLabel?: string;
  readonly onSuccess?: (data: any) => void;
}

export interface ModalFooterProps {
  onClose: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  submitIcon?: string;
  cancelLabel?: string;
  formId?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'danger' | 'success';
}

// Role Modal Interfaces
export interface RoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  role: import('../admin/admin').Role;
}

// Category Modal Interfaces
export interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: import('../admin/pages').CategoryData | null;
}

// Notification Modal Interfaces
export interface NotificationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface NotificationData {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  category: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  readTime?: string;
  createdTime: string;
}

export interface NotificationViewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly notification: NotificationData | null;
}

// Blog Modal Interfaces
export interface ViewDetail {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string;
  userAgent: string;
  viewedAt: Date;
  isAnonymous: boolean;
}

export interface ViewStatsData {
  postId: string;
  postTitle: string;
  totalViews: number;
  uniqueUsers: number;
  anonymousViews: number;
  views: ViewDetail[];
  viewsByDate: Array<{ date: string; count: number }>;
  viewsByHour: Array<{ hour: number; count: number }>;
}

export interface BlogViewStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
  postTitle?: string;
}

export interface LikeDetail {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string;
  likedAt: Date;
  isAnonymous: boolean;
}

export interface LikeStatsData {
  postId: string;
  postTitle: string;
  totalLikes: number;
  uniqueUsers: number;
  anonymousLikes: number;
  likes: LikeDetail[];
  likesByDate: Array<{ date: string; count: number }>;
  likesByHour: Array<{ hour: number; count: number }>;
}

export interface BlogLikeStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
  postTitle?: string;
}

export interface BlogData {
  id: string;
  uid: string;
  type: string;
  title: string;
  description: string;
  url?: string;
  category?: import('../blog/post').Category;
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
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly post: BlogData | null;
}

export interface BlogCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

// Router Modal Interfaces
export interface RouterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export interface WebRouter {
  uid: string;
  name: string;
  path: string;
  icon: string;
  role: string[];
  createdTime: string;
  updateTime: string;
}

export interface RouterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  router: WebRouter | null;
}