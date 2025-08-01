"use client";

import { memo, ReactNode, useState, useMemo, useCallback } from "react";

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

export const Table = memo(function Table<T = any>({
    columns,
    data,
    loading = false,
    onRowClick,
    rowKey = 'id' as keyof T,
    className = "",
    emptyText = "데이터가 없습니다",
    loadingText = "로딩 중...",
    rowSelection
}: TableProps<T>) {
    // Selection state management
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(
        rowSelection?.selectedRowKeys || []
    );

    const getRowKey = (record: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return String(record[rowKey] || index);
    };

    const getValue = (record: T, key: string) => {
        return key.split('.').reduce((obj, k) => obj?.[k], record as any);
    };

    // Selection handlers
    const handleSelectRow = useCallback((record: T, selected: boolean) => {
        const key = getRowKey(record, data.indexOf(record));
        const newSelectedKeys = selected
            ? [...selectedRowKeys, key]
            : selectedRowKeys.filter(k => k !== key);

        setSelectedRowKeys(newSelectedKeys);

        // Get selected records
        const selectedRecords = data.filter((item, index) =>
            newSelectedKeys.includes(getRowKey(item, index))
        );

        rowSelection?.onSelect?.(record, selected, selectedRecords);
    }, [selectedRowKeys, data, rowSelection, getRowKey]);

    const handleSelectAll = useCallback((selected: boolean) => {
        const allKeys = data.map((record, index) => getRowKey(record, index));
        const newSelectedKeys = selected ? allKeys : [];

        setSelectedRowKeys(newSelectedKeys);

        const selectedRecords = selected ? data : [];
        const changeRows = selected ? data : data.filter((item, index) =>
            selectedRowKeys.includes(getRowKey(item, index))
        );

        rowSelection?.onSelectAll?.(selected, selectedRecords, changeRows);
    }, [data, selectedRowKeys, rowSelection, getRowKey]);

    // Calculate selection state
    const selectedCount = selectedRowKeys.length;
    const totalCount = data.length;
    const isAllSelected = totalCount > 0 && selectedCount === totalCount;
    const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

    // Sync external selectedRowKeys with internal state
    useMemo(() => {
        if (rowSelection?.selectedRowKeys !== undefined) {
            setSelectedRowKeys(rowSelection.selectedRowKeys);
        }
    }, [rowSelection?.selectedRowKeys]);

    // Build columns with selection column if needed
    const finalColumns = useMemo(() => {
        if (!rowSelection) return columns;

        const selectionColumn: TableColumn<T> = {
            key: 'selection',
            title: '',
            headerClassName: 'w-12',
            className: 'w-12',
            render: (_, record, index) => {
                const key = getRowKey(record, index);
                const isSelected = selectedRowKeys.includes(key);
                const checkboxProps = rowSelection.getCheckboxProps?.(record) || {};

                return (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={checkboxProps.disabled}
                        onChange={(e) => handleSelectRow(record, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-[var(--border-color)]  rounded focus:ring-blue-500 focus:ring-2"
                    />
                );
            }
        };

        return [selectionColumn, ...columns];
    }, [columns, rowSelection, selectedRowKeys, handleSelectRow, getRowKey]);

    if (loading) {
        return (
            <div className={`bg-[var(--background)] overflow-hidden ${className}`}>
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--hover-primary)]"></div>
                    <p className="mt-4 text-[var(--text-color)] opacity-70">{loadingText}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-[var(--background)] overflow-hidden ${className}`}>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full" role="table" aria-label="데이터 테이블">
                    <thead className="bg-[var(--color-header)] border-b-2 border-[var(--border-color)]">
                        <tr>
                            {finalColumns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-header)] tracking-wide ${column.headerClassName || ""}`}
                                >
                                    {column.key === 'selection' && rowSelection ? (
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={(input) => {
                                                if (input) input.indeterminate = isIndeterminate;
                                            }}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-[var(--border-color)]  rounded focus:ring-blue-500 focus:ring-2 touch-manipulation"
                                        />
                                    ) : (
                                        column.title
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={finalColumns.length}
                                    className="px-6 py-12 text-center text-[var(--text-color)] opacity-60"
                                >
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            data.map((record, index) => {
                                const rowKeyValue = getRowKey(record, index);
                                const isRowSelected = selectedRowKeys.includes(rowKeyValue);
                                return (
                                    <tr
                                        key={rowKeyValue}
                                        onClick={() => onRowClick?.(record, index)}
                                        onKeyDown={(e) => {
                                            if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                                                e.preventDefault();
                                                onRowClick(record, index);
                                            }
                                        }}
                                        aria-pressed={isRowSelected}
                                        aria-label={onRowClick ? `행 ${index + 1} 선택` : undefined}
                                        className={`${onRowClick ? 'hover:bg-[var(--hover)] hover:text-[var(--hover-text)] hover:shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--hover-primary)] focus:ring-inset' : ''} ${isRowSelected ? 'bg-[var(--selected)] border-l-4 border-l-[var(--hover-primary)] shadow-sm' : ''
                                            } transition-all duration-200`}
                                    >
                                        {finalColumns.map((column) => {
                                            const value = getValue(record, column.key);
                                            const content = column.render
                                                ? column.render(value, record, index)
                                                : value;

                                            return (
                                                <td
                                                    key={column.key}
                                                    className={`px-6 py-4 text-[var(--text-color)] ${column.className || ""}`}
                                                >
                                                    {content}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View - Shown only on mobile */}
            <div className="md:hidden">
                {/* Mobile header with selection controls */}
                {rowSelection && data.length > 0 && (
                    <div className="p-4 border-b border-[var(--border-color)] bg-[var(--color-header)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    ref={(input) => {
                                        if (input) input.indeterminate = isIndeterminate;
                                    }}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-[var(--border-color)]  rounded focus:ring-blue-500 focus:ring-2 touch-manipulation"
                                />
                                <span className="text-sm font-medium text-[var(--color-text-header)]">
                                    전체 선택
                                </span>
                            </div>
                            {selectedCount > 0 && (
                                <span className="text-sm text-[var(--hover-primary)] font-medium">
                                    {selectedCount}개 선택됨
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile data cards */}
                <div className="divide-y divide-[var(--border-color)]">
                    {data.length === 0 ? (
                        <div className="p-12 text-center text-[var(--text-color)] opacity-60">
                            {emptyText}
                        </div>
                    ) : (
                        data.map((record, index) => {
                            const rowKeyValue = getRowKey(record, index);
                            const isRowSelected = selectedRowKeys.includes(rowKeyValue);

                            return (
                                onRowClick ? (
                                    <button
                                        key={rowKeyValue}
                                        type="button"
                                        onClick={() => onRowClick(record, index)}
                                        aria-pressed={isRowSelected}
                                        aria-label={`항목 ${index + 1} 선택`}
                                        className={`w-full p-4 text-left bg-transparent border-none cursor-pointer active:bg-[var(--hover)] active:text-[var(--hover-text)] focus:outline-none focus:ring-2 focus:ring-[var(--hover-primary)] focus:ring-inset ${isRowSelected ? 'bg-[var(--selected)] border-l-4 border-l-[var(--hover-primary)] shadow-sm' : ''} touch-manipulation transition-all duration-200`}
                                    >
                                        {/* Button content for clickable rows */}
                                        {rowSelection && (
                                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-color)]">
                                                <input
                                                    type="checkbox"
                                                    checked={isRowSelected}
                                                    disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectRow(record, e.target.checked);
                                                    }}
                                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-[var(--border-color)] rounded focus:ring-blue-500 focus:ring-2 touch-manipulation"
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    항목 {index + 1}
                                                </span>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {finalColumns
                                                .filter(column => column.key !== 'selection')
                                                .map((column) => {
                                                    const value = getValue(record, column.key);
                                                    const content = column.render
                                                        ? column.render(value, record, index)
                                                        : value;

                                                    if (!content && content !== 0) return null;

                                                    return (
                                                        <div key={column.key} className="flex flex-col gap-1">
                                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                {column.title}
                                                            </div>
                                                            <div className="text-sm text-[var(--text-color)]">
                                                                {content}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </button>
                                ) : (
                                    <div
                                        key={rowKeyValue}
                                        className={`p-4 text-left ${isRowSelected ? 'bg-[var(--selected)] border-l-4 border-l-[var(--hover-primary)] shadow-sm' : ''} touch-manipulation transition-all duration-200`}
                                    >
                                        {/* Selection checkbox for mobile */}
                                        {rowSelection && (
                                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border-color)] ">
                                                <input
                                                    type="checkbox"
                                                    checked={isRowSelected}
                                                    disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectRow(record, e.target.checked);
                                                    }}
                                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-[var(--border-color)]  rounded focus:ring-blue-500 focus:ring-2 touch-manipulation"
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    항목 {index + 1}
                                                </span>
                                            </div>
                                        )}

                                        {/* Mobile card content */}
                                        <div className="space-y-3">
                                            {finalColumns
                                                .filter(column => column.key !== 'selection')
                                                .map((column) => {
                                                    const value = getValue(record, column.key);
                                                    const content = column.render
                                                        ? column.render(value, record, index)
                                                        : value;

                                                    // Skip empty content
                                                    if (!content && content !== 0) return null;

                                                    return (
                                                        <div key={column.key} className="flex flex-col gap-1">
                                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                {column.title}
                                                            </div>
                                                            <div className="text-sm text-[var(--text-color)]">
                                                                {content}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                )
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}) as <T = any>(props: TableProps<T>) => React.ReactElement;