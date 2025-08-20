"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { Category } from "@/types/blog/post";
import type { BlogEditModalProps } from "@/types/ui/modal";
import { motion, AnimatePresence } from "framer-motion";

import type { 
  TranslationData, 
  MultiLangFormData, 
  SupportedLocale 
} from "@/types/blog/translation";

const LOCALES: Array<{ code: SupportedLocale; name: string; flag: string }> = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

export function BlogEditMultilangModal({ isOpen, onClose, onSuccess, post }: Readonly<BlogEditModalProps>) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('ko');
  
  const [formData, setFormData] = useState<MultiLangFormData>({
    type: 'post',
    categoryId: '',
    tags: [],
    images: [],
    status: 'draft',
    url: '',
    publishedAt: '',
    translations: {
      ko: { title: '', description: '', content: '', url: '' },
      en: { title: '', description: '', content: '', url: '' },
      ja: { title: '', description: '', content: '', url: '' },
      ru: { title: '', description: '', content: '', url: '' }
    }
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
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load existing translations if editing
  const loadTranslations = async (postId: string) => {
    try {
      const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}/translations`);
      if (data.success && data.data.translations) {
        const translations = data.data.translations;
        const newTranslations: typeof formData.translations = {
          ko: { title: '', description: '', content: '', url: '' },
          en: { title: '', description: '', content: '', url: '' },
          ja: { title: '', description: '', content: '', url: '' },
          ru: { title: '', description: '', content: '', url: '' }
        };

        translations.forEach((trans: any) => {
          if (trans.locale in newTranslations) {
            newTranslations[trans.locale as SupportedLocale] = {
              title: trans.title,
              description: trans.description,
              content: trans.content || '',
              url: trans.url || ''
            };
          }
        });

        setFormData(prev => ({
          ...prev,
          translations: newTranslations
        }));
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  };

  // Initialize form with post data
  useEffect(() => {
    if (isOpen && post) {
      // Convert legacy object format to array format
      let imagesArray: string[] = [];
      if (Array.isArray(post.images)) {
        imagesArray = post.images;
      } else if (post.images && typeof post.images === 'object') {
        const imageObj = post.images;
        if (imageObj.main && typeof imageObj.main === 'string') {
          imagesArray.push(imageObj.main);
        }
        if (imageObj.thumbnail && typeof imageObj.thumbnail === 'string' && imageObj.thumbnail !== imageObj.main) {
          imagesArray.push(imageObj.thumbnail);
        }
      }
      
      // Handle publishedAt safely
      let publishedAtValue = '';
      if (post.publishedAt) {
        try {
          const date = new Date(post.publishedAt);
          if (!isNaN(date.getTime())) {
            publishedAtValue = date.toISOString().slice(0, 16);
          }
        } catch (error) {
          console.warn('Invalid publishedAt date:', post.publishedAt);
        }
      }

      setFormData({
        type: post.type === 'notice' ? 'notice' : 'post',
        categoryId: post.category?.uid || '',
        tags: post.tags?.map(tag => tag.name) || [],
        images: imagesArray,
        status: post.status,
        url: post.url || '',
        publishedAt: publishedAtValue,
        translations: {
          ko: { 
            title: post.title, 
            description: post.description, 
            content: '',
            url: post.url || ''
          },
          en: { title: '', description: '', content: '', url: '' },
          ja: { title: '', description: '', content: '', url: '' },
          ru: { title: '', description: '', content: '', url: '' }
        }
      });
      
      loadCategories();
      if (post.id) {
        loadTranslations(post.id);
      }
    }
  }, [isOpen, post]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/(^-+)|(-+$)/g, '');
  };

  // Update translation for current locale
  const updateTranslation = (field: keyof TranslationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLocale]: {
          ...prev.translations[activeLocale],
          [field]: value
        }
      }
    }));
  };

  // Auto translate (placeholder - would integrate with translation API)
  const autoTranslate = async () => {
    // This would call a translation API
    alert('자동 번역 기능은 준비 중입니다.');
  };

  // Form validation
  const validateForm = () => {
    // Check if at least Korean translation has required fields
    if (!formData.translations.ko.title.trim()) {
      alert('한국어 제목은 필수입니다.');
      return false;
    }

    if (!formData.translations.ko.description.trim()) {
      alert('한국어 설명은 필수입니다.');
      return false;
    }

    if (!formData.categoryId) {
      alert('카테고리를 선택해주세요.');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Auto-generate slug if not provided for Korean
      if (!formData.translations.ko.url && formData.translations.ko.title) {
        formData.translations.ko.url = generateSlug(formData.translations.ko.title);
      }

      // Convert publishedAt to ISO string if provided
      let publishedAt = undefined;
      if (formData.publishedAt) {
        try {
          const date = new Date(formData.publishedAt);
          if (!isNaN(date.getTime())) {
            publishedAt = date.toISOString();
          }
        } catch (error) {
          console.warn('Invalid publishedAt date:', formData.publishedAt);
        }
      }

      const submitData = {
        ...formData,
        publishedAt,
        // Include legacy fields for backward compatibility
        title: formData.translations.ko.title,
        description: formData.translations.ko.description,
        url: formData.translations.ko.url || formData.url || generateSlug(formData.translations.ko.title)
      };

      const { data } = await api.put<APIResult>(
        `/api/admin/blog/${post?.id}`,
        submitData
      );

      if (data.success) {
        // Update translations separately if needed
        if (Object.keys(formData.translations).length > 0) {
          await api.put<APIResult>(
            `/api/admin/blog/${post?.id}/translations`,
            { translations: formData.translations }
          );
        }

        alert('블로그 글이 수정되었습니다.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update post:', error);
      const message = error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="블로그 글 수정 (다국어)"
      size="xl"
      icon="Globe"
      iconColor="text-blue-600"
    >
      <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
        {/* Language Tabs */}
        <div className="border-b border-[var(--modal-border)] -mx-4 sm:-mx-6 mb-6">
          <div className="flex gap-1 px-4 sm:px-6 overflow-x-auto">
            {LOCALES.map(locale => (
              <button
                key={locale.code}
                onClick={() => setActiveLocale(locale.code)}
                className={`relative flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 ${
                  activeLocale === locale.code 
                    ? 'text-[var(--modal-button-primary)]' 
                    : 'text-[var(--text-color)] opacity-70 hover:opacity-100 hover:bg-[var(--modal-header-bg)]'
                } rounded-t-lg`}
              >
                <span className="text-lg">{locale.flag}</span>
                <span>{locale.name}</span>
                {formData.translations[locale.code as keyof typeof formData.translations].title && (
                  <Icon name="CheckCircle" size={14} className="text-green-500" />
                )}
                {activeLocale === locale.code && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--modal-button-primary)] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Language-specific fields */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLocale}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                제목 ({LOCALES.find(l => l.code === activeLocale)?.name})
                {activeLocale === 'ko' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={formData.translations[activeLocale].title}
                onChange={(e) => updateTranslation('title', e.target.value)}
                className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                placeholder={`제목을 입력하세요 (${activeLocale.toUpperCase()})`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                설명 ({LOCALES.find(l => l.code === activeLocale)?.name})
                {activeLocale === 'ko' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={formData.translations[activeLocale].description}
                onChange={(e) => updateTranslation('description', e.target.value)}
                className="w-full modal-input px-4 py-2.5 h-24 resize-none border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                placeholder={`설명을 입력하세요 (${activeLocale.toUpperCase()})`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                URL Slug ({LOCALES.find(l => l.code === activeLocale)?.name})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.translations[activeLocale].url || ''}
                  onChange={(e) => updateTranslation('url', e.target.value)}
                  className="flex-1 modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                  placeholder={`url-slug-${activeLocale}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const slug = generateSlug(formData.translations[activeLocale].title);
                    updateTranslation('url', slug);
                  }}
                  disabled={!formData.translations[activeLocale].title}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  자동 생성
                </button>
              </div>
              {formData.translations[activeLocale].url && (
                <p className="text-xs text-[var(--text-color)] opacity-70 mt-1">
                  URL: /blog/{formData.translations[activeLocale].url}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                본문 ({LOCALES.find(l => l.code === activeLocale)?.name})
              </label>
              <textarea
                value={formData.translations[activeLocale].content}
                onChange={(e) => updateTranslation('content', e.target.value)}
                className="w-full modal-input px-4 py-2.5 h-48 resize-none border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                placeholder={`본문을 입력하세요 (${activeLocale.toUpperCase()})`}
              />
            </div>

            {activeLocale !== 'ko' && (
              <button
                onClick={autoTranslate}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-[var(--modal-button-primary)]/10 text-[var(--modal-button-primary)] rounded-lg hover:bg-[var(--modal-button-primary)]/20 transition-all duration-200 border border-[var(--modal-button-primary)]/20 hover:border-[var(--modal-button-primary)]/30"
              >
                <Icon name="Languages" size={16} />
                한국어에서 자동 번역
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Common fields */}
        <div className="space-y-4 pt-4 border-t border-[var(--modal-border)]">
          {/* Type and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                글 유형
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev: MultiLangFormData) => ({ ...prev, type: e.target.value as 'post' | 'notice' }))}
                className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
              >
                <option value="post">📄 일반 글</option>
                <option value="notice">📢 공지사항</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev: MultiLangFormData) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                disabled={loadingCategories}
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category.uid} value={category.uid}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
              태그 (Enter 또는 쉼표로 구분)
            </label>
            <input
              type="text"
              onKeyDown={(e) => {
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
              }}
              placeholder="태그를 입력하고 Enter를 누르세요"
              className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--modal-button-primary)]/10 text-[var(--modal-button-primary)] rounded-full text-sm transition-all duration-200 hover:bg-[var(--modal-button-primary)]/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))}
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
          <div>
            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
              이미지 (첫 번째가 대표 이미지)
            </label>
            
            {/* Image Upload Options */}
            <div className="space-y-3">
              {/* File Upload Button */}
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files) {
                        alert('파일 업로드 기능은 Cloudflare R2 연동 후 사용 가능합니다.\n현재는 URL 입력만 지원됩니다.');
                      }
                    }}
                  />
                  <div className="w-full px-4 py-2.5 border-2 border-dashed border-[var(--border-color)] rounded-lg bg-[var(--modal-input-bg)] hover:border-[var(--modal-input-focus)] transition-all duration-200 cursor-pointer text-center">
                    <Icon name="Upload" size={20} className="inline-block mb-1" />
                    <span className="block text-sm text-[var(--text-color)]">
                      이미지 파일 선택 (준비 중)
                    </span>
                    <span className="block text-xs text-[var(--text-color)] opacity-60 mt-1">
                      클릭하여 파일 선택 또는 드래그 앤 드롭
                    </span>
                  </div>
                </label>
              </div>

              {/* URL Input */}
              <div className="relative">
                <input
                  type="url"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.currentTarget.value;
                      if (url && !formData.images.includes(url)) {
                        setFormData(prev => ({ 
                          ...prev, 
                          images: [...prev.images, url]
                        }));
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  placeholder="https://example.com/image.jpg (Enter를 눌러 추가)"
                  className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                />
                <Icon name="Link" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-color)] opacity-50" />
              </div>
            </div>
            
            {/* Image List */}
            {formData.images.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="text-sm text-[var(--text-color)] opacity-70">
                  추가된 이미지들 ({formData.images.length}개)
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((imageUrl, index) => (
                    <div key={`image-${imageUrl.substring(0, 30)}-${index}`} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--hover)]">
                        <img
                          src={imageUrl}
                          alt={`업로드된 콘텐츠 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
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
          </div>

          {/* Status and Published Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev: MultiLangFormData) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
              >
                <option value="draft">📝 임시저장</option>
                <option value="published">게시</option>
              </select>
            </div>

            {formData.status === 'published' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                  게시 일시 (선택사항 - 예약 게시)
                </label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData((prev: MultiLangFormData) => ({ ...prev, publishedAt: e.target.value }))}
                  className="w-full modal-input px-4 py-2.5 border border-[var(--modal-input-border)] rounded-lg bg-[var(--modal-input-bg)] focus:border-[var(--modal-input-focus)] focus:ring-2 focus:ring-[var(--modal-input-focus)]/20 transition-all duration-200"
                />
                {formData.publishedAt && (
                  <p className="text-xs text-[var(--text-color)] opacity-70 mt-1">
                    {new Date(formData.publishedAt) > new Date() ? '예약 게시로 설정됩니다.' : '지정된 일시로 게시됩니다.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Translation Progress */}
        <div className="bg-[var(--modal-header-bg)] p-4 rounded-lg border border-[var(--modal-border)]">
          <h4 className="text-sm font-medium text-[var(--text-color)] mb-3 flex items-center gap-2">
            <Icon name="ListChecks" size={16} className="text-[var(--modal-button-primary)]" />
            번역 진행 상황
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {LOCALES.map(locale => {
              const translation = formData.translations[locale.code as keyof typeof formData.translations];
              const isComplete = translation.title && translation.description;
              
              return (
                <div key={locale.code} className="flex items-center justify-between p-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--modal-border)]">
                  <span className="text-sm text-[var(--text-color)] flex items-center gap-2">
                    <span className="text-lg">{locale.flag}</span>
                    <span>{locale.name}</span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isComplete 
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                      : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                  }`}>
                    {isComplete ? '완료' : '미완료'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--modal-border)] -mx-4 sm:-mx-6 px-4 sm:px-6">
          <button
            onClick={onClose}
            className="modal-button-secondary px-5 py-2.5 border border-[var(--modal-border)] rounded-lg hover:bg-[var(--modal-header-bg)] transition-all duration-200"
            disabled={loading}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="modal-button-primary px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                저장 중...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} />
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}