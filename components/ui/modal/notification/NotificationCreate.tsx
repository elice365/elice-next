"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { logger } from '@/lib/services/logger';
import type { NotificationCreateModalProps } from "@/types/ui/modal";

export function NotificationCreateModal({ isOpen, onClose, onSuccess }: NotificationCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    targetType: 'all', // 'all', 'individual', 'bulk'
    targetUserIds: [] as string[],
    category: 'notification',
    title: '',
    content: '',
    link: ''
  });

  // 사용자 목록 로드
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get<APIResult>('/api/admin/users?limit=100');
      if (data.success && data.data.users) {
        setUsers(data.data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name || user.email
        })));
      }
    } catch (error) {
      logger.error('사용자 목록 로드 실패', 'UI', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // 폼 유효성 검사
  const validateForm = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용은 필수입니다.');
      return false;
    }

    if (formData.targetType === 'individual' && formData.targetUserIds.length === 0) {
      alert('개별 발송 시 대상 사용자를 선택해주세요.');
      return false;
    }

    return true;
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      targetType: 'all',
      targetUserIds: [],
      category: 'notification',
      title: '',
      content: '',
      link: ''
    });
  };

  // 성공 처리
  const handleSuccess = (data: APIResult) => {
    alert(data.data.message || '알림이 성공적으로 발송되었습니다.');
    onSuccess();
    onClose();
    resetForm();
  };

  // 에러 처리
  const handleError = (error: any) => {
    logger.error('알림 생성 실패', 'UI', error);
    alert('알림 발송 중 오류가 발생했습니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<APIResult>('/api/admin/notification', formData);
      
      if (data.success) {
        handleSuccess(data);
      } else {
        alert('알림 발송에 실패했습니다.');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };


  const footer = (
    <div className="flex justify-end gap-3 p-4">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 text-[var(--text-color)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] transition-colors disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="submit"
        form="notification-form"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            발송 중...
          </>
        ) : (
          <>
            <Icon name="Send" size={16} />
            알림 발송
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="알림 생성"
      subtitle="사용자에게 알림을 발송합니다"
      icon="Bell"
      iconColor="text-blue-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      <form id="notification-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 발송 대상 선택 */}
        <fieldset className="space-y-3">
          <legend className="block text-sm font-medium text-[var(--text-color)]">
            발송 대상
          </legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                id="target-all"
                type="radio"
                name="targetType"
                value="all"
                checked={formData.targetType === 'all'}
                onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value, targetUserIds: [] }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">전체 사용자</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                id="target-individual"
                type="radio"
                name="targetType"
                value="individual"
                checked={formData.targetType === 'individual'}
                onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">개별 사용자 선택</span>
            </label>
          </div>
        </fieldset>

        {/* 개별 사용자 선택 */}
        {formData.targetType === 'individual' && (
          <div className="space-y-3">
            <label htmlFor="user-selection" className="block text-sm font-medium text-[var(--text-color)]">
              대상 사용자 ({formData.targetUserIds.length}명 선택)
            </label>
            {loadingUsers ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-[var(--text-color)] opacity-60 mt-2">사용자 목록 로딩 중...</p>
              </div>
            ) : (
              <select
                id="user-selection"
                multiple
                size={6}
                value={formData.targetUserIds}
                onChange={(e) => {
                  const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData(prev => ({ ...prev, targetUserIds: selectedValues }));
                }}
                className="w-full border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id} className="py-2 px-3">
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 카테고리 */}
        <div className="space-y-2">
          <label htmlFor="notification-category" className="block text-sm font-medium text-[var(--text-color)]">
            카테고리
          </label>
          <select
            id="notification-category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="notification">📬 일반 알림</option>
            <option value="system">🔧 시스템 알림</option>
            <option value="notice">📢 공지사항</option>
            <option value="payment">💳 결제 알림</option>
          </select>
        </div>

        {/* 제목 */}
        <div className="space-y-2">
          <label htmlFor="notification-title" className="block text-sm font-medium text-[var(--text-color)]">
            제목 *
          </label>
          <input
            id="notification-title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="알림 제목을 입력하세요"
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 내용 */}
        <div className="space-y-2">
          <label htmlFor="notification-content" className="block text-sm font-medium text-[var(--text-color)]">
            내용 *
          </label>
          <textarea
            id="notification-content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="알림 내용을 입력하세요"
            rows={4}
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 링크 (선택사항) */}
        <div className="space-y-2">
          <label htmlFor="notification-link" className="block text-sm font-medium text-[var(--text-color)]">
            링크 (선택사항)
          </label>
          <input
            id="notification-link"
            type="url"
            value={formData.link}
            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 미리보기 */}
        {(formData.title || formData.content) && (
          <div className="space-y-2">
            <h4 className="block text-sm font-medium text-[var(--text-color)]">
              미리보기
            </h4>
            <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--color-panel)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon name="Bell" size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-color)]">
                    {formData.title || '제목을 입력하세요'}
                  </div>
                  <div className="text-sm text-[var(--text-color)] opacity-70 mt-1">
                    {formData.content || '내용을 입력하세요'}
                  </div>
                  {formData.link && (
                    <div className="text-xs text-blue-600 mt-2">
                      🔗 {formData.link}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
}