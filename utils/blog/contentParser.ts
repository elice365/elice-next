import { PostContent } from '@/types/post';

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
    console.error('Failed to parse blog content:', error);
    return null;
  }
}

export function getMainImage(images: string[] | any): string {
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  if (images && typeof images === 'object') {
    if (images.main) return images.main;
    if (images.thumbnail) return images.thumbnail;
  }
  if (typeof images === 'string') return images;
  
  return "https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Blog+Post";
}