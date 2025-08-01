"use client";

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from '@/components/ui/card/Stat';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { AdminPageState, AdminPageActions } from '@/hooks/useAdminPage';

export interface StatCardConfig {
  title: string;
  value: number | string;
  change: {
    value: string;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  icon: string;
  variant: "primary" | "success" | "warning" | "info";
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text';
  icon?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface AdminProps<T> {
  readonly title: string;
  readonly state: AdminPageState<T>;
  readonly actions: AdminPageActions;
  readonly stats?: readonly StatCardConfig[];
  readonly filters?: readonly FilterConfig[];
  readonly columns: any[];
  readonly actionButtons?: React.ReactNode;
  readonly bulkActionButtons?: React.ReactNode;
  readonly onRowClick?: (record: T) => void;
  readonly rowKey?: string;
  readonly children?: React.ReactNode;
}

export function Admin<T>({
  title,
  state,
  actions,
  stats = [],
  filters = [],
  columns,
  actionButtons,
  bulkActionButtons,
  onRowClick,
  rowKey = "id",
  children
}: AdminProps<T>) {
  const {
    data,
    loading,
    pagination,
    search,
    selectedIds,
    bulkActionLoading
  } = state;

  const {
    setSearch,
    setFilter,
    clearFilters,
    handlePageChange,
    handleSelect,
    handleSelectAll,
    clearSelection
  } = actions;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8 admin-layout-container">
        {/* Bulk Actions Section */}
        {selectedIds.length > 0 && (
          <div className="mb-6">
            <div className="relative flex flex-wrap gap-3 p-4 bg-[var(--color-modal)]/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center gap-3 text-[var(--text-panel)] font-medium">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Icon name="CheckSquare" size={18} className="text-emerald-600" />
                </div>
                <span className="text-sm">
                  {selectedIds.length}개 항목 선택됨
                </span>
              </div>
              <div className="flex gap-2">
                {bulkActionButtons}
                <button
                  onClick={clearSelection}
                  className="group relative overflow-hidden px-4 py-2 bg-[var(--button)]/80 hover:bg-[var(--hover)] text-[var(--button-text)] rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg border border-[var(--border-color)] /50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-2">
                    <Icon name="X" size={16} />
                    선택 해제
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responsive Statistics Cards - PC: 1줄, Mobile: 2줄 */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {stats.map((stat) => (
              <div key={`stat-${stat.title}-${stat.value}`} className="group relative w-full">
                <div className="relative">
                  <StatCard
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                    variant={stat.variant}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Minimal Search and Filter Section */}
        {filters.length > 0 && (
          <div className="mb-4">
            <div className="bg-[var(--color-modal)]/60 border border-[var(--border-color)]/20 rounded-lg p-3">
              {/* Desktop: Horizontal Layout, Mobile: Vertical Layout */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                {/* Search Field */}
                <div className="flex-1 lg:max-w-xs">
                  <div className="relative">
                    <input
                      id="search"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[var(--border-color)]/40 rounded-md bg-[var(--color-panel)]/30 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-[var(--text-panel)] hover:border-blue-400/40 placeholder:text-[var(--text-color)] placeholder:opacity-50 text-sm"
                      placeholder="검색..."
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 left-3">
                      <Icon name="Search" size={14} className="text-[var(--text-color)] opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {filters.map((filter) => (
                      <div key={filter.key} className="min-w-0">
                        <div className="relative">
                          {filter.icon && (
                            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 z-10">
                              <Icon name={filter.icon} size={12} className="text-[var(--text-color)] opacity-50" />
                            </div>
                          )}
                          {filter.type === 'select' ? (
                            <select
                              id={filter.key}
                              value={state.filters[filter.key] || ''}
                              onChange={(e) => setFilter(filter.key, e.target.value)}
                              className={`w-full ${filter.icon ? 'pl-7' : 'pl-2.5'} pr-8 py-2 border border-[var(--border-color)]/40 rounded-md focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/40 bg-[var(--color-panel)]/30 text-[var(--text-panel)] transition-all hover:border-blue-400/40 appearance-none text-sm bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNSA1TDkgMSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-right-3 bg-center`}
                            >
                              <option value="">{filter.label}</option>
                              {filter.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={filter.key}
                              type="text"
                              value={state.filters[filter.key] || ''}
                              onChange={(e) => setFilter(filter.key, e.target.value)}
                              className={`w-full ${filter.icon ? 'pl-7' : 'pl-2.5'} pr-2.5 py-2 border border-[var(--border-color)]/40 rounded-md focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/40 bg-[var(--color-panel)]/30 text-[var(--text-panel)] transition-all hover:border-blue-400/40 placeholder:text-[var(--text-color)] placeholder:opacity-50 text-sm`}
                              placeholder={filter.placeholder || filter.label}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-[var(--button)]/60 hover:bg-[var(--hover)] rounded-md border border-[var(--border-color)]/40 text-[var(--button-text)] transition-all hover:shadow-sm font-medium text-sm flex items-center gap-1.5"
                  >
                    <Icon name="RotateCcw" size={12} />
                    <span className="hidden sm:inline">초기화</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Data Table with Modern Design */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3 rounded-xl"></div>
          <div className="relative bg-[var(--color-modal)]/90 backdrop-blur-xl border border-[var(--border-color)]/20 rounded-xl overflow-hidden shadow-lg">
            {/* Streamlined Table Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)]/20 bg-gradient-to-r from-[var(--color-header)]/30 to-[var(--color-panel)]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="relative p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-xl border border-emerald-500/20">
                      <Icon name="Database" size={24} className="text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-panel)]">
                      {title} 목록
                    </h2>
                    <p className="text-[var(--text-color)] opacity-70 mt-0.5 text-sm">
                      총 {pagination.totalCount.toLocaleString()}개의 항목
                    </p>
                  </div>
                </div>
                {actionButtons && (
                  <div className="hidden sm:flex items-center gap-3">
                    {actionButtons}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Table Component */}
            <div className="relative">
              <Table<T>
                loading={loading}
                data={data}
                onRowClick={onRowClick}
                rowKey={rowKey as any}
                rowSelection={selectedIds.length > 0 ? {
                  type: 'checkbox',
                  selectedRowKeys: selectedIds,
                  onSelect: handleSelect,
                  onSelectAll: handleSelectAll,
                  getCheckboxProps: (_) => ({
                    disabled: bulkActionLoading
                  })
                } : undefined}
                columns={columns}
              />
            </div>

            {/* Streamlined Pagination */}
            <div className="px-6 py-4 bg-gradient-to-r from-[var(--color-panel)]/20 to-[var(--color-header)]/20 border-t border-[var(--border-color)]/20">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={handlePageChange}
                showInfo={true}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Additional Content with Enhanced Styling */}
        {children && (
          <div className="mt-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
              <div className="relative bg-[var(--color-modal)]/60 backdrop-blur-xl border border-[var(--border-color)] /30 rounded-2xl p-8">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}