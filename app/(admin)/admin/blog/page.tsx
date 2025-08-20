"use client";

import React, { useState } from "react";
import Image from 'next/image';
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Admin } from "@/components/layout/Admin";
import { useAdminPage } from "@/hooks/admin";
import { BlogCreateModal } from "@/components/ui/modal/blog/BlogCreate";
import { BlogEditMultilangModal as BlogEditModal } from "@/components/ui/modal/blog/BlogEditMultilang";
import { BlogViewStatsModal } from "@/components/ui/modal/blog/BlogViewStats";
import { BlogLikeStatsModal } from "@/components/ui/modal/blog/BlogLikeStats";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { BlogData } from "@/types/admin/pages";
import { FilterConfig, StatCardConfig } from "@/types/layout/admin";
import { formatDateShort, formatDateFull } from "@/utils/date/format";
import "@/styles/admin/category.css";

// Default placeholder images for blog posts
const DEFAULT_BLOG_IMAGE = "https://placehold.co/100x100.png?text=Blog&w=1080&q=75";
const DEFAULT_IMAGES = [
  "https://placehold.co/100x100.png?text=1&w=1080&q=75",
  "https://placehold.co/100x100.png?text=2&w=1080&q=75",
  "https://placehold.co/100x100.png?text=3&w=1080&q=75"
];

// Blog management page main component
export default function AdminBlogPage() {
  // Custom modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogData | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogData | null>(null);
  const [viewStatsPost, setViewStatsPost] = useState<BlogData | null>(null);
  const [likeStatsPost, setLikeStatsPost] = useState<BlogData | null>(null);
  
  // Sequential image display states (like category page)
  const [visibleImages, setVisibleImages] = useState<{ [key: string]: boolean }>({});
  
  // Page state management
  const [pageState, pageActions] = useAdminPage<BlogData>({
    endpoint: '/api/admin/blog',
    dataKey: 'posts',
    statsEndpoint: '/api/admin/blog/stats',
    initialFilters: {
      category: '',
      status: '',
      type: ''
    }
  });

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (pageState.selectedIds.length === 0) return;
    
    const confirmed = confirm(`선택된 ${pageState.selectedIds.length}개의 블로그 글을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      const { data } = await api.delete<APIResult>('/api/admin/blog', {
        data: {
          postIds: pageState.selectedIds
        }
      });

      if (data.success) {
        alert(data.data.message || '선택된 글이 삭제되었습니다.');
        pageActions.clearSelection();
        pageActions.refresh();
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      const message = error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.';
      alert(message);
    }
  };

  // Publish/Unpublish handler
  const handlePublishToggle = async (post: BlogData) => {
    const currentStatus = post?.status || 'draft';
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? '게시' : '비공개';
    
    try {
      const { data } = await api.put<APIResult>(`/api/admin/blog/${post.uid}/status`, {
        status: newStatus
      });

      if (data.success) {
        alert(`글이 ${action}되었습니다.`);
        pageActions.refresh();
      }
    } catch (error) {
      console.error('Publish toggle error:', error);
      const message = error instanceof Error ? error.message : `${action} 중 오류가 발생했습니다.`;
      alert(message);
    }
  };

  // Statistics cards configuration
  const stats: StatCardConfig[] = [
    {
      title: "전체 글",
      value: pageState.stats?.total || 0,
      change: {
        value: `+${pageState.stats?.thisMonth || 0}`,
        trend: "up" as const,
        period: "이번 달",
      },
      icon: "FileText",
      variant: "primary"
    },
    {
      title: "게시된 글",
      value: pageState.stats?.published || 0,
      change: {
        value: `${pageState.stats?.publishRate || 0}%`,
        trend: "neutral" as const,
        period: "게시율",
      },
      icon: "Eye",
      variant: "success"
    },
    {
      title: "조회수",
      value: pageState.stats?.totalViews || 0,
      change: {
        value: `+${pageState.stats?.todayViews || 0}`,
        trend: "up" as const,
        period: "오늘",
      },
      icon: "TrendingUp",
      variant: "info"
    },
    {
      title: "좋아요",
      value: pageState.stats?.totalLikes || 0,
      change: {
        value: `+${pageState.stats?.todayLikes || 0}`,
        trend: "up" as const,
        period: "오늘",
      },
      icon: "Heart",
      variant: "warning"
    }
  ];

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      icon: 'Tag',
      options: [
        { value: '', label: '모든 카테고리' },
        ...(pageState.stats?.categories || []).map((cat: any) => ({
          value: cat.uid,
          label: cat.name
        }))
      ]
    },
    {
      key: 'status',
      label: '상태',
      type: 'select',
      icon: 'CheckCircle',
      options: [
        { value: '', label: '모든 상태' },
        { value: 'published', label: '게시됨' },
        { value: 'draft', label: '📝 임시저장' }
      ]
    },
    {
      key: 'type',
      label: '유형',
      type: 'select',
      icon: 'Layers',
      options: [
        { value: '', label: '모든 유형' },
        { value: 'post', label: '📄 일반' },
        { value: 'notice', label: '📢 공지' }
      ]
    }
  ];

  // Table columns configuration - 모바일 최적화
  const columns = [
    {
      title: '이미지',
      dataIndex: 'images',
      key: 'images',
      width: '60px',
      className: 'w-[60px] min-w-[60px]',
      render: (_: any, record: BlogData) => {
        // Get images array - handle various formats
        let blogImages: string[] = [];
        if (Array.isArray(record.images)) {
          blogImages = record.images;
        } else if (typeof record.images === 'object' && record.images) {
          blogImages = [record.images.main, ...(record.images.additional || [])].filter(Boolean);
        } else if (record.image) {
          blogImages = [record.image];
        }
        
        // Use default images if no images available
        if (blogImages.length === 0) {
          blogImages = DEFAULT_IMAGES;
        }
        
        const mainImage = blogImages[0] || DEFAULT_BLOG_IMAGE;
        
        return (
          <div className="relative flex-shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded">
              <Image
                src={mainImage}
                alt="Blog image"
                fill
                className="object-cover"
              />
              
              {/* Image count indicator */}
              {blogImages.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[7px] px-0.5 rounded-tl">
                  +{blogImages.length - 1}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: '글 정보',
      dataIndex: 'title',
      key: 'title',
      className: 'min-w-0 flex-1',
      render: (title: string, record: BlogData) => {
        return (
          <div className="min-w-0">
            <div className="font-medium text-[var(--text-color)] text-xs sm:text-sm line-clamp-1">
              {title}
            </div>
            <div className="text-[9px] sm:text-xs text-[var(--text-color)] opacity-60 line-clamp-1">
              {record.description || '설명 없음'}
            </div>
            
            {/* 모바일에서 추가 정보 표시 */}
            <div className="flex items-center gap-2 mt-1 sm:hidden">
              {/* 카테고리 */}
              {record.category && (
                <Badge className="text-primary border-primary/20 text-[8px] py-0 px-1">
                  {record.category.name}
                </Badge>
              )}
              
              {/* 상태 */}
              <div className="flex items-center gap-1">
                {(record.status || 'draft') === 'published' ? (
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" title="게시됨"></span>
                ) : (
                  <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" title="임시저장"></span>
                )}
              </div>
              
              {/* 통계 */}
              <div className="flex items-center gap-2 text-[8px] text-gray-500">
                <span className="flex items-center gap-0.5">
                  <Icon name="Eye" size={8} />
                  {record?.views || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <Icon name="Heart" size={8} />
                  {record?.likeCount || 0}
                </span>
              </div>
            </div>

            {/* 태그는 더 작게 */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1 sm:hidden">
                {record.tags.slice(0, 2).map((tag: any, idx: number) => (
                  <span key={idx} className="text-[8px] text-gray-400">
                    #{typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: '90px',
      className: 'align-middle w-[90px]',
      render: (category: any) => category ? (
        <Badge className="text-primary border-primary/20 whitespace-nowrap text-[10px] sm:text-xs">
          {category.name}
        </Badge>
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      )
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: '70px',
      className: 'align-middle w-[70px]',
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string; icon: string }> = {
          post: { label: '일반', color: 'whitespace-nowrap bg-blue-100 text-blue-700 border-blue-200', icon: '📄' },
          notice: { label: '공지', color: 'whitespace-nowrap bg-red-100 text-red-700 border-red-200', icon: '📢' }
        };
        const config = typeMap[type] || typeMap.post;
        return (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${config.color}`}>
            <span className="hidden sm:inline">{config.icon}</span> {config.label}
          </span>
        );
      }
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: '50px',
      className: 'align-middle w-[50px]',
      render: (status: string) => {
        const actualStatus = status || 'draft';
        return (
          <div className="text-center">
            {actualStatus === 'published' ? (
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="게시됨"></span>
            ) : (
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" title="임시저장"></span>
            )}
          </div>
        );
      }
    },
    {
      title: '통계',
      key: 'stats',
      width: '60px',
      className: 'align-middle w-[60px]',
      render: (_value: any, record: BlogData) => (
        <div className="flex flex-col gap-0.5 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <Icon name="Eye" size={10} />
            <span>{record?.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="Heart" size={10} />
            <span>{record?.likeCount || 0}</span>
          </div>
        </div>
      )
    },
    {
      title: '작성일',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: '70px',
      className: 'align-middle w-[70px]',
      render: (createdTime: string) => (
        <div className="text-[10px] text-gray-500">
          {formatDateShort(createdTime)}
        </div>
      )
    },
    {
      title: '작업',
      key: 'actions',
      width: '70px',
      className: 'text-center align-middle w-[70px] min-w-[70px]',
      render: (_value: any, record: BlogData) => (
        <div className="flex items-center justify-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingPost(record);
            }}
            className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 active:bg-green-100 rounded-lg touch-manipulation transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="수정"
            aria-label={`${record.title} 수정`}
          >
            <Icon name="Edit" size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingPost(record);
            }}
            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg touch-manipulation transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="삭제"
            aria-label={`${record.title} 삭제`}
          >
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      )
    }
  ];

  // Action buttons
  const actionButtons = (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
      >
        <Icon name="Plus" size={16} />
        <span className="hidden sm:inline">새 글 작성</span>
        <span className="sm:hidden">작성</span>
      </button>
      <button
        onClick={() => pageActions.refresh()}
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-colors text-sm sm:text-base"
      >
        <Icon name="RotateCcw" size={16} />
        <span className="hidden sm:inline">새로고침</span>
      </button>
    </div>
  );
  
  // Mobile actions for floating button
  const mobileActions = [
    {
      label: '새 글 작성',
      icon: 'FileText',
      onClick: () => setIsCreateModalOpen(true),
      variant: 'primary' as const
    },
    {
      label: '새로고침',
      icon: 'RotateCcw',
      onClick: () => pageActions.refresh(),
      variant: 'default' as const
    },
    {
      label: '필터 초기화',
      icon: 'FilterX',
      onClick: () => pageActions.clearFilters(),
      variant: 'default' as const
    }
  ];

  // Bulk action buttons
  const bulkActionButtons = pageState.selectedIds.length > 0 ? (
    <div className="flex items-center gap-3">
      <button
        onClick={handleBulkDelete}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <Icon name="Trash2" size={16} />
        선택 삭제 ({pageState.selectedIds.length})
      </button>
      <button
        onClick={() => pageActions.clearSelection()}
        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-colors"
      >
        <Icon name="X" size={16} />
        선택 해제
      </button>
    </div>
  ) : null;

  return (
    <>
      <Admin
        title="블로그 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        mobileActions={mobileActions}
        bulkActionButtons={bulkActionButtons}
        onRowClick={(record) => setEditingPost(record)}
        rowKey="uid"
      />

      {/* Blog creation modal */}
      <BlogCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          pageActions.refresh();
        }}
      />

      {/* Blog edit modal */}
      <BlogEditModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost ? {
          id: editingPost.uid,
          ...editingPost,
          status: editingPost.status || 'draft',
          createdTime: editingPost.createdTime ? formatDateFull(editingPost.createdTime) : '',
          updatedTime: editingPost.updatedTime ? formatDateFull(editingPost.updatedTime) : '',
          publishedAt: editingPost.publishedAt ? formatDateFull(editingPost.publishedAt) : undefined
        } : null}
        onSuccess={() => {
          setEditingPost(null);
          pageActions.refresh();
        }}
      />

      {/* Delete modal */}
      <DeleteModal
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onUpdate={() => pageActions.refresh()}
        title="블로그 글 삭제"
        entity={deletingPost}
        entityName="블로그 글"
        endpoint={`/api/admin/blog/${deletingPost?.uid}`}
        getDisplayName={(entity) => entity.title}
        getDangerLevel={() => 'medium'}
        onSuccess={() => {
          setDeletingPost(null);
          pageActions.refresh();
        }}
      />

      {/* View stats modal */}
      <BlogViewStatsModal
        isOpen={!!viewStatsPost}
        onClose={() => setViewStatsPost(null)}
        postId={viewStatsPost?.uid || null}
        postTitle={viewStatsPost?.title}
      />

      {/* Like stats modal */}
      <BlogLikeStatsModal
        isOpen={!!likeStatsPost}
        onClose={() => setLikeStatsPost(null)}
        postId={likeStatsPost?.uid || null}
        postTitle={likeStatsPost?.title}
      />
    </>
  );
}