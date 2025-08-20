"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Session } from "@/types/auth/session";
import { BaseModal } from "@/components/ui/modal/common/BaseModal";
import { Admin } from "@/components/layout/Admin";
import type { StatCardConfig, FilterConfig } from "@/types/layout/admin";
import { useAdminPage } from "@/hooks/admin";
import { api } from "@/lib/fetch";

// 세션 관리 페이지 메인 컴포넌트
export default function AdminSessionPageOptimized() {
  // 세션 상세 정보 모달 상태
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = React.useState(false);
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);
  const [sessionStats, setSessionStats] = React.useState<any>(null);

  // 페이지 상태 관리
  const [pageState, pageActions] = useAdminPage<Session>({
    endpoint: '/api/admin/session',
    dataKey: 'sessions',
    statsEndpoint: '/api/admin/session/stats',
    initialFilters: {
      status: '',
      loginType: ''
    }
  });

  // 필터 설정
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: '상태',
      type: 'select',
      icon: 'Activity',
      options: [
        { value: '', label: '모든 상태' },
        { value: 'active', label: '활성' },
        { value: 'expired', label: '❌ 만료' }
      ]
    },
    {
      key: 'loginType',
      label: '로그인 방식',
      type: 'select',
      icon: 'LogIn',
      options: [
        { value: '', label: '모든 방식' },
        { value: 'email', label: '📧 이메일' },
        { value: 'google', label: '🔍 구글' },
        { value: 'kakao', label: '💬 카카오' },
        { value: 'naver', label: '🟢 네이버' }
      ]
    }
  ];

  // 만료 여부 확인
  const isExpired = (expiresTime: string): boolean => {
    return new Date(expiresTime) < new Date();
  };

  // 통계 설정
  const stats: StatCardConfig[] = [
    {
      title: "총 세션",
      value: pageState.stats?.totalSessions || pageState.pagination.totalCount,
      change: {
        value: "+12%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "Activity",
      variant: "info"
    },
    {
      title: "활성 세션",
      value: pageState.stats?.activeSessions || pageState.data.filter(session => session.active && !isExpired(session.expiresTime.toString())).length,
      change: {
        value: "+8%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "CheckCircle",
      variant: "success"
    },
    {
      title: "만료 세션",
      value: pageState.stats?.expiredSessions || pageState.data.filter(session => !session.active || isExpired(session.expiresTime.toString())).length,
      change: {
        value: "-5%",
        trend: "down",
        period: "지난 달 대비"
      },
      icon: "XCircle",
      variant: "warning"
    },
    {
      title: "로그인 유형",
      value: pageState.stats?.loginTypeCounts ? Object.keys(pageState.stats.loginTypeCounts).length : 0,
      change: {
        value: "+2%",
        trend: "up",
        period: "지난 달 대비"
      },
      icon: "LogIn",
      variant: "success"
    }
  ];

  // 디바이스 타입 추출
  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return '알 수 없음';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return '모바일';
    if (ua.includes('tablet') || ua.includes('ipad')) return '태블릿';
    return '데스크톱';
  };

  // 시간 포맷팅
  const formatDateTime = (dateTime: string | Date | null): string => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('ko-KR');
  };

  // 상태 배지 스타일
  const getStatusBadge = (session: Session) => {
    const isActive = session.active && new Date(session.expiresTime) > new Date();
    return isActive ?
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // 상태 아이콘
  const getStatusIcon = (session: Session) => {
    const isActive = session.active && new Date(session.expiresTime) > new Date();
    return isActive ? 'CheckCircle' : 'XCircle';
  };

  // 상태 텍스트
  const getStatusText = (session: Session) => {
    const isActive = session.active && new Date(session.expiresTime) > new Date();
    return isActive ? '활성' : '만료';
  };

  // 로그인 타입 배지 스타일
  const getLoginTypeBadge = (loginType: string) => {
    const styles = {
      email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      google: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      kakao: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      naver: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return styles[loginType as keyof typeof styles] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // 테이블 컬럼 설정
  const columns = [
    {
      key: 'user',
      title: '사용자',
      render: (_: any, session: Session) => (
        <div>
          <div className="font-medium text-[var(--text-color)]">
            {session.user.name || '이름 없음'}
          </div>
          <div className="text-sm text-[var(--text-color)] opacity-50">
            {session.user.email}
          </div>
          <div className="text-xs text-[var(--text-color)] opacity-40">
            {session.user.roles.join(', ') || '없음'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, session: Session) => (
        <Badge className={`${getStatusBadge(session)} rounded-full shadow-sm flex items-center gap-1.5 px-3 py-1 whitespace-nowrap admin-mobile-status`}>
          <Icon name={getStatusIcon(session)} size={12} />
          {getStatusText(session)}
        </Badge>
      )
    },
    {
      key: 'loginType',
      title: '로그인 방식',
      render: (_: any, session: Session) => (
        <Badge className={`${getLoginTypeBadge(session.loginType)} rounded-full shadow-sm px-3 py-1 admin-mobile-badge`}>
          {session.loginType.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'deviceInfo',
      title: '디바이스/IP',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, session: Session) => (
        <div>
          <div className="text-sm text-[var(--text-color)]">
            {getDeviceType(session.userAgent)}
          </div>
          <div className="text-xs text-[var(--text-color)] opacity-50 font-mono">
            {session.ipAddress || '알 수 없음'}
          </div>
          {session.deviceInfo && (
            <div className="text-xs text-[var(--text-color)] opacity-40 truncate max-w-32" title={session.deviceInfo}>
              {session.deviceInfo}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lastActivityTime',
      title: '마지막 활동',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, session: Session) => formatDateTime(session.lastActivityTime)
    },
    {
      key: 'expiresTime',
      title: '만료 시간',
      className: 'text-sm text-[var(--text-color)]',
      render: (_: any, session: Session) => formatDateTime(session.expiresTime)
    },
    {
      key: 'actions',
      title: '작업',
      render: (_: any, session: Session) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleSessionClick(session)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-[var(--hover-primary)] text-xs px-3 py-1.5 border border-blue-300 hover:border-[var(--hover-primary)] rounded-full transition-all duration-200 hover:shadow-sm whitespace-nowrap cursor-pointer"
            title="세션 상세"
          >
            <Icon name="Eye" size={12} />
            상세
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTerminateUserSessions(session.user.id, e);
            }}
            className="inline-flex items-center gap-1 text-orange-600 hover:text-[var(--hover-warning)] text-xs px-3 py-1.5 border border-orange-300 hover:border-[var(--hover-warning)] rounded-full transition-all duration-200 hover:shadow-sm whitespace-nowrap cursor-pointer"
            title="사용자 세션 종료"
          >
            <Icon name="UserX" size={12} />
            사용자 종료
          </button>
          {session.active && !isExpired(session.expiresTime.toString()) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTerminateSession(session.sessionId, e);
              }}
              className="inline-flex items-center gap-1 text-yellow-600 hover:text-[var(--hover-warning)] text-xs px-3 py-1.5 border border-yellow-300 hover:border-[var(--hover-warning)] rounded-full transition-all duration-200 hover:shadow-sm whitespace-nowrap cursor-pointer"
              title="세션 종료"
            >
              <Icon name="Power" size={12} />
              종료
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSession(session.sessionId, e);
            }}
            className="inline-flex items-center gap-1 text-red-600 hover:text-[var(--hover-danger)] text-xs px-3 py-1.5 border border-red-300 hover:border-[var(--hover-danger)] rounded-full transition-all duration-200 hover:shadow-sm whitespace-nowrap cursor-pointer"
            title="세션 삭제"
          >
            <Icon name="Trash2" size={12} />
            삭제
          </button>
        </div>
      )
    }
  ];

  // 세션 종료
  const handleTerminateSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('이 세션을 종료하시겠습니까?')) {
      return;
    }

    try {
      await api.patch(`/api/admin/session/${sessionId}`, {});
      pageActions.refresh();
      alert('세션이 종료되었습니다.');
    } catch (error) {
      console.error('Failed to terminate session:', error);
      alert('세션 종료에 실패했습니다.');
    }
  };

  // 세션 삭제
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('이 세션을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/session/${sessionId}`);
      pageActions.refresh();
      alert('세션이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('세션 삭제에 실패했습니다.');
    }
  };

  // 사용자의 모든 세션 종료
  const handleTerminateUserSessions = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('이 사용자의 모든 세션을 종료하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/session/user/${userId}`);
      alert('사용자의 모든 세션이 종료되었습니다.');
      pageActions.refresh();
    } catch (error) {
      console.error('사용자 세션 종료 오류:', error);
      alert('사용자 세션 종료 중 오류가 발생했습니다.');
    }
  };

  // 세션 상세 보기
  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setIsDetailsModalOpen(true);
  };

  // 선택된 세션들 일괄 종료
  const handleBulkTerminateSessions = async () => {
    if (pageState.selectedIds.length === 0) {
      alert('종료할 세션을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${pageState.selectedIds.length}개의 세션을 종료하시겠습니까?`)) {
      return;
    }

    pageActions.setBulkActionLoading(true);
    try {
      await Promise.all(
        pageState.selectedIds.map(sessionId =>
          api.patch(`/api/admin/session/${sessionId}`, {})
        )
      );

      pageActions.clearSelection();
      pageActions.refresh();
      alert(`${pageState.selectedIds.length}개의 세션이 종료되었습니다.`);
    } catch (error) {
      console.error('Failed to bulk terminate sessions:', error);
      alert('일부 세션 종료에 실패했습니다.');
    } finally {
      pageActions.setBulkActionLoading(false);
    }
  };

  // 선택된 세션들 일괄 삭제
  const handleBulkDeleteSessions = async () => {
    if (pageState.selectedIds.length === 0) {
      alert('삭제할 세션을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${pageState.selectedIds.length}개의 세션을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    pageActions.setBulkActionLoading(true);
    try {
      await Promise.all(
        pageState.selectedIds.map(sessionId =>
          api.delete(`/api/admin/session/${sessionId}`)
        )
      );

      pageActions.clearSelection();
      pageActions.refresh();
      alert(`${pageState.selectedIds.length}개의 세션이 삭제되었습니다.`);
    } catch (error) {
      console.error('Failed to bulk delete sessions:', error);
      alert('일부 세션 삭제에 실패했습니다.');
    } finally {
      pageActions.setBulkActionLoading(false);
    }
  };

  // 만료된 세션들만 선택
  const handleSelectExpiredSessions = () => {
    const expiredSessions = pageState.data.filter(session =>
      !session.active || new Date(session.expiresTime) <= new Date()
    );
    const expiredSessionIds = expiredSessions.map(session => session.sessionId);
    pageActions.setSelectedIds(expiredSessionIds);
  };

  // 세션 통계 조회
  const handleFetchStats = async () => {
    // pageState의 stats를 사용하거나 없으면 새로 조회
    if (pageState.stats) {
      setSessionStats(pageState.stats);
      setIsStatsModalOpen(true);
    } else {
      try {
        const { data } = await api.get<any>('/api/admin/session/stats');

        setSessionStats(data.data);
        setIsStatsModalOpen(true);
      } catch (error) {
        console.error('통계 조회 오류:', error);

        // 에러 메시지 개선
        const errorMessage = error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
        alert(`통계 조회 중 오류가 발생했습니다: ${errorMessage}`);
      }
    }
  };

  // 액션 버튼
  const actionButtons = (
    <>
      <button
        onClick={pageActions.refresh}
        className="bg-button text-[var(--button-text)] flex items-center gap-2 px-2 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105"
      >
        <Icon name="RefreshCw" size={16} />
        새로고침
      </button>
      <button
        onClick={handleFetchStats}
        className="bg-button text-[var(--button-text)] flex items-center gap-2 px-2 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] hover:text-[var(--hover-text)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105"
      >
        <Icon name="BarChart3" size={16} />
        통계
      </button>
      <button
        onClick={handleSelectExpiredSessions}
        className="bg-orange-600 hover:bg-[var(--hover-warning)] text-white flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105"
      >
        <Icon name="Clock" size={16} />
        만료된 세션 선택
      </button>
      <button className="bg-button text-[var(--button-text)] flex items-center gap-2 px-2 py-2 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105">
        <Icon name="Download" size={16} />
        내보내기
      </button>
    </>
  );

  // 벌크 액션 버튼
  const bulkActionButtons = (
    <>
      <button
        onClick={handleBulkTerminateSessions}
        disabled={pageState.bulkActionLoading}
        className="flex items-center gap-2 px-1 py-1 bg-yellow-600 hover:bg-[var(--hover-warning)] text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pageState.bulkActionLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Icon name="Power" size={16} />
        )}
        선택된 {pageState.selectedIds.length}개 종료
      </button>
      <button
        onClick={handleBulkDeleteSessions}
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
    </>
  );

  return (
    <>
      <Admin<Session>
        title="세션 관리"
        state={pageState}
        actions={pageActions}
        stats={stats}
        filters={filters}
        columns={columns}
        actionButtons={actionButtons}
        bulkActionButtons={bulkActionButtons}
        onRowClick={handleSessionClick}
        rowKey="sessionId"
      />

      {/* 세션 상세 정보 모달 */}
      {isDetailsModalOpen && selectedSession && (
        <BaseModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="세션 상세 정보"
          icon="Activity"
          iconColor="text-blue-600"
          size="2xl"
          footer={
            <div className="bg-[var(--color-modal)] p-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch sm:items-center">
                {/* 왼쪽: 보조 정보 (모바일에서 숨김) */}
                <div className="hidden sm:block text-sm text-[var(--text-color)]">
                  세션 ID: <span className="font-mono text-xs">{selectedSession.sessionId.slice(-8)}</span>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Primary: 닫기 (가장 안전한 액션) */}
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  >
                    <Icon name="X" size={14} className="sm:hidden" />
                    <Icon name="X" size={16} className="hidden sm:block" />
                    <span>닫기</span>
                  </button>

                  {/* Secondary: 사용자 세션 종료 (중간 위험도) */}
                  <button
                    onClick={(e) => {
                      handleTerminateUserSessions(selectedSession.user.id, e);
                      setIsDetailsModalOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                  >
                    <Icon name="Users" size={14} className="sm:hidden" />
                    <Icon name="Users" size={16} className="hidden sm:block" />
                    <span className="hidden sm:inline">사용자 세션 종료</span>
                    <span className="sm:hidden">사용자 종료</span>
                  </button>

                  {/* Tertiary: 세션 종료 (조건부) */}
                  {selectedSession.active && !isExpired(selectedSession.expiresTime.toString()) && (
                    <button
                      onClick={(e) => {
                        handleTerminateSession(selectedSession.sessionId, e);
                        setIsDetailsModalOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                    >
                      <Icon name="Power" size={14} className="sm:hidden" />
                      <Icon name="Power" size={16} className="hidden sm:block" />
                      <span>세션 종료</span>
                    </button>
                  )}

                  {/* Destructive: 삭제 (가장 위험한 액션) */}
                  <button
                    onClick={(e) => {
                      handleDeleteSession(selectedSession.sessionId, e);
                      setIsDetailsModalOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <Icon name="Trash2" size={14} className="sm:hidden" />
                    <Icon name="Trash2" size={16} className="hidden sm:block" />
                    <span>세션 삭제</span>
                  </button>
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto px-3 pb-2">
            {/* 사용자 정보 카드 */}
            <div className="bg-modal rounded-xl border border-[var(--border-color)]  p-6 mt-3">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon name="User" size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-color)]">사용자 정보</h3>
              </div>

              <div className="space-y-6">
                {/* 사용자 프로필 */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {(selectedSession.user.name || selectedSession.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-3 font-semibold text-[var(--text-color)] text-xl mb-1">
                      {selectedSession.user.name || '이름 없음'}
                      <div className="flex gap-3">
                        <Badge className={`${getStatusBadge(selectedSession)} rounded-full px-2 py-2 text-sm font-medium`}>
                          {getStatusText(selectedSession)}
                        </Badge>
                        <Badge className={`${getLoginTypeBadge(selectedSession.loginType)} rounded-full px-2 py-2 text-sm font-medium`}>
                          {selectedSession.loginType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 break-all">
                      {selectedSession.user.email}
                    </div>
                  </div>
                </div>

                {/* 사용자 메타데이터 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-panelp-4 rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide block mb-2">사용자 ID</h4>
                    <div className="text-[var(--text-color)] font-mono text-sm">
                      {selectedSession.user.id}
                    </div>
                  </div>

                  <div className="bg-panelp-4 rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide block mb-2">역할</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.user.roles.length > 0 ? (
                        selectedSession.user.roles.map((role) => (
                          <Badge key={`${selectedSession.sessionId}-${role}`} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-md text-xs font-medium">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[var(--text-color)] text-sm">역할 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 세션 & 디바이스 정보 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* 세션 활동 정보 */}
              <div className="bg-modal rounded-xl border border-[var(--border-color)]  p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Icon name="Activity" size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-color)]">세션 활동</h3>
                </div>

                <div className="space-y-4">
                  {/* 세션 ID */}
                  <div className="bg-panel p-4 rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide block mb-2">세션 ID</h4>
                    <div className="text-[var(--text-color)] font-mono text-sm break-all select-all">
                      {selectedSession.sessionId}
                    </div>
                  </div>

                  {/* 시간 정보 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-panelrounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="Calendar" size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-[var(--text-color)]">생성 시간</span>
                      </div>
                      <div className="text-sm text-[var(--text-color)] font-medium">{formatDateTime(selectedSession.createdTime)}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-panelrounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="Clock" size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-[var(--text-color)]">마지막 활동</span>
                      </div>
                      <div className="text-sm text-[var(--text-color)] font-medium">{formatDateTime(selectedSession.lastActivityTime)}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-panelrounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="AlertCircle" size={16} className="text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-[var(--text-color)]">만료 시간</span>
                      </div>
                      <div className="text-sm text-[var(--text-color)] font-medium">{formatDateTime(selectedSession.expiresTime)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 디바이스 정보 */}
              <div className="bg-modal rounded-xl border border-[var(--border-color)]  p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Icon name="Monitor" size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-color)]">디바이스 정보</h3>
                </div>

                <div className="space-y-4">
                  {/* IP & 디바이스 타입 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-panelp-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Wifi" size={16} className="text-purple-600 dark:text-purple-400" />
                        <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide">IP 주소</h4>
                      </div>
                      <div className="text-[var(--text-color)] font-mono text-sm">{selectedSession.ipAddress || '알 수 없음'}</div>
                    </div>

                    <div className="bg-panelp-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Smartphone" size={16} className="text-purple-600 dark:text-purple-400" />
                        <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide">디바이스</h4>
                      </div>
                      <div className="text-[var(--text-color)] text-sm">{getDeviceType(selectedSession.userAgent)}</div>
                    </div>
                  </div>

                  {/* 디바이스 상세 정보 */}
                  <div className="bg-panelp-4 rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide block mb-2">디바이스 정보</h4>
                    <div className="text-[var(--text-color)] text-sm overflow-x-clip">
                      {selectedSession.deviceInfo || '정보 없음'}
                    </div>
                  </div>

                  {/* 사용자 에이전트 */}
                  <div className="bg-panelp-4 rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--text-color)] uppercase tracking-wide block mb-2">사용자 에이전트</h4>
                    <div className="text-[var(--text-color)] text-xs break-all font-mono leading-relaxed max-h-16 overflow-y-auto">
                      {selectedSession.userAgent || '정보 없음'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseModal>
      )}

      {/* 세션 통계 모달 */}
      {isStatsModalOpen && sessionStats && (
        <BaseModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          title="세션 통계"
          icon="BarChart3"
          iconColor="text-green-600"
          size="xl"
          footer={
            <div className="flex justify-end gap-3 p-6 border-t border-[var(--border-color)]">
              <button
                onClick={() => {
                  pageActions.refresh();
                  handleFetchStats();
                }}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
              >
                <Icon name="RefreshCw" size={16} className="mr-2" />
                새로고침
              </button>
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-6">
            {/* 헤더: 통계 개요 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-2">세션 통계</h2>
              <p className="text-gray-600 dark:text-gray-400">실시간 세션 현황 및 로그인 통계</p>
            </div>

            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-modal p-6 rounded-xl border border-[var(--border-color)]  shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{sessionStats.totalSessions || 0}</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">총 세션</div>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Icon name="Database" size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-modal p-6 rounded-xl border border-[var(--border-color)]  shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{sessionStats.activeSessions || 0}</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 세션</div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Icon name="CheckCircle" size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-modal p-6 rounded-xl border border-[var(--border-color)]  shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{sessionStats.expiredSessions || 0}</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">만료 세션</div>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Icon name="XCircle" size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 로그인 방식별 통계 */}
            <div className="bg-modal rounded-xl border border-[var(--border-color)]  p-6">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Icon name="LogIn" size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                로그인 방식별 세션
              </h3>

              {sessionStats.loginTypeCounts && Object.keys(sessionStats.loginTypeCounts).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(sessionStats.loginTypeCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-4 bg-panelrounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getLoginTypeBadge(type)} rounded-lg px-3 py-2 text-sm font-medium shadow-sm`}>
                          {type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--text-color)]">{count as number}</div>
                        <div className="text-xs text-[var(--text-color)] font-medium">세션</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                    <Icon name="AlertCircle" size={32} className="text-gray-400" />
                  </div>
                  <p className="text-[var(--text-color)] font-medium">로그인 방식별 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
}