"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "../common/BaseModal";
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
  _count?: {
    posts: number;
    children: number;
  };
}

interface CategoryEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly category: Category | null;
}

export function CategoryEditModal({ isOpen, onClose, onSuccess, category }: CategoryEditModalProps) {
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
        // Filter out current category and its descendants to prevent circular references
        const filteredCategories = data.data.categories.filter((cat: Category) => {
          if (!category) return true;
          return cat.uid !== category.uid && !cat.path.includes(category.path);
        });
        setCategories(filteredCategories);
      }
    } catch (error) {
      // Failed to load categories
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize form with category data
  useEffect(() => {
    if (category && isOpen) {
      setFormData({
        code: category.code,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || ''
      });
      loadCategories();
    }
  }, [category, isOpen]);

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

  // Success handler
  const handleSuccess = (data: APIResult) => {
    alert(data.data.message || '카테고리가 수정되었습니다.');
    onSuccess();
    onClose();
  };

  // Error handler
  const handleError = (error: any) => {
    alert('카테고리 수정 중 오류가 발생했습니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null
      };

      const { data } = await api.put<APIResult>(`/api/admin/category/${category.uid}`, payload);
      
      if (data.success) {
        handleSuccess(data);
      } else {
        alert(data.message || '카테고리 수정에 실패했습니다.');
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
        form="category-edit-form"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            수정 중...
          </>
        ) : (
          <>
            <Icon name="Save" size={16} />
            카테고리 수정
          </>
        )}
      </button>
    </div>
  );

  if (!category) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="카테고리 수정"
      subtitle={`"${category.name}" 카테고리를 수정합니다`}
      icon="FolderEdit"
      iconColor="text-orange-600"
      size="lg"
      footer={footer}
      loading={loading}
    >
      <form id="category-edit-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Current Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-[var(--text-color)] mb-2">현재 정보</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--text-color)] opacity-60">레벨:</span>
              <span className="ml-2 text-[var(--text-color)]">레벨 {category.level}</span>
            </div>
            <div>
              <span className="text-[var(--text-color)] opacity-60">경로:</span>
              <span className="ml-2 text-[var(--text-color)] font-mono text-xs">{category.path}</span>
            </div>
            <div>
              <span className="text-[var(--text-color)] opacity-60">하위 카테고리:</span>
              <span className="ml-2 text-[var(--text-color)]">{category._count?.children || 0}개</span>
            </div>
            <div>
              <span className="text-[var(--text-color)] opacity-60">게시글:</span>
              <span className="ml-2 text-[var(--text-color)]">{category._count?.posts || 0}개</span>
            </div>
          </div>
        </div>

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
            상위 카테고리를 변경하면 하위 카테고리들의 경로도 자동으로 업데이트됩니다.
          </p>
        </div>

        {/* Warnings */}
        {category._count?.children && category._count.children > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p>이 카테고리는 {category._count?.children || 0}개의 하위 카테고리를 가지고 있습니다.</p>
                <p className="mt-1">상위 카테고리를 변경하면 모든 하위 카테고리의 경로가 함께 변경됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {category._count?.posts && category._count.posts > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p>이 카테고리는 {category._count?.posts || 0}개의 게시글을 포함하고 있습니다.</p>
                <p className="mt-1">카테고리 정보 변경이 기존 게시글에 반영됩니다.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
}