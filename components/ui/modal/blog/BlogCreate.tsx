"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { Category } from "@/types/post";

interface BlogCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export function BlogCreateModal({ isOpen, onClose, onSuccess }: BlogCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formData, setFormData] = useState({
    type: 'post',
    title: '',
    description: '',
    categoryId: '',
    tags: [] as string[],
    images: [] as string[],
    status: 'draft',
    language: 'ko'
  });

  // Load categories
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get<APIResult>('/api/post/categories');
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
      // Reset errors and success message when modal opens
      setErrors({});
      setSuccessMessage('');
      resetForm();
    }
  }, [isOpen]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '제목은 필수입니다.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명은 필수입니다.';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '카테고리를 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Clear field error when value changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'post',
      title: '',
      description: '',
      categoryId: '',
      tags: [],
      images: [],
      status: 'draft',
      language: 'ko'
    });
    setImagePreview('');
  };

  // Success handler
  const handleSuccess = (data: APIResult) => {
    setSuccessMessage(data.data.message || '블로그 글이 생성되었습니다.');
    setTimeout(() => {
      onSuccess();
      onClose();
      resetForm();
    }, 1500);
  };

  // Error handler
  const handleError = (error: any) => {
    setErrors({ general: '블로그 글 생성 중 오류가 발생했습니다.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<APIResult>('/api/admin/blog', formData);
      
      if (data.success) {
        handleSuccess(data);
      } else {
        setErrors({ general: data.message || '블로그 글 생성에 실패했습니다.' });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>{errors.general}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Icon name="CheckCircle" size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
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
          form="blog-create-form"
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
              글 생성
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
      title="새 글 작성"
      subtitle="블로그에 새로운 글을 작성합니다"
      icon="FileText"
      iconColor="text-blue-600"
      size="xl"
      footer={footer}
      loading={loading}
    >
      <form id="blog-create-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Type selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-color)]">
            글 유형
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value="post"
                checked={formData.type === 'post'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">📄 일반 글</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value="notice"
                checked={formData.type === 'notice'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">📢 공지사항</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="blog-title" className="block text-sm font-medium text-[var(--text-color)]">
            제목 *
          </label>
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
          <input
            id="blog-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="블로그 글 제목을 입력하세요"
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="blog-description" className="block text-sm font-medium text-[var(--text-color)]">
            설명 *
          </label>
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
          <textarea
            id="blog-description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="글에 대한 간단한 설명을 입력하세요"
            rows={3}
            required
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label htmlFor="blog-category" className="block text-sm font-medium text-[var(--text-color)]">
            카테고리 *
          </label>
          {errors.categoryId && (
            <p className="text-sm text-red-600">{errors.categoryId}</p>
          )}
          {loadingCategories ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <select
              id="blog-category"
              value={formData.categoryId}
              onChange={(e) => handleFieldChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.uid} value={category.uid}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="blog-tags" className="block text-sm font-medium text-[var(--text-color)]">
            태그 (Enter 또는 쉼표로 구분)
          </label>
          <input
            id="blog-tags"
            type="text"
            onKeyDown={handleTagInput}
            placeholder="태그를 입력하고 Enter를 누르세요"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="space-y-2">
          <label htmlFor="blog-image" className="block text-sm font-medium text-[var(--text-color)]">
            이미지 URL들 (첫 번째가 대표 이미지)
          </label>
          <input
            id="blog-image"
            type="url"
            value=""
            onChange={(e) => {
              const url = e.target.value;
              if (url && !formData.images.includes(url)) {
                setFormData(prev => ({ 
                  ...prev, 
                  images: [...prev.images, url]
                }));
                if (formData.images.length === 0) {
                  setImagePreview(url);
                }
                e.target.value = '';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const url = e.currentTarget.value;
                if (url && !formData.images.includes(url)) {
                  setFormData(prev => ({ 
                    ...prev, 
                    images: [...prev.images, url]
                  }));
                  if (formData.images.length === 0) {
                    setImagePreview(url);
                  }
                  e.currentTarget.value = '';
                }
              }
            }}
            placeholder="https://example.com/image.jpg (Enter를 눌러 추가)"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Image List */}
          {formData.images.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-[var(--text-color)] opacity-70">
                추가된 이미지들 ({formData.images.length}개)
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.images.map((imageUrl, index) => (
                  <div key={`image-${imageUrl.substring(0, 30)}-${index}`} className="relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--hover)]">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const sibling = target.nextElementSibling as HTMLElement;
                          target.style.display = 'none';
                          if (sibling) sibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-xs text-[var(--text-color)] opacity-60">
                        오류
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                        대표
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, images: newImages }));
                        if (index === 0 && newImages.length > 0) {
                          setImagePreview(newImages[0]);
                        } else if (newImages.length === 0) {
                          setImagePreview('');
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Image Preview */}
          {imagePreview && (
            <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-[var(--border-color)]">
              <img
                src={imagePreview}
                alt="Main Preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreview('')}
              />
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-sm px-2 py-1 rounded">
                대표 이미지
              </div>
            </div>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <label htmlFor="blog-language" className="block text-sm font-medium text-[var(--text-color)]">
            언어
          </label>
          <select
            id="blog-language"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ko">🇰🇷 한국어</option>
            <option value="en">🇺🇸 English</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ru">🇷🇺 Русский</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-color)]">
            상태
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">📝 임시저장</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === 'published'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[var(--text-color)]">✅ 게시</span>
            </label>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>글 내용은 생성 후 콘텐츠 에디터에서 작성할 수 있습니다.</p>
              <p className="mt-1">콘텐츠 에디터에서는 제품 정보, 작성자 정보, 본문 내용을 구조화된 형식으로 작성할 수 있습니다.</p>
              <p className="mt-1">이미지는 추후 Cloudflare R2 업로드 기능이 추가될 예정입니다.</p>
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}