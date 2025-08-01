import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { PaginationState } from "@/types/admin";

interface UseAdminTableOptions<T> {
  endpoint: string;
  initialLimit?: number;
  searchFields?: string[];
  filterFields?: string[];
  includeStats?: boolean;
  statsEndpoint?: string;
}

interface UseAdminTableReturn<T> {
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

export function useAdminTable<T>({
  endpoint,
  initialLimit = 10,
  searchFields = [],
  filterFields = [],
  includeStats = false,
  statsEndpoint
}: UseAdminTableOptions<T>): UseAdminTableReturn<T> {
  
  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: initialLimit
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!includeStats && !statsEndpoint) return;
    
    try {
      const statsUrl = statsEndpoint || `${endpoint}?includeStats=true`;
      const { data } = await api.get<APIResult>(statsUrl);
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [endpoint, includeStats, statsEndpoint]);

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams({
      page: pagination.currentPage.toString(),
      limit: pagination.limit.toString()
    });

    // Add search parameters
    if (search) {
      params.append('search', search);
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    return params;
  };

  // Parse API response data
  const parseResponseData = (data: any) => {
    if (Array.isArray(data)) {
      // Direct array response
      setItems(data);
    } else if (data.items || data.users || data.roles || data.routers) {
      // Paginated response
      const itemKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (itemKey) {
        setItems(data[itemKey]);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    }
  };

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const { data } = await api.get<APIResult>(`${endpoint}?${params}`);
      
      if (data.success && data.data) {
        parseResponseData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination.currentPage, pagination.limit, search, filters]);

  // Refetch both items and stats
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchItems(),
      fetchStats()
    ]);
  }, [fetchItems, fetchStats]);

  // Filter actions
  const setFilterValue = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Reset to first page when filtering
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilters({});
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const setSearchValue = useCallback((searchValue: string) => {
    setSearch(searchValue);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Effects
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (includeStats || statsEndpoint) {
      fetchStats();
    }
  }, [fetchStats, includeStats, statsEndpoint]);

  return {
    // Data state
    items,
    loading,
    pagination,
    stats,
    
    // Filter state
    search,
    filters,
    
    // Actions
    refetch,
    setSearch: setSearchValue,
    setFilter: setFilterValue,
    clearFilters,
    handlePageChange,
    
    // Helper functions
    fetchStats
  };
}