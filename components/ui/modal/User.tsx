"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { UserModalProps } from "@/types/user";
import { Input } from "@/components/ui/Input";
import { BaseModal } from "./BaseModal";
import { Icon } from "@/components/ui/Icon";
import { useModalForm } from "@/hooks/modal";

export const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    status: 'active',
    marketing: false,
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status,
        marketing: user.marketing ?? false,
        terms: user.terms ?? false
      });
      setError('');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.patch<APIResult>('/api/admin/users', {
        userId: user.id,
        updates: formData
      });

      if (data.success) {
        onUpdate();
        onClose();
      } else {
        setError(data.message || '사용자 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('[UserModal] User update failed:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          form="user-form"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              처리 중...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} />
              수정
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="사용자 정보 수정"
      subtitle={user?.email}
      icon="User"
      iconColor="text-blue-600"
      size="md"
      footer={footer}
      loading={loading}
    >
      <form id="user-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Input
              id="email"
              type="email"
              name="email"
              value={user.email}
              disabled
              className="w-full p-2 border border-[var(--border-color)]  rounded-md bg-background text-[var(--text-color)]"
              showError={false}
              OnChange={false}
              OnBlur={false}
            />
          </div>

          <div>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-[var(--border-color)]  rounded-md bg-background"
              showError={false}
              OnChange={false}
              OnBlur={false}
            />
          </div>

          <div>
            <Input
              id="tel"
              type="tel"
              name="phone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full p-2 border border-[var(--border-color)]  rounded-md bg-background text-[var(--text-color)]"
              showError={false}
              OnChange={false}
              OnBlur={false}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">상태</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border border-[var(--border-color)]  rounded-md focus:ring-2 focus:ring-blue-500 bg-background"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="suspended">정지</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">사용자 정보</h3>
            <div className="space-y-2 text-sm text-[var(--text-color)]">
              <p>역할: {user.roles.join(', ') || '없음'}</p>
              <p>이메일 인증: {user.auth?.emailVerified ? '완료' : '미완료'}</p>
              <p>전화 인증: {user.auth?.phoneVerified ? '완료' : '미완료'}</p>
              <p>2FA: {user.auth?.twoFactor ? '활성' : '비활성'}</p>
              <p>활성 세션: {user.activeSessions}개</p>
              <p>가입일: {new Date(user.createdTime).toLocaleDateString('ko-KR')}</p>
              {user.lastLoginTime && (
                <p>마지막 로그인: {new Date(user.lastLoginTime).toLocaleString('ko-KR')}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-4 border-t border-[var(--modal-border)] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 border border-[var(--border-color)]  rounded-md hover:bg-[var(--hover)] text-sm font-medium text-[var(--text-color)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-[var(--button)] text-[var(--button-text)] rounded-md hover:bg-[var(--hover-primary)] disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
      </form>
    </BaseModal>
  );
};