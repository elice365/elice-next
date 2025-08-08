"use client";

import React, { useState } from "react";
import Image from 'next/image';
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Admin, StatCardConfig, FilterConfig } from "@/components/layout/Admin";
import { useAdminPage } from "@/hooks/admin";
import { BlogCreateModal } from "@/components/ui/modal/blog/BlogCreate";
import { BlogEditModal } from "@/components/ui/modal/blog/BlogEdit";
import { BlogViewStatsModal } from "@/components/ui/modal/blog/BlogViewStats";
import { BlogLikeStatsModal } from "@/components/ui/modal/blog/BlogLikeStats";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { Post } from "@/types/post";

// Admin blog data interface
interface BlogData extends Post {
  publishedAt: Date | null;
  status: 'draft' | 'published';
  views: number;
  _count: {
    likes: number;
    view: number;
  };
}

// Blog management page main component
export default function AdminBlogPage() {
  // Custom modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogData | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogData | null>(null);
  const [viewStatsPost, setViewStatsPost] = useState<BlogData | null>(null);
  const [likeStatsPost, setLikeStatsPost] = useState<BlogData | null>(null);
  
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
        { value: 'published', label: '✅ 게시됨' },
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

  // Table columns configuration
  const columns = [
    {
      title: '이미지',
      dataIndex: 'images',
      key: 'image',
      width: '80px',
      render: (images: any) => {
        const mainImage = Array.isArray(images) ? images[0] : images?.main;
        return mainImage ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
            <Image
              src={mainImage}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Icon name="Image" size={20} className="text-gray-400" />
          </div>
        );
      }
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: BlogData) => (
        <div>
          <div className="font-medium text-[var(--text-color)] line-clamp-1">{title}</div>
          <div className="text-sm text-[var(--text-color)] opacity-60 line-clamp-1 mt-1">
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: '120px',
      render: (category: any) => category ? (
        <Badge className="text-primary border-primary/20 whitespace-nowrap">
          {category.name}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: '100px',
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string; icon: string }> = {
          post: { label: '일반', color: 'whitespace-nowrap bg-blue-100 text-blue-700 border-blue-200', icon: '📄' },
          notice: { label: '공지', color: 'whitespace-nowrap bg-red-100 text-red-700 border-red-200', icon: '📢' }
        };
        const config = typeMap[type] || typeMap.post;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            {config.icon} {config.label}
          </span>
        );
      }
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: '100px',
      render: (status: string) => {
        const actualStatus = status || 'draft';
        return (
          <div className="flex items-center gap-2">
            {actualStatus === 'published' ? (
              <Badge className="bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                게시됨
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                <Icon name="Edit" size={12} className="mr-1" />
                임시저장
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      title: '통계',
      key: 'stats',
      width: '150px',
      render: (value: any, record: BlogData) => (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewStatsPost(record);
            }}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
            title="조회 통계 보기"
          >
            <Icon name="Eye" size={14} />
            <span>{(record?.views || 0).toLocaleString()}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLikeStatsPost(record);
            }}
            className="flex items-center gap-1 hover:text-pink-600 transition-colors cursor-pointer"
            title="좋아요 통계 보기"
          >
            <Icon name="Heart" size={14} />
            <span>{(record?.likeCount || 0).toLocaleString()}</span>
          </button>
        </div>
      )
    },
    {
      title: '작성일',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: '140px',
      render: (createdTime: string) => (
        <div className="text-sm whitespace-nowrap">
          <div className="text-[var(--text-color)]">
            {new Date(createdTime).toLocaleDateString('ko-KR')}
          </div>
          <div className="text-[var(--text-color)] opacity-60">
            {new Date(createdTime).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )
    },
    {
      title: '작업',
      key: 'actions',
      width: '120px',
      render: (value: any, record: BlogData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePublishToggle(record);
            }}
            className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
            title={(record?.status || 'draft') === 'published' ? '비공개' : '게시'}
          >
            <Icon 
              name={(record?.status || 'draft') === 'published' ? 'EyeOff' : 'Eye'} 
              size={16} 
              className="text-[var(--text-color)] opacity-60" 
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingPost(record);
            }}
            className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
            title="수정"
          >
            <Icon name="Edit" size={16} className="text-[var(--text-color)] opacity-60" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingPost(record);
            }}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="삭제"
          >
            <Icon name="Trash2" size={16} className="text-red-500" />
          </button>
        </div>
      )
    }
  ];

  // Action buttons
  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Icon name="Plus" size={16} />
        새 글 작성
      </button>
      <button
        onClick={() => pageActions.refresh()}
        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-colors"
      >
        <Icon name="RotateCcw" size={16} />
        새로고침
      </button>
    </div>
  );

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
          createdTime: editingPost.createdTime ? new Date(editingPost.createdTime).toLocaleString('ko-KR') : '',
          updatedTime: editingPost.updatedTime ? new Date(editingPost.updatedTime).toLocaleString('ko-KR') : '',
          publishedAt: editingPost.publishedAt ? new Date(editingPost.publishedAt).toLocaleString('ko-KR') : undefined
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