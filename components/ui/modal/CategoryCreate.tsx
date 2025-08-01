"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";

interface Category {
  uid: string;
  code: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
}

interface CategoryCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export function CategoryCreateModal({ isOpen, onClose, onSuccess }: CategoryCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    slug: '',
    parentId: ''
  });

  // Load categories for parent selection
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get<APIResult>('/api/admin/category?limit=100');
      if (data.success && data.data.categories) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      // Failed to load categories
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  // Form validation
  const validateForm = () => {
    if (!formData.code.trim()) {
      alert('카테고리 코드는 필수입니다.');
      return false;
    }

    if (!formData.name.trim()) {
      alert('카테고리명은 필수입니다.');
      return false;
    }

    if (!formData.slug.trim()) {
      alert('Slug는 필수입니다.');
      return false;
    }

    // Validate code format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.code)) {
      alert('카테고리 코드는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.');
      return false;
    }

    // Validate slug format
    if (!/^[a-z0-9가-힣-]+$/.test(formData.slug)) {
      alert('Slug는 소문자, 숫자, 한글, 하이픈(-)만 사용할 수 있습니다.');
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      slug: '',
      parentId: ''
    });
  };

  // Success handler
  const handleSuccess = (data: APIResult) => {
    alert(data.data.message || '카테고리가 생성되었습니다.');
    onSuccess();
    onClose();
    resetForm();
  };

  // Error handler
  const handleError = (error: any) => {
    alert('카테고리 생성 중 오류가 발생했습니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null
      };

      const { data } = await api.post<APIResult>('/api/admin/category', payload);
      
      if (data.success) {
        handleSuccess(data);
      } else {
        alert(data.message || '카테고리 생성에 실패했습니다.');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Build category tree for select options
  const buildCategoryOptions = (categories: Category[], parentId: string | null = null, level = 0): React.ReactElement[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .flatMap(cat => [
        <option key={cat.uid} value={cat.uid}>
          {'　'.repeat(level) + (level > 0 ? '└ ' : '')}{cat.name}
        </option>,
        ...buildCategoryOptions(categories, cat.uid, level + 1)
      ]);
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
        form="category-create-form"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            생성 중...
          </>
        ) : (
          <>
            <Icon name="Plus" size={16} />
            카테고리 생성
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="새 카테고리"
      subtitle="블로그 카테고리를 생성합니다"
      icon="FolderPlus"
      iconColor="text-blue-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      <form id="category-create-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Category Code */}
        <div className="space-y-2">
          <label htmlFor="category-code" className="block text-sm font-medium text-[var(--text-color)]">
            카테고리 코드 *
          </label>
          <input
            id="category-code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="예: TECH, LIFESTYLE"
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-[var(--text-color)] opacity-60">
            영문 대문자, 숫자, 언더스코어(_)만 사용 가능합니다.
          </p>
        </div>

        {/* Category Name */}
        <div className="space-y-2">
          <label htmlFor="category-name" className="block text-sm font-medium text-[var(--text-color)]">
            카테고리명 *
          </label>
          <input
            id="category-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="예: 기술, 라이프스타일"
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label htmlFor="category-slug" className="block text-sm font-medium text-[var(--text-color)]">
            Slug (URL용) *
          </label>
          <input
            id="category-slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
            placeholder="예: tech, lifestyle"
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-[var(--text-color)] opacity-60">
            URL에 사용될 문자열입니다. 소문자, 숫자, 하이픈(-)만 사용 가능합니다.
          </p>
        </div>

        {/* Parent Category */}
        <div className="space-y-2">
          <label htmlFor="category-parent" className="block text-sm font-medium text-[var(--text-color)]">
            상위 카테고리
          </label>
          {loadingCategories ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <select
              id="category-parent"
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">최상위 카테고리</option>
              {buildCategoryOptions(categories)}
            </select>
          )}
          <p className="text-xs text-[var(--text-color)] opacity-60">
            선택하지 않으면 최상위 카테고리로 생성됩니다.
          </p>
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>카테고리는 계층 구조로 관리됩니다.</p>
              <p className="mt-1">경로는 상위 카테고리를 기반으로 자동 생성됩니다.</p>
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}