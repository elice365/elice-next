'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { BaseModal } from '@/components/ui/modal/common/BaseModal';
import { api } from '@/lib/fetch';
import { APIResult } from '@/types/api';

interface ViewDetail {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string;
  userAgent: string;
  viewedAt: Date;
  isAnonymous: boolean;
}

interface ViewStatsData {
  postId: string;
  postTitle: string;
  totalViews: number;
  uniqueUsers: number;
  anonymousViews: number;
  views: ViewDetail[];
  viewsByDate: Array<{ date: string; count: number }>;
  viewsByHour: Array<{ hour: number; count: number }>;
}

interface BlogViewStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
  postTitle?: string;
}

export const BlogViewStatsModal: React.FC<BlogViewStatsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle
}) => {
  const [data, setData] = useState<ViewStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'charts'>('overview');

  useEffect(() => {
    if (isOpen && postId) {
      fetchViewStats();
    }
  }, [isOpen, postId]);

  const fetchViewStats = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const { data } = await api.get<APIResult<ViewStatsData>>(`/api/admin/blog/${postId}/views`);
      if (data.success && data.data) {
        setData(data.data);
      } else {
        alert('조회 통계를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch view stats:', error);
      alert('조회 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getDeviceType = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📋';
    return '💻';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 통계 카드들 - 그라디언트와 애니메이션 추가 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon name="Eye" className="text-white" size={20} />
              </div>
              <span className="text-sm font-medium text-white/90">총 조회수</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.totalViews.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-white/70">
              전체 페이지뷰
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 p-5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon name="Users" className="text-white" size={20} />
              </div>
              <span className="text-sm font-medium text-white/90">로그인 사용자</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.uniqueUsers}
            </div>
            <div className="mt-2 text-xs text-white/70">
              {data?.totalViews ? `${Math.round((data.uniqueUsers / data.totalViews) * 100)}%` : '0%'} 비율
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 p-5 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon name="UserX" className="text-white" size={20} />
              </div>
              <span className="text-sm font-medium text-white/90">익명 조회</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data?.anonymousViews}
            </div>
            <div className="mt-2 text-xs text-white/70">
              {data?.totalViews ? `${Math.round((data.anonymousViews / data.totalViews) * 100)}%` : '0%'} 비율
            </div>
          </div>
        </div>
      </div>

      {/* 최근 조회 - 카드형 디자인으로 개선 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-[var(--title)]">최근 조회 기록</h4>
          <span className="text-sm text-[var(--text-color)] opacity-60">
            최근 10건
          </span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {data?.views.slice(0, 10).map((view, index) => (
            <div 
              key={view.id} 
              className="group relative flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border-color)] hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              {/* 순서 번호 */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm z-10">
                {index + 1}
              </div>
              
              <div className="flex items-center gap-4 ml-10">
                {/* 아바타 */}
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${
                  view.isAnonymous 
                    ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}>
                  <span className="text-white">
                    {view.isAnonymous ? '?' : (view.userName?.[0] || view.userEmail?.[0] || 'U').toUpperCase()}
                  </span>
                  {!view.isAnonymous && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                {/* 사용자 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--title)]">
                      {view.isAnonymous ? '익명 사용자' : (view.userName || view.userEmail?.split('@')[0])}
                    </span>
                    {!view.isAnonymous && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        회원
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-sm text-[var(--text-color)] opacity-70">
                    <span className="flex items-center gap-1">
                      <Icon name="MapPin" size={12} />
                      {view.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      {getDeviceType(view.userAgent)}
                      {getBrowserName(view.userAgent)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 시간 정보 */}
              <div className="text-right">
                <div className="text-sm font-medium text-[var(--title)]">
                  {new Date(view.viewedAt).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-[var(--text-color)] opacity-60">
                  {new Date(view.viewedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-[var(--title)]">전체 조회 기록</h4>
        <div className="text-sm text-[var(--text-color)] opacity-60">
          총 {data?.views.length}건
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data?.views.map((view, index) => (
          <div key={view.id} className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg border border-[var(--border-color)]">
            <div className="text-sm text-[var(--text-color)] opacity-40 w-10 flex-shrink-0">
              #{index + 1}
            </div>
            
            <div className="text-lg">
              {view.isAnonymous ? '👤' : '👨‍💻'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--title)]">
                  {view.isAnonymous ? '익명 사용자' : (view.userName || view.userEmail)}
                </span>
                {!view.isAnonymous && (
                  <Badge className="text-xs">로그인</Badge>
                )}
              </div>
              
              <div className="text-sm text-[var(--text-color)] opacity-60 flex items-center gap-2">
                <span>{view.ip}</span>
                <span>•</span>
                <span>{getDeviceType(view.userAgent)} {getBrowserName(view.userAgent)}</span>
              </div>
            </div>
            
            <div className="text-sm text-[var(--text-color)] opacity-60 text-right">
              {formatDate(view.viewedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCharts = () => {
    const maxDateViews = Math.max(...(data?.viewsByDate.map(d => d.count) || [1]));
    const maxHourViews = Math.max(...(data?.viewsByHour.map(h => h.count) || [1]));
    
    return (
      <div className="space-y-8">
        {/* 날짜별 조회수 - 향상된 차트 */}
        <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-semibold text-[var(--title)]">날짜별 조회수</h4>
            <span className="text-sm text-[var(--text-color)] opacity-60">최근 10일</span>
          </div>
          <div className="space-y-3">
            {data?.viewsByDate.slice(0, 10).map((item, index) => {
              const percentage = (item.count / maxDateViews) * 100;
              return (
                <div key={item.date} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--text-color)] opacity-80">
                      {new Date(item.date).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                    <span className="text-sm font-semibold text-[var(--title)]">
                      {item.count}회
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.max(percentage, 5)}%`,
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      {percentage > 20 && (
                        <span className="text-xs text-white font-medium">
                          {Math.round(percentage)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 시간대별 조회수 - 향상된 차트 */}
        <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-semibold text-[var(--title)]">시간대별 조회수</h4>
            <span className="text-sm text-[var(--text-color)] opacity-60">24시간 분포</span>
          </div>
          <div className="relative h-40 mb-8">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {data?.viewsByHour.map((item, index) => {
                const percentage = (item.count / maxHourViews) * 100;
                const isActive = item.count > 0;
                
                return (
                  <div 
                    key={item.hour} 
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div className="relative w-full group">
                      {/* 툴팁 */}
                      {isActive && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {item.hour}시: {item.count}회
                        </div>
                      )}
                      
                      {/* 막대 */}
                      <div 
                        className={`w-full mx-auto rounded-t-lg transition-all duration-500 ${
                          isActive 
                            ? 'bg-gradient-to-t from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ 
                          height: `${Math.max(percentage, isActive ? 10 : 2)}%`,
                          minHeight: isActive ? '10px' : '2px',
                          animationDelay: `${index * 30}ms`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X축 레이블 */}
            <div className="absolute -bottom-6 inset-x-0 flex justify-between">
              {[0, 6, 12, 18, 24].map(hour => (
                <span key={hour} className="text-xs text-[var(--text-color)] opacity-60">
                  {hour}시
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="조회 통계"
      subtitle={data?.postTitle || postTitle}
      icon="BarChart3"
      size="2xl"
      loading={loading}
      loadingMessage="통계를 불러오는 중..."
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-color)]">
        {[
          { key: 'overview', label: '개요', icon: 'BarChart3' },
          { key: 'details', label: '상세 기록', icon: 'List' },
          { key: 'charts', label: '차트', icon: 'TrendingUp' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-[var(--text-color)] hover:text-[var(--title)]'
            }`}
          >
            <Icon name={tab.icon as any} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px] max-h-[60vh] overflow-y-auto p-6">
        {data ? (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'details' && renderDetails()}
            {activeTab === 'charts' && renderCharts()}
          </>
        ) : !loading ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-color)] opacity-60">
            데이터를 불러올 수 없습니다.
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
};