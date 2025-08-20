"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { RoleCreateModal } from "@/components/ui/modal/role/RoleCreate";
import { RoleEditModal } from "@/components/ui/modal/role/RoleEdit";
import { DeleteModal } from "@/components/ui/modal/common/DeleteModal";
import { Role } from "@/types/admin";
import { Admin } from "@/components/layout/Admin";
import type { StatCardConfig, FilterConfig } from "@/types/layout/admin";
import { useAdminPage } from "@/hooks/admin";
import { useAdminModals } from "@/hooks/modal/useModalStates";
import { getBadgeStyle, getBadgeIcon } from "@/utils/admin/badges";

// 역할 관리 페이지 메인 컴포넌트
export default function AdminRolePageOptimized() {
  // 페이지 상태 관리
  const [pageState, pageActions] = useAdminPage<Role>({
    endpoint: '/api/admin/roles',
    dataKey: 'roles',
    statsEndpoint: '/api/admin/roles',
    initialFilters: {
      status: '',
      userCount: ''
    }
  });

  // 필터 설정
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: '역할 상태',
      type: 'select',
      icon: 'Filter',
      options: [
        { value: '', label: '모든 역할' },
        { value: 'system', label: '🔒 시스템 역할' },
        { value: 'custom', label: '⚙️ 사용자 정의' }
      ]
    },
    {
      key: 'userCount',
      label: '사용자 수',
      type: 'select',
      icon: 'Users',
      options: [
        { value: '', label: '모든 범위' },
        { value: 'none', label: '할당 없음 (0명)' },
        { value: 'low', label: '적음 (1-10명)' },
        { value: 'medium', label: '보통 (11-50명)' },
        { value: 'high', label: '많음 (50명+)' }
      ]
    }
  ];

  // 모달 상태 관리
  const [modalState, modalActions] = useAdminModals<Role>();

  // 통계 설정
  const stats: StatCardConfig[] = [
    {
      title: "등록된 역할",
      value: pageState.stats?.totalRoles || 0,
      change: {
        value: "+2",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "Shield",
      variant: "primary"
    },
    {
      title: "역할 할당 현황",
      value: pageState.stats?.totalUserRoles || 0,
      change: {
        value: "+15%",
        trend: "up",
        period: "이번 달"
      },
      icon: "Users",
      variant: "success"
    },
    {
      title: "관리자 계정",
      value: pageState.stats?.roles?.find((r: any) => r.name.toLowerCase() === 'admin')?.userCount || 0,
      change: {
        value: "안정적",
        trend: "neutral",
        period: "시스템 관리"
      },
      icon: "Crown",
      variant: "warning"
    },
    {
      title: "일반 사용자",
      value: pageState.stats?.roles?.find((r: any) => r.name.toLowerCase() === 'user')?.userCount || 0,
      change: {
        value: "+8%",
        trend: "up",
        period: "신규 가입"
      },
      icon: "User",
      variant: "info"
    }
  ];

  // 테이블 컬럼 설정
  const columns = [
    {
      key: 'role',
      title: '역할명',
      className: 'text-left min-w-[280px]',
      headerClassName: 'text-left',
      render: (_: any, role: Role) => (
        <div className="flex items-start gap-4 py-3">
          <div className="flex-shrink-0 p-1 rounded-lg border border-[var(--border-color)]">
            <Icon name={getBadgeIcon('role', role.name)} size={24} className="text-[var(--hover-primary)]" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <Badge className={`${getBadgeStyle('role', role.name)} rounded-lg shadow-sm inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border`}>
                {role.name}
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role_explanation',
      title: '역할 설명',
      className: 'text-left min-w-[280px]',
      headerClassName: 'text-left',
      render: (_: any, role: Role) => (
        <div className="flex items-start gap-4 py-3">
          <div className="flex-1 min-w-0 space-y-2">
            {role.description && (
              <div className="text-smleading-relaxed max-w-xs">
                {role.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'userCount',
      title: '할당된 사용자',
      className: 'text-left min-w-[100px] md:min-w-[140px]',
      headerClassName: 'text-left',
      render: (_: any, role: Role) => (
        <div className="flex items-center gap-1 md:gap-3 py-3">
          <div className="flex-shrink-0 p-1 md:p-2 rounded-lg border border-green-200">
            <Icon name="Users" size={14} className="text-green-600 md:w-[18px] md:h-[18px]" />
          </div>
          <div className="flex flex-col">
            <div className="text-sm md:text-lg font-bold text-green-700 whitespace-nowrap">
              {role.userCount}명
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: '작업',
      className: 'text-left min-w-[140px] md:min-w-[180px]',
      headerClassName: 'text-left',
      render: (_: any, role: Role) => (
        <div className="flex items-center gap-1 md:gap-2 py-3 flex-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              modalActions.openEditModal(role, e);
            }}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2.5 bg-blue-600 hover:bg-[var(--hover-primary)] text-white text-xs md:text-sm font-medium rounded-lg transition-colors duration-200 min-h-[32px] md:min-h-[40px] touch-manipulation whitespace-nowrap"
            title="역할 편집"
          >
            <Icon name="Edit" size={14} className="md:w-4 md:h-4" />
            <span>편집</span>
          </button>
          {!['admin', 'user'].includes(role.name.toLowerCase()) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                modalActions.openDeleteModal(role, e);
              }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2.5 bg-red-600 hover:bg-[var(--hover-danger)] text-white text-xs md:text-sm font-medium rounded-lg transition-colors duration-200 min-h-[32px] md:min-h-[40px] touch-manipulation whitespace-nowrap"
              title="역할 삭제"
            >
              <Icon name="Trash2" size={14} className="md:w-4 md:h-4" />
              <span>삭제</span>
            </button>
          )}
        </div>
      )
    }
  ];

  // 액션 버튼
  const actionButtons = (
    <>
      <button
        onClick={pageActions.refresh}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)]  text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-colors duration-200 min-h-[44px] touch-manipulation"
      >
        <Icon name="RefreshCw" size={16} />
        <span className="hidden sm:inline">새로고침</span>
        <span className="sm:hidden">새로고침</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background)] border border-[var(--border-color)]  text-[var(--text-color)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-colors duration-200 min-h-[44px] touch-manipulation">
        <Icon name="Download" size={16} />
        <span className="hidden sm:inline">내보내기</span>
        <span className="sm:hidden">내보내기</span>
      </button>
      <button
        onClick={modalActions.openCreateModal}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-[var(--hover-primary)] text-white rounded-lg text-sm font-medium transition-colors duration-200 min-h-[44px] touch-manipulation"
      >
        <Icon name="Plus" size={16} />
        <span className="hidden sm:inline">역할 추가</span>
        <span className="sm:hidden">추가</span>
      </button>
    </>
  );

  // 역할 상세 보기
  const handleRoleClick = (role: Role) => {
    modalActions.openEditModal(role);
  };

  // 역할 업데이트 후 목록 새로고침
  const handleRoleUpdate = () => {
    pageActions.refresh();
  };

  return (
    <>
      <Admin<Role>
        title="역할 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        onRowClick={handleRoleClick}
      />

      {/* 역할 생성 모달 */}
      <RoleCreateModal
        isOpen={modalState.isCreateModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRoleUpdate}
      />

      {/* 역할 편집 모달 */}
      <RoleEditModal
        role={modalState.selectedRecord}
        isOpen={modalState.isEditModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRoleUpdate}
      />

      {/* 역할 삭제 모달 */}
      <DeleteModal
        isOpen={modalState.isDeleteModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleRoleUpdate}
        title="역할 삭제"
        entity={modalState.selectedRecord}
        entityName="역할"
        endpoint="/api/admin/roles"
        requiresConfirmation={false}
        getDangerLevel={(role) => {
          return ['admin', 'user'].includes(role.name.toLowerCase()) ? 'high' : 'medium';
        }}
        getDisplayName={(role) => role.name}
      />
    </>
  );
}