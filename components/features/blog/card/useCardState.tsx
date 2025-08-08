import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { togglePostLike } from '@/stores/slice/blog';
import { PostType } from '@/types/post';

export const useCardState = (post: PostType) => {
  const dispatch = useAppDispatch();
  const isLiking = useAppSelector((state) => state.blog.isLiking);
  const { mobile, tablet } = useAppSelector((state) => state.device);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked((prev) => !prev);
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
      console.error('Failed to toggle like:', error);
      // Optionally show error message to user
    } finally {
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  }, [dispatch, post.uid, post.isLiked, isLiking]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }, []);

  return {
    mobile,
    tablet,
    isBookmarked,
    isLikeAnimating,
    imageError,
    handleBookmarkToggle,
    handleLike,
    handleImageError,
    formatDate
  };
};