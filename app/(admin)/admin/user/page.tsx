"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { UserRoleManager } from "@/components/features/admin/UserRoleManager";
import { UserModal } from "@/components/ui/modal/user/User";
import { User } from "@/types/user";
import { Admin, StatCardConfig, FilterConfig } from "@/components/layout/Admin";
import { useAdminPage } from "@/hooks/admin";
import { useAdminModals } from "@/hooks/admin";
import { getBadgeStyle, getBadgeIcon, getBadgeText } from "@/utils/admin/badges";

// 사용자 관리 페이지 메인 컴포넌트  
export default function AdminUserPageOptimized() {
  // 사용자 역할 관리자 모달 상태
  const [isRoleManagerOpen, setIsRoleManagerOpen] = React.useState(false);

  // 페이지 상태 관리
  const [pageState, pageActions] = useAdminPage<User>({
    endpoint: '/api/admin/users',
    dataKey: 'users',
    statsEndpoint: '/api/admin/users/stats',
    initialFilters: {
      status: '',
      role: ''
    }
  });

  // 모달 상태 관리
  const [modalState, modalActions] = useAdminModals<User>();

  // 필터 설정
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: '상태',
      type: 'select',
      icon: 'User',
      options: [
        { value: '', label: '모든 상태' },
        { value: 'active', label: '✅ 활성' },
        { value: 'inactive', label: '⏸️ 비활성' },
        { value: 'suspended', label: '🚫 정지' }
      ]
    },
    {
      key: 'role',
      label: '역할',
      type: 'select',
      icon: 'Shield',
      options: [
        { value: '', label: '모든 역할' },
        { value: 'admin', label: '👑 관리자' },
        { value: 'user', label: '👤 사용자' }
      ]
    }
  ];

  // 통계 설정
  const stats: StatCardConfig[] = [
    {
      title: "총 사용자",
      value: pageState.stats?.totalUsers || pageState.pagination.totalCount,
      change: {
        value: "+12%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "Users",
      variant: "success"
    },
    {
      title: "활성 사용자",
      value: pageState.stats?.activeUsers || pageState.data.filter(user => user.status === 'active').length,
      change: {
        value: "+8%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "UserCheck",
      variant: "success"
    },
    {
      title: "비활성 사용자",
      value: pageState.stats?.inactiveUsers || pageState.data.filter(user => user.status === 'inactive').length,
      change: {
        value: "-5%",
        trend: "down",
        period: "지난 달 대비"
      },
      icon: "UserX",
      variant: "warning"
    },
    {
      title: "이메일 인증",
      value: pageState.stats?.verificationStats?.emailVerified || 0,
      change: {
        value: "+15%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "Mail",
      variant: "info"
    }
  ];

  // 테이블 컬럼 설정
  const columns = [
    {
      key: 'user',
      title: '사용자',
      render: (_: any, user: User) => (
        <div>
          <div className="font-medium text-[var(--text-color)]">
            {user.name || '이름 없음'}
          </div>
          <div className="text-sm text-[var(--text-color)] opacity-50">
            {user.email}
          </div>
          {user.phoneNumber && (
            <div className="text-sm text-[var(--text-color)] opacity-50">
              {user.phoneNumber}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, user: User) => (
        <Badge className={`${getBadgeStyle('status', user.status)} rounded-full shadow-sm flex items-center gap-1.5 px-3 py-1`}>
          <Icon name={getBadgeIcon('status', user.status)} size={12} />
          {getBadgeText('status', user.status)}
        </Badge>
      )
    },
    {
      key: 'roles',
      title: '역할',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, user: User) => (
        <div className="flex flex-wrap gap-1 max-w-48">
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <Badge key={`role-${user.id}-${role}`} className={`${getBadgeStyle('role', role)} rounded-full shadow-sm px-2 py-1 text-xs`}>
                {getBadgeText('role', role)}
              </Badge>
            ))
          ) : (
            <span className="text-[var(--text-color)] opacity-50">없음</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: '관리',
      render: (_: any, user: User) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRoleManagement(user, e);
          }}
          className="text-blue-600 hover:text-[var(--hover-primary)] text-xs px-3 py-1.5 border border-blue-300 hover:border-[var(--hover-primary)] rounded-full transition-all duration-200 hover:shadow-sm flex items-center gap-1"
        >
          <Icon name="Settings" size={12} />
          역할
        </button>
      )
    },
    {
      key: 'activeSessions',
      title: '세션',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, user: User) => `${user.activeSessions}개`
    },
    {
      key: 'createdTime',
      title: '가입일',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, user: User) => new Date(user.createdTime).toLocaleDateString('ko-KR')
    },
    {
      key: 'lastLoginTime',
      title: '마지막 로그인',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, user: User) => user.lastLoginTime
        ? new Date(user.lastLoginTime).toLocaleDateString('ko-KR')
        : '없음'
    }
  ];

  // 선택된 사용자들 일괄 내보내기
  const handleBulkExportUsers = async () => {
    if (pageState.selectedIds.length === 0) {
      alert('내보낼 사용자를 선택해주세요.');
      return;
    }

    pageActions.setBulkActionLoading(true);
    try {
      // 선택된 사용자 데이터 추출
      const selectedUsers = pageState.data.filter(user => pageState.selectedIds.includes(user.id));

      // CSV 형태로 내보내기 준비
      const csvData = [
        ['이름', '이메일', '전화번호', '상태', '역할', '가입일', '마지막 로그인'],
        ...selectedUsers.map(user => [
          user.name || '',
          user.email,
          user.phoneNumber || '',
          user.status,
          user.roles.join(', '),
          new Date(user.createdTime).toLocaleDateString('ko-KR'),
          user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleDateString('ko-KR') : '없음'
        ])
      ];

      // CSV 문자열 생성
      const csvContent = csvData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // 파일 다운로드
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`${pageState.selectedIds.length}명의 사용자 정보를 내보냈습니다.`);
    } catch (error) {
      console.error('Failed to export users:', error);
      alert('사용자 내보내기에 실패했습니다.');
    } finally {
      pageActions.setBulkActionLoading(false);
    }
  };

  // 활성 사용자만 선택
  const handleSelectActiveUsers = () => {
    const activeUsers = pageState.data.filter(user => user.status === 'active');
    const activeUserIds = activeUsers.map(user => user.id);
    pageActions.setSelectedIds(activeUserIds);
  };

  // 역할 관리 열기
  const handleRoleManagement = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    modalActions.setSelectedRecord(user);
    setIsRoleManagerOpen(true);
  };

  // 역할 관리 닫기
  const handleRoleManagerClose = () => {
    setIsRoleManagerOpen(false);
    modalActions.setSelectedRecord(null);
  };

  // 사용자 업데이트 후 목록 새로고침
  const handleUserUpdate = () => {
    pageActions.refresh();
  };

  // 액션 버튼
  const actionButtons = (
    <>
      <button
        onClick={pageActions.refresh}
        className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105"
      >
        <Icon name="RefreshCw" size={16} />
        새로고침
      </button>
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
        <Icon name="Upload" size={16} />
        가져오기
      </button>
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-4 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
        <Icon name="Plus" size={16} />
        사용자 추가
      </button>
    </>
  );

  // 벌크 액션 버튼
  const bulkActionButtons = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSelectActiveUsers}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
        title="활성 상태인 사용자만 선택"
      >
        <Icon name="UserCheck" size={16} />
        활성 사용자 선택
      </button>
      <button
        onClick={handleBulkExportUsers}
        disabled={pageState.bulkActionLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pageState.bulkActionLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Icon name="Download" size={16} />
        )}
        선택된 {pageState.selectedIds.length}명 내보내기
      </button>
    </div>
  );

  return (
    <>
      <Admin<User>
        title="사용자 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={modalActions.openEditModal}
        rowKey="id"
      />

      {/* 사용자 상세 모달 */}
      <UserModal
        user={modalState.selectedRecord}
        isOpen={modalState.isEditModalOpen}
        onClose={modalActions.closeModals}
        onUpdate={handleUserUpdate}
      />

      {/* 사용자 역할 관리 모달 */}
      {modalState.selectedRecord && (
        <UserRoleManager
          userId={modalState.selectedRecord.id}
          isOpen={isRoleManagerOpen}
          onClose={handleRoleManagerClose}
          onUpdate={handleUserUpdate}
        />
      )}
    </>
  );
}