// Admin Hook Type Definitions

import { PaginationState } from "@/types/admin";

export interface UseAdminTableOptions<T> {
  endpoint: string;
  initialLimit?: number;
  includeStats?: boolean;
  statsEndpoint?: string;
}

export interface UseAdminTableReturn<T> {
  // Data state
  items: T[];
  loading: boolean;
  pagination: PaginationState;
  stats: any;
  
  // Filter state
  search: string;
  filters: Record<string, string>;
  
  // Actions
  refetch: () => Promise<void>;
  setSearch: (search: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  handlePageChange: (page: number) => void;
  
  // Helper functions
  fetchStats: () => Promise<void>;
}