"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { BaseModal } from "./BaseModal";
import { Icon } from "@/components/ui/Icon";
import { filterField } from "@/utils/regex/input";
import { validateRole } from "@/utils/regex/admin";
import { FormErrors } from "@/types/admin";
import { useTranslations } from "next-intl";

interface RoleCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate: () => void;
}

export function RoleCreateModal({ isOpen, onClose, onUpdate }: RoleCreateModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const t = useTranslations("messages");

  // 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '' });
      setErrors({});
    }
  }, [isOpen]);

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

    // 기존 validation 시스템 활용
    const validation = validateRole(formData.name, t, formData.description);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<APIResult>('/api/admin/roles', {
        name: formData.name,
        description: formData.description || null
      });

      if (data.success) {
        onUpdate?.();
        onClose();
      } else if (data.message === 'DuplicateField') {
        setErrors({ name: '이미 존재하는 역할명입니다.' });
      } else {
        setErrors({ general: '역할 생성에 실패했습니다.' });
      }
    } catch (error) {
      console.error('[RoleCreateModal] Role creation failed:', error);
      setErrors({ general: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

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
          form="role-create-form"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-[var(--hover-primary)] text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              생성 중...
            </>
          ) : (
            <>
              <Icon name="Plus" size={16} />
              역할 생성
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
      title="새 역할 생성"
      subtitle="시스템에서 사용할 새로운 역할을 생성합니다"
      icon="UserPlus"
      iconColor="text-blue-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      <form id="role-create-form" onSubmit={handleSubmit} className="p-6 space-y-6 min-h-[400px]">
        {/* 역할명 입력 */}
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
            className={`w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base text-[var(--text-color)] min-h-[48px] touch-manipulation ${errors.name
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

        {/* 설명 입력 */}
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
            className={`text-[var(--text-color)] w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none text-base min-h-[120px] touch-manipulation ${errors.description
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-[var(--border-color)] bg-background'
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
