'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Post } from '@/types/post';
import { Actions } from './Actions';

interface BlogPostMobileActionsProps {
  post: Post;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export const MobileActions = memo(function MobileActions({
  post,
  isLiked,
  isBookmarked,
  likeCount,
  onLike,
  onBookmark,
  onShare
}: BlogPostMobileActionsProps) {
  return (
    <motion.section 
      className="mt-6 border-y border-[var(--border-color)] py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Actions
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        likeCount={likeCount}
        onLike={onLike}
        onBookmark={onBookmark}
        onShare={onShare}
        variant="mobile"
      />
    </motion.section>
  );
});

MobileActions.displayName = 'MobileActions';