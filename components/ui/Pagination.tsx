"use client";

import { memo } from "react";
import { Icon } from "./Icon";

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

const sizeClasses = {
  sm: {
    container: 'px-4 py-2',
    button: 'px-2 py-1 text-xs',
    gap: 'gap-1',
    icon: 12
  },
  md: {
    container: 'px-6 py-4',
    button: 'px-3 py-2 text-sm',
    gap: 'gap-2',
    icon: 16
  },
  lg: {
    container: 'px-8 py-6',
    button: 'px-4 py-3 text-base',
    gap: 'gap-3',
    icon: 20
  }
};

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrev,
  onPageChange,
  className = "",
  showInfo = true,
  size = 'md'
}: PaginationProps) {
  const sizeClass = sizeClasses[size];

  // 페이지 그룹 계산 (5개 단위)
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisiblePages) {
      // 총 페이지가 5개 이하면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 기준으로 5개 페이지 표시
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // 끝 페이지가 총 페이지 수에 가까우면 시작 페이지 조정
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 첫 페이지/마지막 페이지로 이동할 수 있는지 확인
  const canGoToFirst = currentPage > 1;
  const canGoToLast = currentPage < totalPages;

  // 이전/다음 그룹으로 이동
  const goToPreviousGroup = () => {
    const newPage = Math.max(1, pageNumbers[0] - 5);
    onPageChange(newPage);
  };

  const goToNextGroup = () => {
    const newPage = Math.min(totalPages, pageNumbers[pageNumbers.length - 1] + 1);
    onPageChange(newPage);
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`border-t border-[var(--border-color)]  from-background to-muted/5 ${sizeClass.container} ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* 페이지 정보 */}
        {showInfo && (
          <div className={`flex items-center justify-center sm:justify-start ${sizeClass.gap} text-sm text-[var(--text-color)] opacity-70 order-2 sm:order-1`}>
            <Icon name="Book" size={sizeClass.icon} />
            <span className="text-center sm:text-left">
              <span className="hidden sm:inline">{currentPage}페이지 / 전체 {totalPages}페이지 (총 {totalCount.toLocaleString()}개)</span>
              <span className="sm:hidden">{currentPage}/{totalPages} ({totalCount.toLocaleString()}개)</span>
            </span>
          </div>
        )}

        {/* 페이지네이션 컨트롤 */}
        <div className={`flex items-center justify-center flex-wrap ${sizeClass.gap} order-1 sm:order-2`}>
          {/* 첫 페이지로 - 모바일에서는 숨김 */}
          <button
            onClick={() => onPageChange(1)}
            disabled={!canGoToFirst}
            className={`hidden sm:flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
            title="첫 페이지"
          >
            <Icon name="ChevronsLeft" size={sizeClass.icon} />
            <span>처음</span>
          </button>

          {/* 이전 그룹 - 모바일에서는 숨김 */}
          {pageNumbers[0] > 1 && (
            <button
              onClick={goToPreviousGroup}
              className={`hidden sm:flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
              title="이전 그룹"
            >
              <Icon name="MoreHorizontal" size={sizeClass.icon} />
            </button>
          )}

          {/* 이전 페이지 */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className={`flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
          >
            <Icon name="ChevronLeft" size={sizeClass.icon} />
            <span className="hidden sm:inline">이전</span>
          </button>

          {/* 페이지 번호들 */}
          <div className={`flex items-center ${sizeClass.gap}`}>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`${sizeClass.button} border rounded-lg transition-all duration-200 font-medium ${pageNum === currentPage
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'border-[var(--border-color)]  hover:bg-[var(--hover)] text-[var(--text-color)]'
                  }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          {/* 다음 페이지 */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className={`flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
          >
            <span className="hidden sm:inline">다음</span>
            <Icon name="ChevronRight" size={sizeClass.icon} />
          </button>

          {/* 다음 그룹 - 모바일에서는 숨김 */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <button
              onClick={goToNextGroup}
              className={`hidden sm:flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
              title="다음 그룹"
            >
              <Icon name="MoreHorizontal" size={sizeClass.icon} />
            </button>
          )}

          {/* 마지막 페이지로 - 모바일에서는 숨김 */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoToLast}
            className={`hidden sm:flex items-center gap-1 ${sizeClass.button} border border-[var(--border-color)]  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hover)] text-[var(--text-color)] transition-all duration-200`}
            title="마지막 페이지"
          >
            <span>마지막</span>
            <Icon name="ChevronsRight" size={sizeClass.icon} />
          </button>
        </div>
      </div>
    </div>
  );
});