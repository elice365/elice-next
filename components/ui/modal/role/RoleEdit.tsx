"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { filterField } from "@/utils/regex/input";
import { validateRole } from "@/utils/regex/admin";
import { Role, FormErrors } from "@/types/admin";
import { logger } from '@/lib/services/logger';
import { useTranslations } from "next-intl";

interface RoleEditModalProps {
  readonly role: Role | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate: () => void;
}

export function RoleEditModal({ role, isOpen, onClose, onUpdate }: RoleEditModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const t = useTranslations("messages");

  // 역할 데이터가 변경될 때 폼 초기화
  useEffect(() => {
    if (isOpen && role) {
      setFormData({
        name: role.name,
        description: role.description || ''
      });
      setErrors({});
    }
  }, [isOpen, role]);

  // 입력 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // 기존 validation 시스템의 필터 적용
    const filteredValue = filterField(name as any, value);
    setFormData(prev => ({ ...prev, [name]: filteredValue }));

    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) return;

    // 기존 validation 시스템 활용
    const validation = validateRole(formData.name, t, formData.description);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.patch<APIResult>(`/api/admin/roles/${role.id}`, {
        name: formData.name,
        description: formData.description || null
      });

      if (data.success) {
        onUpdate();
        onClose();
      } else if (data.message === 'DuplicateField') {
        setErrors({ name: '이미 존재하는 역할명입니다.' });
      } else {
        setErrors({ general: '역할 수정에 실패했습니다.' });
      }
    } catch (error) {
      logger.error('[RoleEditModal] Role update failed', 'UI', error);
      setErrors({ general: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 시스템 기본 역할인지 확인
  const isSystemRole = role && ['admin', 'user'].includes(role.name.toLowerCase());

  // 모달이 열려있지 않거나 역할이 없으면 렌더링하지 않음
  if (!isOpen || !role) return null;

  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="flex-1 min-h-[24px]">
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Icon name="AlertCircle" size={16} />
            <span>{errors.general}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-[var(--text-color)] hover:text-[var(--hover-text)] font-medium transition-colors disabled:opacity-50 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          form="role-edit-form"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-[var(--hover-primary)] text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              수정 중...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} />
              수정 완료
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
      title="역할 수정"
      subtitle={`${role.name} 역할을 수정합니다`}
      icon="Edit"
      iconColor="text-blue-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      {/* 시스템 역할 경고 */}
      {isSystemRole && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <Icon name="AlertTriangle" size={16} />
            <span className="text-sm">
              시스템 기본 역할입니다. 이름 변경 시 주의하세요.
            </span>
          </div>
        </div>
      )}

      <form id="role-edit-form" onSubmit={handleSubmit} className="p-6 space-y-6 min-h-[450px]">
        {/* 역할 정보 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-[var(--border-color)]  dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400">
            <Icon name="Info" size={14} />
            <span>현재 {role.userCount}명의 사용자가 이 역할을 가지고 있습니다</span>
          </div>
        </div>

        {/* 역할명 */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-[var(--text-color)]">
            역할명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="역할명을 입력하세요"
            disabled={loading}
            className={`text-[var(--text-color)] w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base min-h-[48px] touch-manipulation ${errors.name
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)] bg-background'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.name && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <Icon name="AlertCircle" size={16} />
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-[var(--text-color)]">
            설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="역할에 대한 설명을 입력하세요 (선택사항)"
            disabled={loading}
            rows={4}
            className={`text-[var(--text-color)] bg-background w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none text-base min-h-[120px] touch-manipulation ${errors.description
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)]'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {errors.description && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <Icon name="AlertCircle" size={16} />
              <span>{errors.description}</span>
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
}