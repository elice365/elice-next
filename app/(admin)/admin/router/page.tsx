"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { RouterCreateModal } from "@/components/ui/modal/RouterCreate";
import { RouterEditModal } from "@/components/ui/modal/RouterEdit";
import { DeleteModal } from "@/components/ui/modal/DeleteModal";
import { WebRouter } from "@/types/admin";
import { Admin, StatCardConfig, FilterConfig } from "@/components/layout/Admin";
import { useAdminPage, useAdminModals, useRoles, formatRolesForFilter } from "@/hooks/admin";
import { getBadgeStyle, getBadgeText } from "@/utils/admin/badges";
import { api } from "@/lib/fetch";

// 웹 라우터 관리 페이지 메인 컴포넌트
export default function AdminRouterPageOptimized() {
  // 역할 데이터 가져오기
  const { roles } = useRoles();
  
  // 페이지 상태 관리
  const [pageState, pageActions] = useAdminPage<WebRouter>({
    endpoint: '/api/admin/router',
    dataKey: 'routers',
    statsEndpoint: '/api/admin/router',
    initialFilters: {
      role: ''
    }
  });

  // 모달 상태 관리
  const [modalState, modalActions] = useAdminModals<WebRouter>();

  // 필터 설정 - 동적 역할 옵션
  const filters: FilterConfig[] = [
    {
      key: 'role',
      label: '역할',
      type: 'select',
      icon: 'Shield',
      options: formatRolesForFilter(roles)
    }
  ];

  // 통계 설정
  const stats: StatCardConfig[] = [
    {
      title: "총 라우터",
      value: pageState.stats?.totalRouters || 0,
      change: {
        value: "웹 경로",
        trend: "neutral",
        period: "관리 중"
      },
      icon: "Router",
      variant: "primary"
    },
    {
      title: "관리자 전용",
      value: pageState.stats?.adminRouters || 0,
      change: {
        value: `${pageState.stats?.totalRouters ? Math.round((pageState.stats.adminRouters / pageState.stats.totalRouters) * 100) : 0}%`,
        trend: "up",
        period: "비중"
      },
      icon: "Shield",
      variant: "success"
    },
    {
      title: "사용자 접근",
      value: pageState.stats?.userRouters || 0,
      change: {
        value: "사용자용",
        trend: "neutral",
        period: "접근 가능"
      },
      icon: "Users",
      variant: "warning"
    },
    {
      title: "공개 라우터",
      value: pageState.stats?.publicRouters || 0,
      change: {
        value: "공개",
        trend: "neutral",
        period: "누구나 접근"
      },
      icon: "Globe",
      variant: "info"
    }
  ];

  // 테이블 컬럼 설정
  const columns = [
    {
      key: 'router',
      title: '라우터 정보',
      render: (_: any, router: WebRouter) => (
        <div>
          <div className="font-medium text-[var(--text-color)] flex items-center gap-2">
            <Icon name={router.icon} size={16} className="text-[var(--hover-primary)]" />
            {router.name}
          </div>
          <div className="text-sm text-[var(--text-color)] opacity-70">
            {router.path}
          </div>
        </div>
      )
    },
    {
      key: 'roles',
      title: '접근 권한',
      render: (_: any, router: WebRouter) => (
        <div className="flex flex-wrap gap-1">
          {router.role.map((role) => (
            <Badge key={`${router.uid}-${role}`} className={`${getBadgeStyle('role', role)} rounded-full shadow-sm px-2 py-1 text-xs`}>
              {getBadgeText('role', role)}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'createdTime',
      title: '등록일',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, router: WebRouter) => new Date(router.createdTime).toLocaleDateString('ko-KR')
    },
    {
      key: 'updateTime',
      title: '수정일',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, router: WebRouter) => new Date(router.updateTime).toLocaleDateString('ko-KR')
    },
    {
      key: 'actions',
      title: '작업',
      render: (_: any, router: WebRouter) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              modalActions.openEditModal(router, e);
            }}
            className="text-green-600 hover:text-[var(--hover-success)] text-xs px-3 py-1.5 border border-green-300 hover:border-[var(--hover-success)] rounded-full transition-all duration-200 hover:shadow-sm flex items-center gap-1"
          >
            <Icon name="Edit" size={12} />
            편집
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              modalActions.openDeleteModal(router, e);
            }}
            className="text-red-600 hover:text-[var(--hover-danger)] text-xs px-3 py-1.5 border border-red-300 hover:border-[var(--hover-danger)] rounded-full transition-all duration-200 hover:shadow-sm flex items-center gap-1"
          >
            <Icon name="Trash2" size={12} />
            삭제
          </button>
        </div>
      )
    }
  ];

  // 선택된 라우터들 일괄 삭제
  const handleBulkDeleteRouters = async () => {
    if (pageState.selectedIds.length === 0) {
      alert('삭제할 라우터를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${pageState.selectedIds.length}개의 라우터를 삭제하시겠습니까?`)) {
      return;
    }

    pageActions.setBulkActionLoading(true);
    try {
      // 병렬로 삭제 요청 수행
      await Promise.all(
        pageState.selectedIds.map(routerId =>
          api.delete(`/api/admin/router/${routerId}`)
        )
      );

      // 삭제 성공 시 선택 초기화 및 목록 새로고침
      pageActions.clearSelection();
      pageActions.refresh();
      alert(`${pageState.selectedIds.length}개의 라우터가 삭제되었습니다.`);
    } catch (error) {
      console.error('Failed to bulk delete routers:', error);
      alert('일부 라우터 삭제에 실패했습니다.');
    } finally {
      pageActions.setBulkActionLoading(false);
    }
  };

  // 라우터 상세 보기
  const handleRouterClick = (router: WebRouter) => {
    modalActions.openEditModal(router);
  };

  // 라우터 업데이트 후 목록 새로고침
  const handleRouterUpdate = () => {
    pageActions.refresh();
  };

  // 액션 버튼
  const actionButtons = (
    <>
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
        <Icon name="Download" size={16} />
        내보내기
      </button>
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
        <Icon name="RefreshCw" size={16} />
        캐시 새로고침
      </button>
      <button
        onClick={modalActions.openCreateModal}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-[var(--hover-success)] text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
      >
        <Icon name="Plus" size={16} />
        라우터 추가
      </button>
    </>
  );

  // 벌크 액션 버튼
  const bulkActionButtons = (
    <button
      onClick={handleBulkDeleteRouters}
      disabled={pageState.bulkActionLoading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-[var(--hover-danger)] text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pageState.bulkActionLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <Icon name="Trash2" size={16} />
      )}
      선택된 {pageState.selectedIds.length}개 삭제
    </button>
  );

  return (
    <>
      <Admin<WebRouter>
        title="웹 라우터 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={handleRouterClick}
        rowKey="uid"
      />

      {/* 라우터 모달 컴포넌트들 */}
      <RouterCreateModal
        isOpen={modalState.isCreateModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRouterUpdate}
      />

      <RouterEditModal
        router={modalState.selectedRecord}
        isOpen={modalState.isEditModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRouterUpdate}
      />

      <DeleteModal
        isOpen={modalState.isDeleteModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRouterUpdate}
        title="라우터 삭제"
        entity={modalState.selectedRecord}
        entityName="라우터"
        endpoint="/api/admin/router"
        requiresConfirmation={true}
        confirmationText="라우터명을 입력하세요"
        getDangerLevel={() => 'medium'}
        getDisplayName={(router) => router.name}
      />
    </>
  );
}