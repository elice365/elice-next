"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Admin, StatCardConfig, FilterConfig } from "@/components/layout/Admin";
import { useAdminPage } from "@/hooks/admin";
import { NotificationCreateModal } from "@/components/ui/modal/notification/NotificationCreate";
import { NotificationViewModal } from "@/components/ui/modal/notification/NotificationView";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";

// 알림 데이터 타입
interface NotificationData {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  category: string;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  readTime?: string;
  createdTime: string;
}

// 알림 관리 페이지 메인 컴포넌트
export default function AdminNotificationPage() {
  // 커스텀 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<NotificationData | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<NotificationData | null>(null);
  
  // 페이지 상태 관리
  const [pageState, pageActions] = useAdminPage<NotificationData>({
    endpoint: '/api/admin/notification',
    dataKey: 'notifications',
    statsEndpoint: '/api/admin/notification/stats',
    initialFilters: {
      category: '',
      status: ''
    }
  });


  // 대량 삭제 핸들러
  const handleBulkDelete = async () => {
    if (pageState.selectedIds.length === 0) return;
    
    const confirmed = confirm(`선택된 ${pageState.selectedIds.length}개의 알림을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      const { data } = await api.delete<APIResult>('/api/admin/notification', {
        data: {
          notificationIds: pageState.selectedIds
        }
      });

      if (data.success) {
        alert(data.data.message || '선택된 알림이 삭제되었습니다.');
        pageActions.clearSelection();
        pageActions.refresh(); // SPA 방식으로 데이터 새로고침
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('대량 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    pageActions.refresh();
  };

  // 통계 카드 설정
  const stats: StatCardConfig[] = [
    {
      title: "전체 알림",
      value: pageState.stats?.total || 0,
      change: {
        value: `+${pageState.stats?.today || 0}`,
        trend: "up" as const,
        period: "오늘",
      },
      icon: "Bell",
      variant: "primary"
    },
    {
      title: "읽지 않음",
      value: pageState.stats?.unread || 0,
      change: {
        value: `${pageState.stats?.readRate || 0}%`,
        trend: "neutral" as const,
        period: "읽음률",
      },
      icon: "BellRing",
      variant: "warning"
    },
    {
      title: "오늘 발송",
      value: pageState.stats?.today || 0,
      change: {
        value: "0%",
        trend: "neutral" as const,
        period: "어제 대비",
      },
      icon: "Send",
      variant: "success"
    },
    {
      title: "카테고리",
      value: pageState.stats?.categoryStats?.length || 0,
      change: {
        value: "활성",
        trend: "neutral" as const,
        period: "사용 중",
      },
      icon: "Tags",
      variant: "info"
    }
  ];

  // 필터 설정
  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      icon: 'Tag',
      options: [
        { value: '', label: '모든 카테고리' },
        { value: 'system', label: '🔧 시스템' },
        { value: 'notice', label: '📢 공지사항' },
        { value: 'payment', label: '💳 결제' },
        { value: 'notification', label: '📬 일반' }
      ]
    },
    {
      key: 'status',
      label: '상태',
      type: 'select',
      icon: 'CheckCircle',
      options: [
        { value: '', label: '모든 상태' },
        { value: 'read', label: '✅ 읽음' },
        { value: 'unread', label: '📭 읽지 않음' }
      ]
    }
  ];

  // 테이블 컬럼 설정
  const columns = [
    {
      title: '사용자',
      dataIndex: 'user',
      key: 'user',
      width: '200px',
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div>
            <div className="font-medium text-[var(--text-color)]">{user?.name || 'Unknown'}</div>
            <div className="text-sm text-[var(--text-color)] opacity-60">{user?.email}</div>
          </div>
        </div>
      )
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: '120px',
      render: (category: string) => {
        const categoryMap: Record<string, { label: string; color: string; icon: string }> = {
          system: { label: '시스템', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔧' },
          notice: { label: '공지사항', color: 'bg-blue-100 text-blue-700 border-[var(--border-color)] ', icon: '📢' },
          payment: { label: '결제', color: 'bg-green-100 text-green-700 border-green-200', icon: '💳' },
          notification: { label: '일반', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📬' }
        };
        const config = categoryMap[category] || categoryMap.notification;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            {config.icon} {config.label}
          </span>
        );
      }
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: NotificationData) => (
        <div>
          <div className="font-medium text-[var(--text-color)] line-clamp-1">{title}</div>
          <div className="text-sm text-[var(--text-color)] opacity-60 line-clamp-1 mt-1">{record.content}</div>
        </div>
      )
    },
    {
      title: '상태',
      dataIndex: 'read',
      key: 'read',
      width: '100px',
      render: (read: boolean) => (
        <div className="flex items-center gap-2">
          {read ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200">
              <Icon name="CheckCircle" size={12} className="mr-1" />
              읽음
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200">
              <Icon name="Clock" size={12} className="mr-1" />
              읽지 않음
            </Badge>
          )}
        </div>
      )
    },
    {
      title: '생성일',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: '160px',
      render: (createdTime: string) => (
        <div className="text-sm">
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
      width: '100px',
      render: (record: NotificationData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewingNotification(record)}
            className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
            title="상세보기"
          >
            <Icon name="Eye" size={16} className="text-[var(--text-color)] opacity-60" />
          </button>
          <button
            onClick={() => setDeletingNotification(record)}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="삭제"
          >
            <Icon name="Trash2" size={16} className="text-red-500" />
          </button>
        </div>
      )
    }
  ];

  // 액션 버튼들
  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          console.log('알림 생성 버튼 클릭됨');
          setIsCreateModalOpen(true);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Icon name="Plus" size={16} />
        알림 생성
      </button>
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] transition-colors"
      >
        <Icon name="RotateCcw" size={16} />
        새로고침
      </button>
    </div>
  );

  // 대량 작업 버튼들
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
        title="알림 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={(record) => setViewingNotification(record)}
        rowKey="id"
      />

      {/* 알림 생성 모달 */}
      <NotificationCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          console.log('알림 생성 모달 닫힘');
          setIsCreateModalOpen(false);
        }}
        onSuccess={() => {
          console.log('알림 생성 성공');
          handleRefresh();
        }}
      />

      {/* 알림 상세보기 모달 */}
      <NotificationViewModal
        isOpen={!!viewingNotification}
        onClose={() => setViewingNotification(null)}
        notification={viewingNotification}
      />

      {/* 알림 삭제 모달 */}
      <DeleteModal
        isOpen={!!deletingNotification}
        onClose={() => setDeletingNotification(null)}
        onUpdate={handleRefresh}
        title="알림 삭제"
        entity={deletingNotification}
        entityName="알림"
        endpoint={`/api/admin/notification/${deletingNotification?.id}`}
        getDisplayName={(entity) => entity.title}
        getDangerLevel={() => 'low'}
        onSuccess={() => {
          setDeletingNotification(null);
          handleRefresh();
        }}
      />
    </>
  );
}