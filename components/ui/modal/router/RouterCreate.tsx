"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { filterField } from "@/utils/regex/input";
import { validateRouter } from "@/utils/regex/admin";
import { FormErrors } from "@/types/admin";
import { ICON_CATEGORIES, IconCategory } from "@/constants/modal/iconCategories";
import { useRoles, formatRolesForRouter } from "@/hooks/admin";
import { useTranslations } from "next-intl";

interface RouterCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate: () => void;
}


export function RouterCreateModal({ isOpen, onClose, onUpdate }: RouterCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: '',
    role: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('navigation');
  
  // Helper functions for styling
  const getInputClassName = (fieldName: keyof FormErrors) => {
    const baseClass = 'w-full px-3 py-2 border rounded-lg bg-background text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const errorClass = errors[fieldName] ? 'border-red-500' : 'border-[var(--border-color)]';
    return `${baseClass} ${errorClass}`;
  };
  
  const getCategoryButtonClassName = (category: string) => {
    const baseClass = 'px-3 py-1 text-xs rounded-full border transition-colors';
    if (selectedCategory === category) {
      return `${baseClass} bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200`;
    }
    return `${baseClass} bg-[var(--background)] text-[var(--text-color)] border-[var(--border-color)]  hover:bg-[var(--hover)]`;
  };
  
  const getIconButtonClassName = (iconName: string) => {
    const baseClass = 'p-2 rounded-lg border-2 transition-all hover:scale-105';
    if (formData.icon === iconName) {
      return `${baseClass} border-blue-500 bg-blue-100 dark:bg-blue-900`;
    }
    return `${baseClass} border-[var(--border-color)]  hover:border-[var(--hover-primary)] bg-[var(--background)]`;
  };
  
  const renderRolesSection = () => {
    if (rolesLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-[var(--text-color)] opacity-60">역할 목록 로딩 중...</span>
        </div>
      );
    }
    
    if (rolesError) {
      return (
        <div className="text-center py-4 text-red-600 text-sm">
          역할 목록을 가져오는데 실패했습니다.
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {availableRoles.map((role) => (
          <div key={role.value} className="flex items-start gap-3 p-3 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] transition-colors">
            <input
              id={`role-${role.value}`}
              type="checkbox"
              checked={formData.role.includes(role.value)}
              onChange={(e) => handleRoleChange(role.value, e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 bg-[var(--background)] border-[var(--border-color)] rounded focus:ring-blue-500 focus:ring-2"
              disabled={loading || rolesLoading}
              aria-describedby={`role-desc-${role.value}`}
            />
            <div className="flex-1">
              <label htmlFor={`role-${role.value}`} className="font-medium text-[var(--text-color)] cursor-pointer">
                {role.label}
              </label>
              <div id={`role-desc-${role.value}`} className="text-sm text-[var(--text-color)] opacity-70 mt-1">
                {role.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 역할 데이터 가져오기
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  const t = useTranslations("messages");
  
  // 역할 옵션 포맷팅
  const availableRoles = formatRolesForRouter(roles);

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', path: '', icon: '', role: [] });
      setErrors({});
      setSelectedCategory('navigation');
    }
  }, [isOpen]);

  // 입력 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 기존 validation 시스템의 필터 적용
    const filteredValue = filterField(name as any, value);
    setFormData(prev => ({ ...prev, [name]: filteredValue }));

    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 역할 선택/해제 처리
  const handleRoleChange = (roleValue: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      role: checked
        ? [...prev.role, roleValue]
        : prev.role.filter(r => r !== roleValue)
    }));

    // 역할 에러 클리어
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  // 아이콘 선택 처리
  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));

    // 아이콘 에러 클리어
    if (errors.icon) {
      setErrors(prev => ({ ...prev, icon: '' }));
    }
  };

  // 경로 자동 생성 (이름 기반)
  const generatePath = () => {
    if (formData.name && !formData.path) {
      const generatedPath = '/' + formData.name
        .toLowerCase()
        .replace(/([^a-z0-9가-힣]+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');

      setFormData(prev => ({ ...prev, path: generatedPath }));
    }
  };

  // 중복 필드 에러 처리
  const handleDuplicateError = (field: string) => {
    if (field === 'name') {
      setErrors({ name: '이미 존재하는 라우터명입니다.' });
    } else if (field === 'path') {
      setErrors({ path: '이미 존재하는 경로입니다.' });
    } else {
      setErrors({ general: '중복된 정보가 있습니다.' });
    }
  };

  // API 응답 에러 처리
  const handleApiError = (data: APIResult) => {
    if (data.message === 'DuplicateField') {
      handleDuplicateError(data.data?.field);
    } else {
      setErrors({ general: '라우터 생성에 실패했습니다.' });
    }
  };

  // 성공 처리
  const handleSuccess = () => {
    onUpdate();
    onClose();
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기존 validation 시스템 활용 (t 함수 전달)
    const validation = validateRouter(formData.name, formData.path, formData.icon, formData.role, t);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<APIResult>('/api/admin/router', {
        name: formData.name,
        path: formData.path,
        icon: formData.icon,
        role: formData.role
      });

      if (data.success) {
        handleSuccess();
      } else {
        handleApiError(data);
      }
    } catch (error) {
      console.error('[RouterCreateModal] Router creation failed:', error);
      setErrors({ general: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>{errors.general}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-3 py-1.5 text-[var(--text-color)] hover:text-[var(--hover-text)] font-medium transition-colors disabled:opacity-50 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          form="router-create-form"
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-[var(--hover-success)] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              생성 중...
            </>
          ) : (
            <>
              <Icon name="Plus" size={16} />
              라우터 생성
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
      title="새 웹 라우터 생성"
      subtitle="웹사이트 네비게이션에 새로운 경로를 추가합니다"
      icon="Plus"
      iconColor="text-green-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      {/* 미리보기 섹션 */}
      {(formData.name || formData.icon) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400 mb-2">
            <Icon name="Eye" size={16} />
            <span className="font-medium">네비게이션 미리보기</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-[var(--border-color)]">
            {formData.icon && (
              <Icon name={formData.icon} size={16} className="text-blue-600" />
            )}
            <span className="font-medium text-[var(--text-color)]">
              {formData.name || '라우터명'}
            </span>
            {formData.path && (
              <span className="text-xs text-[var(--text-color)] bg-badge px-2 py-1 rounded">
                {formData.path}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 폼 */}
      <form id="router-create-form" onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-300px)] overflow-y-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 라우터명 */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-color)]">
              라우터명 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={generatePath}
              placeholder="예: 대시보드, 사용자 관리"
              className={getInputClassName('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                {errors.name}
              </p>
            )}
          </div>

          {/* 경로 */}
          <div className="space-y-2">
            <label htmlFor="path" className="block text-sm font-medium text-[var(--text-color)]">
              경로 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="path"
                name="path"
                type="text"
                value={formData.path}
                onChange={handleInputChange}
                placeholder="예: /dashboard, /users"
                className={getInputClassName('path')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={generatePath}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                disabled={loading || !formData.name}
              >
                자동생성
              </button>
            </div>
            {errors.path && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                {errors.path}
              </p>
            )}
          </div>
        </div>

        {/* 아이콘 선택 */}
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-[var(--text-color)]">
            아이콘 <span className="text-red-500">*</span>
          </legend>

          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(ICON_CATEGORIES).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category as IconCategory)}
                className={getCategoryButtonClassName(category)}
                disabled={loading}
              >
                {category === 'navigation' && '네비게이션'}
                {category === 'business' && '비즈니스'}
                {category === 'content' && '콘텐츠'}
                {category === 'system' && '시스템'}
              </button>
            ))}
          </div>

          {/* 아이콘 그리드 */}
          <div className="grid grid-cols-8 gap-2 p-3 bg-[var(--color-panel)] rounded-lg max-h-32 overflow-y-auto">
            {ICON_CATEGORIES[selectedCategory].map((icon) => (
              <button
                key={icon.name}
                type="button"
                onClick={() => handleIconSelect(icon.name)}
                className={getIconButtonClassName(icon.name)}
                title={icon.label}
                disabled={loading}
              >
                <Icon name={icon.name} size={16} className="text-[var(--text-color)]" />
              </button>
            ))}
          </div>

          {formData.icon && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-color)] opacity-70">
              <Icon name="Check" size={14} className="text-green-600" />
              선택된 아이콘: {formData.icon}
            </div>
          )}

          {errors.icon && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />
              {errors.icon}
            </p>
          )}
        </fieldset>

        {/* 접근 권한 */}
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-[var(--text-color)]">
            접근 권한 <span className="text-red-500">*</span>
          </legend>
          {renderRolesSection()}
          {errors.role && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />
              {errors.role}
            </p>
          )}
        </fieldset>

      </form>
    </BaseModal>
  );
}