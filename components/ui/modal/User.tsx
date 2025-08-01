"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { UserModalProps } from "@/types/user";
import { Input } from "@/components/ui/Input";

export const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    status: 'active',
    marketing: false,
    terms: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status,
        marketing: user.marketing ?? false,
        terms: user.terms ?? false
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await api.patch<APIResult>('/api/admin/users', {
        userId: user.id,
        updates: formData
      });

      if (data.success) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('[UserModal] User update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-modal)] rounded-lg overflow-hidden w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-[var(--modal-border)] bg-[var(--modal-header-bg)]">
          <h2 className="text-xl font-semibold text-[var(--title)]">사용자 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-color)] hover:text-[var(--hover-text)] p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
      </div>
    </div>
  );
};