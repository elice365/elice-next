"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Admin, StatCardConfig, FilterConfig } from "@/components/layout/Admin";
import { useAdminPage } from "@/hooks/admin";
import { CategoryCreateModal } from "@/components/ui/modal/category/CategoryCreate";
import { CategoryEditModal } from "@/components/ui/modal/category/CategoryEdit";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import Image from "next/image";
import "@/styles/admin-category.css";

// Category data interface
interface CategoryData {
  uid: string;
  code: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  parent?: CategoryData | null;
  children?: CategoryData[];
  _count?: {
    posts: number;
    children: number;
  };
  image?: string;
  images?: string[]; // Additional images for sequential display
}

// Default placeholder images
const DEFAULT_CATEGORY_IMAGE = "https://placehold.co/100x100.png?text=Category&w=1080&q=75";
const DEFAULT_IMAGES = [
  "https://placehold.co/100x100.png?text=1&w=1080&q=75",
  "https://placehold.co/100x100.png?text=2&w=1080&q=75",
  "https://placehold.co/100x100.png?text=3&w=1080&q=75"
];

// Category management page main component
export default function AdminCategoryPage() {
  // Custom modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryData | null>(null);
  
  // Sequential image display states
  const [visibleImages, setVisibleImages] = useState<{ [key: string]: boolean }>({});
  
  // Page state management
  const [pageState, pageActions] = useAdminPage<CategoryData>({
    endpoint: '/api/admin/category',
    dataKey: 'categories',
    statsEndpoint: '/api/admin/category/stats',
    initialFilters: {
      level: '',
      parent: ''
    }
  });

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (pageState.selectedIds.length === 0) return;
    
    const confirmed = confirm(`선택된 ${pageState.selectedIds.length}개의 카테고리를 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.`);
    if (!confirmed) return;

    try {
      const { data } = await api.delete<APIResult>('/api/admin/category', {
        data: {
          categoryIds: pageState.selectedIds
        }
      });

      if (data.success) {
        alert(data.data.message || '선택된 카테고리가 삭제되었습니다.');
        pageActions.clearSelection();
        pageActions.refresh();
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Statistics cards configuration with enhanced styling
  const stats: StatCardConfig[] = [
    {
      title: "전체 카테고리",
      value: pageState.stats?.total || 0,
      change: {
        value: `+${pageState.stats?.thisMonth || 0}`,
        trend: "up" as const,
        period: "이번 달",
      },
      icon: "FolderTree",
      variant: "primary"
    },
    {
      title: "최상위 카테고리",
      value: pageState.stats?.topLevel || 0,
      change: {
        value: `${pageState.stats?.topLevelPercent || 0}%`,
        trend: "neutral" as const,
        period: "전체 대비",
      },
      icon: "Folder",
      variant: "success"
    },
    {
      title: "총 게시글 수",
      value: pageState.stats?.totalPosts || 0,
      change: {
        value: `평균 ${pageState.stats?.avgPostsPerCategory || 0}개`,
        trend: "neutral" as const,
        period: "카테고리당",
      },
      icon: "FileText",
      variant: "info"
    },
    {
      title: "최대 깊이",
      value: pageState.stats?.maxLevel || 0,
      change: {
        value: "레벨",
        trend: "neutral" as const,
        period: "계층 구조",
      },
      icon: "GitBranch",
      variant: "warning"
    }
  ];

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: 'level',
      label: '계층 레벨',
      type: 'select',
      icon: 'GitBranch',
      options: [
        { value: '', label: '모든 레벨' },
        { value: '0', label: '레벨 0 (최상위)' },
        { value: '1', label: '레벨 1' },
        { value: '2', label: '레벨 2' },
        { value: '3', label: '레벨 3' },
        { value: '4', label: '레벨 4' }
      ]
    },
    {
      key: 'parent',
      label: '상위 카테고리',
      type: 'select',
      icon: 'Folder',
      options: [
        { value: '', label: '모든 카테고리' },
        { value: 'null', label: '최상위 카테고리만' },
        ...(pageState.stats?.topCategories || []).map((cat: any) => ({
          value: cat.uid,
          label: cat.name
        }))
      ]
    }
  ];

  // Enhanced table columns with animations
  const columns = [
    {
      title: '카테고리',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CategoryData) => {
        const categoryImages = record.images?.length ? record.images : DEFAULT_IMAGES;
        const showSequential = visibleImages[record.uid] || false;
        
        return (
          <div className="flex items-center gap-2 relative group">
            {/* Hover gradient effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--hover)]/30 to-transparent transform -translate-x-full opacity-0 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-full z-10"></span>
            
            <div className="relative overflow-visible">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mr-2 overflow-hidden rounded-lg">
                <Image
                  src={record.image || DEFAULT_CATEGORY_IMAGE}
                  alt={name}
                  fill
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Sequential image toggle button */}
                {categoryImages.length > 1 && (
                  <div
                    className={`absolute border-r border-b border-[var(--border-color)] bottom-0 right-0 w-6 h-6 bg-black/80 text-white flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-white hover:text-black ${showSequential ? 'rotate-45' : ''}`}
                    onMouseEnter={() => {
                      setVisibleImages({ ...visibleImages, [record.uid]: true });
                    }}
                    onMouseLeave={() => {
                      setVisibleImages({ ...visibleImages, [record.uid]: false });
                    }}
                  >
                    <Icon name="Plus" size={12} />
                  </div>
                )}
              </div>
              
              {/* Sequential images container */}
              {categoryImages.length > 1 && (
                <div
                  className={`absolute left-full top-0 flex gap-1 ml-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${
                    showSequential ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                  }`}
                >
                  {categoryImages.slice(1, 4).map((img, index) => (
                    <div
                      key={`category-img-${img}-${index}`}
                      className={`relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-lg transition-all duration-500 ${showSequential ? 'scale-100' : 'scale-0'}`}
                      style={{
                        transitionDelay: `${index * 100}ms`
                      }}
                    >
                      <Image
                        src={img}
                        alt={`${name} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          
            <div style={{ paddingLeft: `${record.level * 16}px` }} className="flex items-center gap-2">
            {record.level > 0 && (
              <Icon 
                name="CornerDownRight" 
                size={14} 
                className="text-[var(--text-color)] opacity-40 transition-transform duration-300 group-hover:translate-x-1" 
              />
            )}
            <Icon 
              name={(record._count?.children || 0) > 0 ? "FolderOpen" : "Folder"} 
              size={16} 
              className="text-[var(--text-color)] opacity-60 transition-transform duration-300 group-hover:scale-110" 
            />
            <span className="font-medium text-[var(--text-color)] transition-colors duration-300 group-hover:text-[var(--hover-primary)]">
              {name}
            </span>
            </div>
          </div>
        );
      }
    },
    {
      title: '코드',
      dataIndex: 'code',
      key: 'code',
      width: '120px',
      render: (code: string) => (
        <code className="px-2 py-1 bg-badge rounded text-xs font-mono transition-all duration-300 hover:bg-[var(--hover)] hover:shadow-sm">
          {code}
        </code>
      )
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: '120px',
      className: 'hidden md:table-cell',
      render: (slug: string) => (
        <span className="text-sm text-[var(--text-color)] opacity-70 transition-opacity duration-300 hover:opacity-100">
          {slug}
        </span>
      )
    },
    {
      title: '경로',
      dataIndex: 'path',
      key: 'path',
      className: 'hidden lg:table-cell',
      render: (path: string) => (
        <span className="text-sm text-[var(--text-color)] opacity-70 font-mono transition-opacity duration-300 hover:opacity-100">
          {path}
        </span>
      )
    },
    {
      title: '레벨',
      dataIndex: 'level',
      key: 'level',
      width: '80px',
      render: (level: number) => (
        <Badge className={`
          transition-all duration-300 hover:scale-105 hover:shadow-md
          ${level === 0 ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' : ''}
          ${level === 1 ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : ''}
          ${level === 2 ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' : ''}
          ${level === 3 ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : ''}
          ${level >= 4 ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : ''}
        `}>
          레벨 {level}
        </Badge>
      )
    },
    {
      title: '통계',
      key: 'counts',
      width: '140px',
      render: (record: CategoryData) => {
        if (!record) return null;
        const childrenCount = record._count?.children || 0;
        const postsCount = record._count?.posts || 0;
        return (
          <div className="flex items-center gap-3 text-sm group">
            <div className="flex items-center gap-1 text-[var(--text-color)] opacity-60 transition-all duration-300 hover:opacity-100 hover:scale-105">
              <Icon name="FolderTree" size={14} className="transition-transform duration-300 group-hover:rotate-12" />
              <span>{childrenCount}</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--text-color)] opacity-60 transition-all duration-300 hover:opacity-100 hover:scale-105">
              <Icon name="FileText" size={14} className="transition-transform duration-300 group-hover:rotate-12" />
              <span>{postsCount}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: '작업',
      key: 'actions',
      width: '100px',
      render: (record: CategoryData) => (
        <div className="flex items-center gap-2 group">
          <button
            onClick={() => setEditingCategory(record)}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-md relative overflow-hidden"
            title="수정"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -translate-x-full opacity-0 transition-all duration-700 hover:opacity-100 hover:translate-x-full"></span>
            <Icon name="Edit" size={16} className="text-[var(--text-color)] opacity-60 hover:opacity-100 relative z-10" />
          </button>
          <button
            onClick={() => setDeletingCategory(record)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-md relative overflow-hidden"
            title="삭제"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/50 to-transparent transform -translate-x-full opacity-0 transition-all duration-700 hover:opacity-100 hover:translate-x-full"></span>
            <Icon name="Trash2" size={16} className="text-red-500 relative z-10" />
          </button>
        </div>
      )
    }
  ];

  // Enhanced action buttons with animations
  const actionButtons = (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full opacity-0 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-full"></span>
        <Icon name="Plus" size={16} className="relative z-10" />
        <span className="relative z-10">새 카테고리</span>
      </button>
      <button
        onClick={() => pageActions.refresh()}
        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group"
      >
        <Icon name="RotateCcw" size={16} className="transition-transform duration-500 group-hover:rotate-180" />
        <span>새로고침</span>
      </button>
    </div>
  );

  // Enhanced bulk action buttons
  const bulkActionButtons = pageState.selectedIds.length > 0 ? (
    <div className="flex items-center gap-3 flex-wrap animate-fadeIn">
      <button
        onClick={handleBulkDelete}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full opacity-0 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-full"></span>
        <Icon name="Trash2" size={16} className="relative z-10" />
        <span className="relative z-10">선택 삭제 ({pageState.selectedIds.length})</span>
      </button>
      <button
        onClick={() => pageActions.clearSelection()}
        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-all duration-300 hover:scale-105 hover:shadow-md"
      >
        <Icon name="X" size={16} />
        선택 해제
      </button>
    </div>
  ) : null;

  return (
    <>
      <Admin
        title="카테고리 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={(record) => setEditingCategory(record)}
        rowKey="uid"
      />

      {/* Category creation modal */}
      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          pageActions.refresh();
        }}
      />

      {/* Category edit modal */}
      <CategoryEditModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSuccess={() => {
          setEditingCategory(null);
          pageActions.refresh();
        }}
      />

      {/* Delete modal */}
      <DeleteModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onUpdate={() => pageActions.refresh()}
        title="카테고리 삭제"
        entity={deletingCategory}
        entityName="카테고리"
        endpoint={`/api/admin/category/${deletingCategory?.uid}`}
        getDisplayName={(entity) => entity.name}
        getDangerLevel={(entity) => {
          const hasChildren = (entity._count?.children || 0) > 0;
          const hasPosts = (entity._count?.posts || 0) > 0;
          return hasChildren || hasPosts ? 'high' : 'medium';
        }}
        onSuccess={() => {
          setDeletingCategory(null);
          pageActions.refresh();
        }}
      >
        {deletingCategory && (
          <div className="space-y-3">
            {(deletingCategory._count?.children || 0) > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-all duration-300 hover:shadow-md">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>주의:</strong> 이 카테고리는 {deletingCategory._count?.children || 0}개의 하위 카테고리를 가지고 있습니다. 
                  삭제 시 모든 하위 카테고리도 함께 삭제됩니다.
                </p>
              </div>
            )}
            {(deletingCategory._count?.posts || 0) > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg transition-all duration-300 hover:shadow-md">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>경고:</strong> 이 카테고리는 {deletingCategory._count?.posts || 0}개의 게시글을 포함하고 있습니다. 
                  삭제 전에 게시글을 다른 카테고리로 이동하는 것을 권장합니다.
                </p>
              </div>
            )}
          </div>
        )}
      </DeleteModal>
    </>
  );
}