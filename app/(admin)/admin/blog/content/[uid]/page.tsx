"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { Post } from "@/types/post";
import { BlogContent, BlogImage, ProductItem, ContentSection } from '@/types/adminBlog';
import { getLanguageName } from '@/utils/admin/blog/utils';


export default function BlogContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.uid as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [language, setLanguage] = useState<string>("ko");
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<BlogImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [languageStatus, setLanguageStatus] = useState<Record<string, boolean>>({
    ko: false,
    en: false,
    ja: false,
    ru: false
  });
  
  const [blogContent, setBlogContent] = useState<BlogContent>({
    product: [],
    author: {
      name: '',
      description: '',
      profileImage: ''
    },
    content: []
  });

  // Load post metadata
  useEffect(() => {
    loadPostData();
    loadImages();
  }, [postId]);

  // Check language status when post loads
  useEffect(() => {
    if (post) {
      checkLanguageStatus();
    }
  }, [post]);

  // Load post data and content
  const loadPostData = async () => {
    setLoading(true);
    try {
      // Get post metadata
      const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}`);
      if (data.success && data.data.post) {
        setPost(data.data.post);
        
        // Try to load existing content from CDN
        await loadContentFromCDN(data.data.post.url, language);
      }
    } catch (error) {
      console.error('Failed to load post data:', error);
      alert("글 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Load content from CDN
  const loadContentFromCDN = async (url: string, lang: string) => {
    try {
      const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}/content?language=${lang}`);
      if (data.success && data.data.content) {
        setBlogContent(data.data.content);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to load content from CDN:', error);
      // If no content exists, use default structure
      setBlogContent({
        product: [],
        author: {
          name: '',
          description: '',
          profileImage: ''
        },
        content: []
      });
    }
  };

  // Check language status
  const checkLanguageStatus = async () => {
    if (!post) return;
    
    const languages = ['ko', 'en', 'ja', 'ru'];
    const status: Record<string, boolean> = {};
    
    for (const lang of languages) {
      try {
        const response = await fetch(`https://cdn.elice.pro/post/${post.uid}/${lang}.json`);
        status[lang] = response.ok;
      } catch (error) {
        console.error(`Failed to check language status for ${lang}:`, error);
        status[lang] = false;
      }
    }
    
    setLanguageStatus(status);
  };

  // Product management
  const addProduct = () => {
    setBlogContent(prev => ({
      ...prev,
      product: [
        ...prev.product,
        {
          url: "",
          tag: [],
          title: "",
          description: ""
        }
      ]
    }));
    setHasChanges(true);
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: any) => {
    setBlogContent(prev => ({
      ...prev,
      product: prev.product.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
    setHasChanges(true);
  };

  const removeProduct = (index: number) => {
    setBlogContent(prev => ({
      ...prev,
      product: prev.product.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // Content section management
  const addContentSection = () => {
    setBlogContent(prev => ({
      ...prev,
      content: [
        ...prev.content,
        {
          title: "",
          context: ""
        }
      ]
    }));
    setHasChanges(true);
  };

  const updateContentSection = (index: number, field: keyof ContentSection, value: string) => {
    setBlogContent(prev => ({
      ...prev,
      content: prev.content.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
    setHasChanges(true);
  };

  const removeContentSection = (index: number) => {
    setBlogContent(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };


  // Load images from R2
  const loadImages = async () => {
    setLoadingImages(true);
    try {
      const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}/images`);
      if (data.success && data.data.images) {
        setImages(data.data.images);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Upload image to R2
  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('postId', postId);
      
      const { data } = await api.post<APIResult>(`/api/admin/blog/upload-image`, formData);
      
      if (data.success && data.data.image) {
        setImages(prev => [...prev, data.data.image]);
        return data.data.image.url;
      } else {
        alert("이미지 업로드에 실패했습니다.");
        return null;
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image file selection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, productIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("JPG, PNG, GIF, WebP 형식만 지원합니다.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    
    const imageUrl = await uploadImage(file);
    if (imageUrl && productIndex !== undefined) {
      updateProduct(productIndex, 'url', imageUrl);
    }
  };

  // Delete image from R2
  const deleteImage = async (imageId: string) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;
    
    try {
      const { data } = await api.delete<APIResult>(`/api/admin/blog/${postId}/images/${imageId}`);
      if (data.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert("이미지 삭제에 실패했습니다.");
    }
  };

  // Save content
  const saveContent = async () => {
    if (!post) return;
    
    setSaving(true);
    try {
      // Save to API (which would save to CDN)
      const { data } = await api.put<APIResult>(`/api/admin/blog/${postId}/content`, {
        language,
        content: blogContent
      });

      if (data.success) {
        alert("콘텐츠가 저장되었습니다.");
        setHasChanges(false);
        // Update language status
        setLanguageStatus(prev => ({ ...prev, [language]: true }));
        // Refresh language status
        checkLanguageStatus();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Copy content from another language
  const copyFromLanguage = async (fromLang: string) => {
    if (!post) return;
    
    const confirmed = confirm(`${fromLang} 언어의 콘텐츠를 현재 언어(${language})로 복사하시겠습니까? 현재 내용은 덮어씌워집니다.`);
    if (!confirmed) return;
    
    try {
      const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}/content?language=${fromLang}`);
      if (data.success && data.data.content) {
        setBlogContent(data.data.content);
        setHasChanges(true);
        alert(`${fromLang} 언어에서 콘텐츠를 복사했습니다.`);
      } else {
        alert(`${fromLang} 언어의 콘텐츠를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error('Failed to copy content:', error);
      alert("콘텐츠 복사 중 오류가 발생했습니다.");
    }
  };

  // Delete language version
  const deleteLanguageVersion = async (lang: string) => {
    if (!post) return;
    
    const confirmed = confirm(`${lang} 언어의 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    
    try {
      const { data } = await api.delete<APIResult>(`/api/admin/blog/${postId}/content?language=${lang}`);
      if (data.success) {
        alert(`${lang} 언어의 콘텐츠가 삭제되었습니다.`);
        setLanguageStatus(prev => ({ ...prev, [lang]: false }));
        
        // If deleted current language, reload
        if (lang === language) {
          await loadContentFromCDN(post.url, language);
        }
      }
    } catch (error) {
      console.error('Failed to delete language version:', error);
      alert("콘텐츠 삭제 중 오류가 발생했습니다.");
    }
  };

  // Tag management for products
  const handleProductTagInput = (productIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim();
      
      if (tag) {
        const product = blogContent.product[productIndex];
        if (!product.tag.includes(tag)) {
          updateProduct(productIndex, 'tag', [...product.tag, tag]);
        }
        input.value = '';
      }
    }
  };

  const removeProductTag = (productIndex: number, tagToRemove: string) => {
    const product = blogContent.product[productIndex];
    updateProduct(productIndex, 'tag', product.tag.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-[var(--text-color)]">글을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/admin/blog')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--color-modal)]/95 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/blog')}
                className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
              >
                <Icon name="ArrowLeft" size={20} className="text-[var(--text-color)]" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-panel)]">
                  블로그 콘텐츠 편집
                </h1>
                <p className="text-sm text-[var(--text-color)] opacity-60">
                  {post.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  loadContentFromCDN(post.url, e.target.value);
                }}
                className="px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
              >
                <option value="ko">🇰🇷 한국어</option>
                <option value="en">🇺🇸 English</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="ru">🇷🇺 Русский</option>
              </select>
              
              {/* Save button */}
              <button
                onClick={saveContent}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  hasChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        </div>
      </div>

      {/* Language Management */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-semibold text-[var(--text-panel)]">언어별 콘텐츠 상태:</h3>
              <div className="flex items-center gap-3">
                {(['ko', 'en', 'ja', 'ru'] as const).map((lang) => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="text-sm">
                      {lang === 'ko' && '🇰🇷 한국어'}
                      {lang === 'en' && '🇺🇸 English'}
                      {lang === 'ja' && '🇯🇵 日本語'}
                      {lang === 'ru' && '🇷🇺 Русский'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      languageStatus[lang] 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      <Icon name={languageStatus[lang] ? 'Check' : 'X'} size={12} />
                      {languageStatus[lang] ? '존재' : '없음'}
                    </span>
                    {lang !== language && languageStatus[lang] && (
                      <button
                        onClick={() => copyFromLanguage(lang)}
                        className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
                        title={`${lang}에서 복사`}
                      >
                        <Icon name="Copy" size={14} className="text-[var(--text-color)] opacity-60" />
                      </button>
                    )}
                    {lang === language && languageStatus[lang] && (
                      <button
                        onClick={() => deleteLanguageVersion(lang)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Icon name="Trash2" size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-[var(--text-color)] opacity-60">
              현재 편집 중: <span className="font-semibold">{getLanguageName(language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Products Section */}
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-panel)] flex items-center gap-2">
              <Icon name="Package" size={20} />
              제품 정보
            </h2>
            <button
              onClick={addProduct}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
            >
              <Icon name="Plus" size={16} />
              제품 추가
            </button>
          </div>
          
          <div className="space-y-4">
            {blogContent.product.map((product, index) => (
              <div key={`product-${product.url || ''}-${index}`} className="p-4 border border-[var(--border-color)] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[var(--text-color)]">제품 {index + 1}</h3>
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Icon name="Trash2" size={16} className="text-red-500" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`product-title-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                      제품명
                    </label>
                    <input
                      id={`product-title-${index}`}
                      type="text"
                      value={product.title}
                      onChange={(e) => updateProduct(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                      placeholder="제품명"
                    />
                  </div>
                  <div>
                    <label htmlFor={`product-url-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                      이미지
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          id={`product-url-${index}`}
                          type="url"
                          value={product.url}
                          onChange={(e) => updateProduct(index, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                          placeholder="이미지 URL"
                        />
                        <label className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1 text-sm">
                          <Icon name="Upload" size={16} />
                          업로드
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, index)}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                      {product.url && (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[var(--border-color)]">
                          <img
                            src={product.url}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor={`product-desc-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                    설명
                  </label>
                  <textarea
                    id={`product-desc-${index}`}
                    value={product.description}
                    onChange={(e) => updateProduct(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] resize-none"
                    rows={2}
                    placeholder="제품 설명"
                  />
                </div>
                
                <div>
                  <label htmlFor={`product-tags-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                    태그 (Enter로 추가)
                  </label>
                  <input
                    id={`product-tags-${index}`}
                    type="text"
                    onKeyDown={(e) => handleProductTagInput(index, e)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                    placeholder="태그 입력 후 Enter"
                  />
                  {product.tag.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.tag.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeProductTag(index, tag)}
                            className="hover:text-blue-900"
                          >
                            <Icon name="X" size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {blogContent.product.length === 0 && (
              <div className="text-center py-8 text-[var(--text-color)] opacity-60">
                제품을 추가해주세요
              </div>
            )}
          </div>
        </div>

        {/* Author Section */}
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-panel)] flex items-center gap-2">
              <Icon name="User" size={20} />
              작성자 정보
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="author-name" className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                작성자 이름 *
              </label>
              <input
                id="author-name"
                type="text"
                value={blogContent.author.name}
                onChange={(e) => {
                  setBlogContent(prev => ({
                    ...prev,
                    author: { ...prev.author, name: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                placeholder="예: 슈리뜨"
              />
            </div>
            
            <div>
              <label htmlFor="author-desc" className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                작성자 설명 *
              </label>
              <textarea
                id="author-desc"
                value={blogContent.author.description}
                onChange={(e) => {
                  setBlogContent(prev => ({
                    ...prev,
                    author: { ...prev.author, description: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] resize-none"
                rows={3}
                placeholder="예: 좋은 품질과 합리적인 가격을 약속드리는 브랜드 슈리뜨 입니다."
              />
            </div>
            
            <div>
              <label htmlFor="author-profile" className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                프로필 이미지 URL
              </label>
              <input
                id="author-profile"
                type="url"
                value={blogContent.author.profileImage}
                onChange={(e) => {
                  setBlogContent(prev => ({
                    ...prev,
                    author: { ...prev.author, profileImage: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                placeholder="https://example.com/profile.jpg"
              />
              {blogContent.author.profileImage && (
                <div className="mt-2 w-20 h-20 rounded-full overflow-hidden border border-[var(--border-color)]">
                  <img
                    src={blogContent.author.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-panel)] flex items-center gap-2">
              <Icon name="FileText" size={20} />
              콘텐츠 섹션
            </h2>
            <button
              onClick={addContentSection}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
            >
              <Icon name="Plus" size={16} />
              섹션 추가
            </button>
          </div>
          
          <div className="space-y-4">
            {blogContent.content.map((section, index) => (
              <div key={`section-${section.title?.substring(0, 20) || ''}-${index}`} className="p-4 border border-[var(--border-color)] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[var(--text-color)]">섹션 {index + 1}</h3>
                  <button
                    onClick={() => removeContentSection(index)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Icon name="Trash2" size={16} className="text-red-500" />
                  </button>
                </div>
                
                <div>
                  <label htmlFor={`section-title-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                    제목
                  </label>
                  <input
                    id={`section-title-${index}`}
                    type="text"
                    value={section.title}
                    onChange={(e) => updateContentSection(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)]"
                    placeholder="섹션 제목"
                  />
                </div>
                
                <div>
                  <label htmlFor={`section-context-${index}`} className="block text-sm text-[var(--text-color)] opacity-80 mb-1">
                    내용
                  </label>
                  <textarea
                    id={`section-context-${index}`}
                    value={section.context}
                    onChange={(e) => updateContentSection(index, 'context', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] resize-none"
                    rows={6}
                    placeholder="섹션 내용 (줄바꿈은 \n으로 입력)"
                  />
                  <p className="text-xs text-[var(--text-color)] opacity-60 mt-1">
                    줄바꿈이 필요한 경우 \n을 입력하세요
                  </p>
                </div>
              </div>
            ))}
            
            {blogContent.content.length === 0 && (
              <div className="text-center py-8 text-[var(--text-color)] opacity-60">
                콘텐츠 섹션을 추가해주세요
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-panel)] flex items-center gap-2">
              <Icon name="Image" size={20} />
              이미지 갤러리
            </h2>
            <label className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1 text-sm">
              <Icon name="Upload" size={16} />
              이미지 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
                multiple
              />
            </label>
          </div>
          
          {loadingImages ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-[var(--border-color)]">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(image.url);
                        alert("이미지 URL이 복사되었습니다.");
                      }}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      title="URL 복사"
                    >
                      <Icon name="Copy" size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors"
                      title="삭제"
                    >
                      <Icon name="Trash2" size={16} className="text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-color)] opacity-60 mt-1 truncate">
                    {image.filename}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-color)] opacity-60">
              {uploadingImage ? "업로드 중..." : "업로드된 이미지가 없습니다"}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-[var(--color-modal)] border border-[var(--border-color)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text-panel)] mb-4 flex items-center gap-2">
            <Icon name="Eye" size={20} />
            JSON 미리보기
          </h2>
          <pre className="p-4 bg-[var(--color-header)] rounded-lg overflow-x-auto text-sm text-[var(--text-color)]">
            {JSON.stringify(blogContent, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}