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
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly defaultOpen?: boolean;
}

export interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseModalFormProps<T> {
  readonly initialData?: Partial<T>;
  readonly endpoint: string;
  readonly method?: 'POST' | 'PATCH' | 'PUT';
  readonly onSuccess?: (data: any) => void;
  readonly onUpdate?: () => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
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

// TokenRefreshOptions moved to types/hooks/auth.ts to avoid duplication

// Auth form interfaces moved to types/hooks/auth.ts to avoid duplication

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

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  recentCount: number;
}

export interface UseAdminTableReturn<T> {
  items: T[];
  loading: boolean;
  pagination: PaginationState;
  stats: AdminStats | null;
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

export interface ApiCallState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (body?: unknown) => Promise<T | null>;
  reset: () => void;
}