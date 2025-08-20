import { PostContent } from '@/types/blog/post';
import { logger } from '@/lib/services/logger';
import { ProductItem, AuthorInfo, ContentSection, BlogContent } from '@/types/blog/content';

// Re-export types for backward compatibility
export type { ProductItem, AuthorInfo, ContentSection, BlogContent };

export function parseContent(content?: PostContent | null): BlogContent | null {
  if (!content?.data) return null;
  
  try {
    return content.data as unknown as BlogContent;
  } catch (error) {
    logger.error('Failed to parse blog content', 'BLOG', error);
    return null;
  }
}

export function getMainImage(images: string[] | string | { main?: string; thumbnail?: string } | Record<string, unknown> | null | undefined): string {
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
  
  // Return a data URL fallback image
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%239ca3af'%3EBlog Post%3C/text%3E%3C/svg%3E";
}