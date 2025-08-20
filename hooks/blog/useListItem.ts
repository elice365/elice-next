import { useState, useCallback } from 'react';
import { PostType } from '@/types/blog/post';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { togglePostLike } from '@/stores/slice/blog';

// Use data URLs for fallback images to avoid external dependencies
const DEFAULT_POST_IMAGES = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post 1%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%236b7280'%3EBlog Post 2%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23d1d5db'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%234b5563'%3EBlog Post 3%3C/text%3E%3C/svg%3E"
];

export const useListItem = (post: PostType, mobile: boolean) => {
  const dispatch = useAppDispatch();
  const isLiking = useAppSelector((state) => state.blog.isLiking);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const getPostImages = useCallback((images: string[] | string | { main?: string; thumbnail?: string } | Record<string, unknown> | null | undefined): string[] => {
    // Handle array input
    if (Array.isArray(images) && images.length > 0) {
      return images.filter(img => typeof img === 'string' && img.trim() !== '');
    }
    
    // Handle object input
    if (images && typeof images === 'object' && !Array.isArray(images)) {
      return extractImageUrls(images);
    }
    
    // Handle string input
    if (typeof images === 'string' && images.trim() !== '') {
      return [images];
    }
    
    return DEFAULT_POST_IMAGES;
  }, []);

  const extractImageUrls = (imageObj: Record<string, unknown>): string[] => {
    const imageUrls: string[] = [];
    const hasMainOrThumbnail = 'main' in imageObj || 'thumbnail' in imageObj;
    
    if (hasMainOrThumbnail) {
      const typedImageObj = imageObj as { main?: string; thumbnail?: string };
      if (typedImageObj.main) imageUrls.push(typedImageObj.main);
      if (typedImageObj.thumbnail && typedImageObj.thumbnail !== typedImageObj.main) {
        imageUrls.push(typedImageObj.thumbnail);
      }
    }
    
    return imageUrls.length > 0 ? imageUrls : DEFAULT_POST_IMAGES;
  };

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLikeAnimating(true);
    try {
      await dispatch(togglePostLike({
        postId: post.uid,
        action: post.isLiked ? 'unlike' : 'like'
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle like:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  }, [dispatch, post.uid, post.isLiked, isLiking]);

  const formatDate = useCallback((date: Date | string) => {
    // Validate the date before formatting
    const dateObject = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObject.getTime())) {
      return ''; // Return empty string for invalid dates
    }
    
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObject);
  }, []);

  return { getPostImages, handleLike, formatDate, isLikeAnimating };
};