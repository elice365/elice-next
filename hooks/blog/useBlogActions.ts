import { useState, useCallback } from 'react';
import { Post } from '@/types/post';

export const useBlogActions = (post: Post) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // TODO: API call to update like status
    // await updateLikeStatus(post.uid, !isLiked);
  }, [isLiked, post.uid]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked(prev => !prev);
    
    // TODO: API call to update bookmark status
    // await updateBookmarkStatus(post.uid, !isBookmarked);
  }, [isBookmarked, post.uid]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback to custom share menu
        setIsShareOpen(true);
      });
    } else {
      setIsShareOpen(true);
    }
  }, [post.title, post.description]);

  const closeShareMenu = useCallback(() => {
    setIsShareOpen(false);
  }, []);

  return {
    isLiked,
    isBookmarked,
    likeCount,
    isShareOpen,
    handleLike,
    handleBookmark,
    handleShare,
    closeShareMenu
  };
};