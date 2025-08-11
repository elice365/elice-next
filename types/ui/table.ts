// UI Table Component Type Definitions

import { ReactNode } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
}

export interface TableColumn<T = any> {
    key: string;
    title: string;
    render?: (value: any, record: T, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface TableSelectionConfig<T = any> {
    type: 'checkbox';
    selectedRowKeys?: string[];
    onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
    onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
    preserveSelectedRowKeys?: boolean;
}

export interface TableProps<T = any> {
    columns: TableColumn<T>[];
    data: T[];
    loading?: boolean;
    onRowClick?: (record: T, index: number) => void;
    rowKey?: keyof T | ((record: T) => string);
    className?: string;
    emptyText?: string;
    loadingText?: string;
    rowSelection?: TableSelectionConfig<T>;
}

export interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly data: readonly T[];
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