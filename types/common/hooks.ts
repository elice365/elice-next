// Hook Type Definitions
// Types for custom React hooks

// ==========================================
// UI Hooks
// ==========================================

export interface UseAnimatedWidthOptions {
  duration?: number;
  openWidth?: number;
  closedWidth?: number;
}

// ==========================================
// Modal Hooks
// ==========================================

export interface UseModalStateProps {
  onOpen?: () => void;
  onClose?: () => void;
  defaultOpen?: boolean;
}

export interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseModalFormProps<T> {
  initialData?: Partial<T>;
  endpoint: string;
  method?: 'POST' | 'PATCH' | 'PUT';
  onSuccess?: (data: any) => void;
  onUpdate?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface UseModalStatesOptions {
  modalNames: string[];
}

export interface UseModalStatesReturn<T> {
  modalStates: Record<string, boolean>;
  selectedItem: T | null;
  openModal: (modalName: string, item?: T) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
  setSelectedItem: (item: T | null) => void;
  openCreate: () => void;
  openEdit: (item: T) => void;
  openDelete: (item: T) => void;
  isModalOpen: (modalName: string) => boolean;
  hasAnyModalOpen: () => boolean;
}

// ==========================================
// Auth Hooks
// ==========================================

export interface TokenRefreshOptions {
  enabled?: boolean;
  debounceTime?: number;
  refreshBeforeExpiry?: number;
  activityEvents?: string[];
  enableVisibilityRefresh?: boolean;
}

export interface UseAuthFormStateProps {
  fields: any[]; // Should be AuthFormField[] from auth types
}

export interface UseAuthFormValidationProps {
  fields: any[];
  validate?: (data: Record<string, string>) => string | null;
}

export interface UseAuthFormSubmissionProps {
  title: string;
  successRedirect?: string;
  onSuccess?: () => void;
}

export type SocialLoginResponse = {
  success: boolean;
  data?: { authUrl: string; fingerprint?: string };
  message?: string;
};

// ==========================================
// Search Hooks
// ==========================================

export interface SearchOptions {
  debounceDelay?: number;
  minLength?: number;
}

// ==========================================
// Admin Hooks
// ==========================================

export interface UseAdminTableOptions<T> {
  endpoint: string;
  initialLimit?: number;
  includeStats?: boolean;
  statsEndpoint?: string;
}

export interface UseAdminTableReturn<T> {
  items: T[];
  loading: boolean;
  pagination: any; // Should be PaginationState from admin types
  stats: any;
  search: string;
  filters: Record<string, string>;
  refetch: () => Promise<void>;
  setSearch: (search: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  handlePageChange: (page: number) => void;
  fetchStats: () => Promise<void>;
}

// ==========================================
// Performance Hooks
// ==========================================

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
}

// ==========================================
// API Hooks
// ==========================================

export interface UseApiCallOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  autoFetch?: boolean;
}

export interface ApiCallState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (body?: any) => Promise<T | null>;
  reset: () => void;
}