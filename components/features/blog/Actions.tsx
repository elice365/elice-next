'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BlogPostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  variant?: 'desktop' | 'mobile';
}

export const Actions = memo(function Actions({
  isLiked,
  isBookmarked,
  likeCount,
  onLike,
  onBookmark,
  onShare,
  variant = 'desktop'
}: BlogPostActionsProps) {
  
  const handleLikeWithConfetti = () => {
    onLike();
    
    // Trigger confetti animation if liking
    if (!isLiked) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF6B6B', '#FF8787', '#FFA0A0'],
        disableForReducedMotion: true
      });
    }
  };

  const buttonClass = variant === 'desktop' 
    ? "w-12 h-12 flex items-center justify-center p-3 rounded-lg transition-all duration-300"
    : "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300";

  return (
    <div className={`flex ${variant === 'desktop' ? 'flex-col gap-3' : 'items-center justify-around'}`}>
      {/* Like Button */}
      <motion.button
        onClick={handleLikeWithConfetti}
        className={`${buttonClass} ${
          isLiked 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
            : 'bg-[var(--hover)] hover:bg-[var(--card-hover)] text-[var(--text-color)]'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLiked ? 'liked' : 'not-liked'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Heart 
              size={20} 
              fill={isLiked ? 'currentColor' : 'none'}
              className={isLiked ? 'animate-pulse' : ''}
            />
            {variant === 'mobile' && (
              <span className="font-medium">{likeCount.toLocaleString()}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Bookmark Button */}
      <motion.button
        onClick={onBookmark}
        className={`${buttonClass} ${
          isBookmarked 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
            : 'bg-[var(--hover)] hover:bg-[var(--card-hover)] text-[var(--text-color)]'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isBookmarked ? 'bookmarked' : 'not-bookmarked'}
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <Bookmark 
              size={20} 
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
            {variant === 'mobile' && <span>북마크</span>}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Share Button */}
      <motion.button
        onClick={onShare}
        className={`${buttonClass} bg-[var(--hover)] hover:bg-[var(--card-hover)] text-[var(--text-color)]`}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Share2 size={20} />
        {variant === 'mobile' && <span>공유</span>}
      </motion.button>
    </div>
  );
});

Actions.displayName = 'Actions';