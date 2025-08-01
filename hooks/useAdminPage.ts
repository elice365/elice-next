"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface AdminPageHookProps<T> {
  endpoint: string;
  dataKey: string;
  statsEndpoint?: string;
  initialFilters?: Record<string, string>;
  limit?: number;
}

export interface AdminPageState<T> {
  data: T[];
  loading: boolean;
  pagination: PaginationState;
  search: string;
  filters: Record<string, string>;
  selectedIds: string[];
  bulkActionLoading: boolean;
  stats: any;
}

export interface AdminPageActions {
  setSearch: (search: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  handlePageChange: (page: number) => void;
  handleSelect: (record: any, selected: boolean, selectedRows: any[]) => void;
  handleSelectAll: (selected: boolean, selectedRows: any[], changeRows: any[]) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
  refresh: () => void;
  setBulkActionLoading: (loading: boolean) => void;
}

export function useAdminPage<T>({
  endpoint,
  dataKey,
  statsEndpoint,
  initialFilters = {},
  limit = 10
}: AdminPageHookProps<T>): [AdminPageState<T>, AdminPageActions] {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit
  });

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        )
      });

      const { data: responseData } = await api.get<APIResult<any>>(`${endpoint}?${params}`);

      if (responseData.success && responseData.data) {
        setData(responseData.data[dataKey]);
        setPagination(responseData.data.pagination);
      }
    } catch (error) {
      console.error(`Failed to fetch ${dataKey}:`, error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, pagination.currentPage, pagination.limit, search, filters]);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    if (!statsEndpoint) return;
    
    try {
      const { data: responseData } = await api.get<APIResult<any>>(statsEndpoint);
      if (responseData.success && responseData.data) {
        setStats(responseData.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [statsEndpoint]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  // Actions
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setSearch('');
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelect = (_: any, __: boolean, selectedRows: any[]) => {
    const ids = selectedRows.map(row => row.id || row.uid || row.sessionId);
    setSelectedIds(ids);
  };

  const handleSelectAll = (_: boolean, selectedRows: any[], __: any[]) => {
    const ids = selectedRows.map(row => row.id || row.uid || row.sessionId);
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const refresh = () => {
    fetchData();
    fetchStats();
  };

  const state: AdminPageState<T> = {
    data,
    loading,
    pagination,
    search,
    filters,
    selectedIds,
    bulkActionLoading,
    stats
  };

  const actions: AdminPageActions = {
    setSearch: (newSearch: string) => {
      setSearch(newSearch);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    },
    setFilter,
    clearFilters,
    handlePageChange,
    handleSelect,
    handleSelectAll,
    clearSelection,
    setSelectedIds,
    refresh,
    setBulkActionLoading
  };

  return [state, actions];
}