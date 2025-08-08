import { PostContent } from '@/types/post';
import { logger } from '@/lib/services/logger';

export interface ProductItem {
  url: string;
  tag: string[];
  title: string;
  description: string;
}

export interface AuthorInfo {
  name: string;
  description: string;
  profileImage: string;
}

export interface ContentSection {
  title: string;
  context: string;
}

export interface BlogContent {
  product: ProductItem[];
  author: AuthorInfo;
  content: ContentSection[];
}

export function parseContent(content?: PostContent | null): BlogContent | null {
  if (!content?.data) return null;
  
  try {
    return content.data as unknown as BlogContent;
  } catch (error) {
    logger.error('Failed to parse blog content', 'BLOG', error);
    return null;
  }
}

export function getMainImage(images: string[] | string | { main?: string; thumbnail?: string } | unknown): string {
  if (typeof images === 'string') {
    return images;
  }
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  if (images && typeof images === 'object' && !Array.isArray(images)) {
    const imageObj = images as { main?: string; thumbnail?: string };
    if (imageObj.main) return imageObj.main;
    if (imageObj.thumbnail) return imageObj.thumbnail;
  }
  
  return "https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Blog+Post";
}