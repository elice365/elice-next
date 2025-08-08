import { useState, useCallback } from 'react';
import { PostType } from '@/types/post';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { togglePostLike } from '@/stores/slice/blog';

const DEFAULT_POST_IMAGES = [
  "https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Blog+Post+1",
  "https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Blog+Post+2",
  "https://via.placeholder.com/400x300/d1d5db/4b5563?text=Blog+Post+3"
];

export const useListItem = (post: PostType, mobile: boolean) => {
  const dispatch = useAppDispatch();
  const isLiking = useAppSelector((state) => state.blog.isLiking);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const getPostImages = useCallback((images: string[] | any): string[] => {
    if (Array.isArray(images) && images.length > 0) {
      return images.filter(img => typeof img === 'string' && img.trim() !== '');
    }
    if (images && typeof images === 'object') {
      const imageUrls: string[] = [];
      if (images.main) imageUrls.push(images.main);
      if (images.thumbnail && images.thumbnail !== images.main) imageUrls.push(images.thumbnail);
      if (imageUrls.length > 0) return imageUrls;
    }
    if (typeof images === 'string' && images.trim() !== '') {
      return [images];
    }
    return DEFAULT_POST_IMAGES;
  }, []);

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
      // Failed to toggle like
    } finally {
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  }, [dispatch, post.uid, post.isLiked, isLiking]);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }, []);

  return { getPostImages, handleLike, formatDate, isLikeAnimating };
};