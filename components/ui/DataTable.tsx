/**
 * Generic DataTable component for admin pages
 * Consolidates duplicate table structures across admin interface
 */
import React, { ReactNode } from 'react';
import { Pagination } from '@/components/ui/Pagination';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
  };
  onPaginationChange?: (page: number, pageSize: number) => void;
  onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
  onRowSelect?: (selectedRows: T[], selectedRowKeys: string[]) => void;
  rowSelection?: {
    selectedRowKeys?: string[];
    onSelect?: (record: T, selected: boolean) => void;
    onSelectAll?: (selected: boolean, selectedRows: T[]) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  emptyText?: string;
  className?: string;
  size?: 'small' | 'middle' | 'large';
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  onSort,
  rowSelection,
  rowKey = 'id' as keyof T,
  emptyText = 'No data available',
  className = '',
  size = 'middle'
}: DataTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey]?.toString() || index.toString();
  };

  const getValue = (record: T, key: keyof T | string) => {
    if (typeof key === 'string' && key.includes('.')) {
      // Support nested keys like 'user.name'
      return key.split('.').reduce((obj, k) => obj?.[k], record);
    }
    return record[key as keyof T];
  };

  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      // Simple sort direction toggle - in real app, you'd track current sort state
      onSort(column.key, 'asc');
    }
  };

  const sizeClasses = {
    small: 'text-xs',
    middle: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`data-table ${className}`}>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className={`w-full border-collapse ${sizeClasses[size]}`}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {rowSelection && (
                <th className="w-12 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      rowSelection.onSelectAll?.(e.target.checked, data);
                    }}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={`${String(column.key)}-${index}`}
                  className={`px-4 py-3 font-medium text-gray-900 ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);
                const isSelected = rowSelection?.selectedRowKeys?.includes(key);
                
                return (
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {rowSelection && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={isSelected}
                          onChange={(e) => {
                            rowSelection.onSelect?.(record, e.target.checked);
                          }}
                        />
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${String(column.key)}-${colIndex}`}
                        className={`px-4 py-3 ${
                          column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {column.render
                          ? column.render(getValue(record, column.key), record, index)
                          : (getValue(record, column.key) as React.ReactNode) || '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.current}
            totalPages={Math.ceil(pagination.total / pagination.pageSize)}
            totalCount={pagination.total}
            hasNext={pagination.current < Math.ceil(pagination.total / pagination.pageSize)}
            hasPrev={pagination.current > 1}
            onPageChange={(page) => onPaginationChange?.(page, pagination.pageSize)}
          />
          <div className="mt-2 text-sm text-gray-500 text-center">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to create columns easily
export function createColumns<T>(config: {
  [K in keyof T]?: {
    title: string;
    width?: string;
    sortable?: boolean;
    render?: (value: T[K], record: T) => ReactNode;
  }
} | Column<T>[]): Column<T>[] {
  if (Array.isArray(config)) {
    return config;
  }

  return Object.entries(config).map(([key, options]: [string, any]) => ({
    key: key as keyof T,
    title: options?.title || key,
    width: options?.width,
    sortable: options?.sortable,
    render: options?.render,
  }));
}

export default DataTable;