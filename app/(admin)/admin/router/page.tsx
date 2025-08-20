"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { RouterCreateModal } from "@/components/ui/modal/router/RouterCreate";
import { RouterEditModal } from "@/components/ui/modal/router/RouterEdit";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { WebRouter } from "@/types/admin";
import { Admin } from "@/components/layout/Admin";
import type { StatCardConfig, FilterConfig } from "@/types/layout/admin";
import { logger } from "@/lib/services/logger";
import { useAdminPage, useRoles, formatRolesForFilter } from "@/hooks/admin";
import { useAdminModals } from "@/hooks/modal/useModalStates";
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
        <div className="flex flex-wrap gap-1 md:flex-wrap admin-mobile-roles">
          {router.role.map((role) => (
            <Badge key={`${router.uid}-${role}`} className={`${getBadgeStyle('role', role)} rounded-full shadow-sm px-2 py-1 text-xs admin-mobile-badge`}>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              modalActions.openEditModal(router, e);
            }}
            className="admin-role-button inline-flex items-center gap-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs px-2 py-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 cursor-pointer group"
            title="라우터 편집"
          >
            <Icon name="Edit" size={12} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden sm:inline">편집</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              modalActions.openDeleteModal(router, e);
            }}
            className="admin-role-button inline-flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer group"
            title="라우터 삭제"
          >
            <Icon name="Trash2" size={12} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden sm:inline">삭제</span>
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
      logger.error('Failed to bulk delete routers', 'ROUTER', error);
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
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-colors duration-200">
        <Icon name="Download" size={16} />
        <span className="hidden sm:inline">내보내기</span>
      </button>
      <button 
        onClick={pageActions.refresh}
        className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-colors duration-200"
      >
        <Icon name="RefreshCw" size={16} />
        <span className="hidden sm:inline">새로고침</span>
      </button>
      <button
        onClick={modalActions.openCreateModal}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
      >
        <Icon name="Plus" size={16} />
        <span className="hidden sm:inline">라우터 추가</span>
      </button>
    </>
  );

  // 벌크 액션 버튼
  const bulkActionButtons = (
    <button
      onClick={handleBulkDeleteRouters}
      disabled={pageState.bulkActionLoading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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