import { BlogContent, BlogImage } from '@/types/adminBlog';
import { api } from '@/lib/fetch';
import { APIResult } from '@/types/api';
import { logger } from '@/lib/services/logger';

export const DEFAULT_BLOG_CONTENT: BlogContent = {
  product: [],
  author: {
    name: '',
    description: '',
    profileImage: ''
  },
  content: []
};

export function getLanguageName(language: string): string {
  switch (language) {
    case 'ko': return '한국어';
    case 'en': return 'English';
    case 'ja': return '日本語';
    case 'ru': return 'Русский';
    default: return language;
  }
}

export async function loadBlogImages(postId: string): Promise<BlogImage[]> {
  try {
    const { data } = await api.get<APIResult>(`/api/admin/blog/${postId}/images`);
    if (data.success && data.data) {
      return data.data;
    }
  } catch (error) {
    logger.error('Failed to load images', 'Admin', error);
  }
  return [];
}

export async function uploadBlogImage(
  postId: string, 
  file: File
): Promise<{ url: string } | null> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const { data } = await api.post<APIResult>(
      `/api/admin/blog/${postId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (data.success && data.data) {
      return data.data;
    }
  } catch (error) {
    logger.error('Failed to upload image', 'Admin', error);
  }
  return null;
}

export async function saveBlogContent(
  postId: string,
  language: string,
  content: BlogContent
): Promise<boolean> {
  try {
    const { data } = await api.put<APIResult>(
      `/api/admin/blog/${postId}/content`,
      { language, content }
    );
    return data.success || false;
  } catch (error) {
    logger.error('Failed to save content', 'Admin', error);
    return false;
  }
}

export async function checkContentExists(
  postId: string,
  language: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://cdn.elice.pro/post/${postId}/${language}.json`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
}