"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { ICON_CATEGORIES, IconCategory } from "@/constants/modal/iconCategories";
import { useRoles, formatRolesForRouter } from "@/hooks/admin";
import { logger } from "@/lib/services/logger";

interface WebRouter {
  uid: string;
  name: string;
  path: string;
  icon: string;
  role: string[];
  createdTime: string;
  updateTime: string;
}

interface RouterEditModalProps {
  readonly router: WebRouter | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUpdate: () => void;
}


export function RouterEditModal({ router, isOpen, onClose, onUpdate }: RouterEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: '',
    role: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('navigation');
  
  // 역할 데이터 가져오기
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  
  // 역할 옵션 포맷팅
  const availableRoles = formatRolesForRouter(roles);
  
  // Helper functions for styling
  const getInputClassName = (fieldName: string) => {
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
    const baseClass = 'w-7 text-center p-1 rounded-lg border-2 transition-all hover:scale-105';
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
              id={`role-edit-${role.value}`}
              type="checkbox"
              checked={formData.role.includes(role.value)}
              onChange={(e) => handleRoleChange(role.value, e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 bg-[var(--background)] border-[var(--border-color)] rounded focus:ring-blue-500 focus:ring-2"
              disabled={loading || rolesLoading}
              aria-describedby={`role-edit-desc-${role.value}`}
            />
            <div className="flex-1">
              <label htmlFor={`role-edit-${role.value}`} className="font-medium text-[var(--text-color)] cursor-pointer">
                {role.label}
              </label>
              <div id={`role-edit-desc-${role.value}`} className="text-sm text-[var(--text-color)] opacity-70 mt-1">
                {role.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 라우터 데이터가 변경될 때 폼 초기화
  useEffect(() => {
    if (isOpen && router) {
      setFormData({
        name: router.name,
        path: router.path,
        icon: router.icon,
        role: [...router.role]
      });
      setErrors({});

      // 현재 아이콘이 속한 카테고리 찾기
      const iconCategory = Object.entries(ICON_CATEGORIES).find(([, icons]) =>
        icons.some(icon => icon.name === router.icon)
      );
      if (iconCategory) {
        setSelectedCategory(iconCategory[0] as IconCategory);
      }
    }
  }, [isOpen, router]);

  // 입력 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '라우터명은 필수입니다.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '라우터명은 최소 2자 이상이어야 합니다.';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '라우터명은 최대 100자까지 가능합니다.';
    }

    // 경로 검증
    if (!formData.path.trim()) {
      newErrors.path = '경로는 필수입니다.';
    } else if (!formData.path.trim().startsWith('/')) {
      newErrors.path = '경로는 /로 시작해야 합니다.';
    } else if (!/^\/[a-z0-9/-]*$/i.test(formData.path.trim())) {
      newErrors.path = '경로는 영문, 숫자, 하이픈, 슬래시만 사용 가능합니다.';
    } else if (formData.path.includes('//')) {
      newErrors.path = '경로에 연속된 슬래시(//)는 사용할 수 없습니다.';
    }

    // 아이콘 검증
    if (!formData.icon) {
      newErrors.icon = '아이콘을 선택해주세요.';
    }

    // 역할 검증
    if (formData.role.length === 0) {
      newErrors.role = '최소 하나 이상의 역할을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 라우터 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!router || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.patch<APIResult>(`/api/admin/router/${router.uid}`, {
        name: formData.name.trim(),
        path: formData.path.trim(),
        icon: formData.icon,
        role: formData.role
      });

      if (data.success) {
        onUpdate(); // 목록 새로고침
        onClose(); // 모달 닫기
      } else if (data.message === 'DuplicateField') {
        const field = data.data?.field;
        if (field === 'name') {
          setErrors({ name: '이미 존재하는 라우터명입니다.' });
        } else if (field === 'path') {
          setErrors({ path: '이미 존재하는 경로입니다.' });
        } else {
          setErrors({ general: '중복된 정보가 있습니다.' });
        }
      } else {
        setErrors({ general: '라우터 수정에 실패했습니다.' });
      }
    } catch (error) {
      logger.error('[RouterEditModal] Router update failed', 'ROUTER', error);
      setErrors({ general: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열려있지 않거나 라우터가 없으면 렌더링하지 않음
  if (!isOpen || !router) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[var(--color-modal)] rounded-xl shadow-xl w-full max-w-2xl h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--modal-border)] bg-[var(--modal-header-bg)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Icon name="Edit" size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--title)]">
                웹 라우터 수정
              </h2>
              <p className="text-sm text-[var(--text-color)] opacity-70">
                {router.name} 라우터 정보를 수정합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            disabled={loading}
          >
            <Icon name="X" size={20} className="text-[var(--text-color)]" />
          </button>
        </div>

        {/* 라우터 정보 섹션 */}
        <div className="p-3 sm:p-4 bg-[var(--modal-header-bg)] border-b border-[var(--modal-border)] flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-sm">
            <div>
              <span className="text-[var(--text-color)]">등록일:</span>
              <div className="font-medium text-[var(--text-color)]">
                {new Date(router.createdTime).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <span className="text-[var(--text-color)]">마지막 수정:</span>
              <div className="font-medium text-[var(--text-color)]">
                {new Date(router.updateTime).toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-[var(--text-color)]">라우터 ID:</span>
              <div className="font-medium text-[var(--text-color)] text-xs break-all">
                {router.uid}
              </div>
            </div>
            <div>
              <span className="text-[var(--text-color)]">현재 경로:</span>
              <div className="font-medium text-[var(--text-color)] break-all">
                {router.path}
              </div>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ maxHeight: "calc(95vh - 200px)" }}>
              {/* 일반 에러 메시지 */}
              {errors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} className="text-red-600" />
                    <span className="text-sm text-red-600 dark:text-red-400">{errors.general}</span>
                  </div>
                </div>
              )}

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
                <div className="flex gap-2 p-3 bg-[var(--color-panel)] rounded-lg max-h-32 overflow-y-auto">
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

            </div>

            {/* 버튼 */}
            <div className="flex-shrink-0 bg-[var(--color-modal)] border-t border-[var(--border-color)]  p-4 sticky bottom-0 z-10">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-[var(--text-color)] border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)] transition-colors text-sm font-medium"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-[var(--hover-primary)] rounded-lg text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
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
          </form>
        </div>
      </div>
    </div>
  );
}