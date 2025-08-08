'use client';

import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';

interface ListItemMetaProps {
  views: number;
  likeCount: number;
  isLiked: boolean;
  createdTime: Date;
  mobile: boolean;
  handleLike: (e: React.MouseEvent | React.KeyboardEvent) => void;
  isLikeAnimating: boolean;
  formatDate: (date: Date) => string;
  getMetaClassNames: (mobile: boolean) => string;
}

export function ListItemMeta({
  views,
  likeCount,
  isLiked,
  createdTime,
  mobile,
  handleLike,
  isLikeAnimating,
  formatDate,
  getMetaClassNames
}: ListItemMetaProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLike(e);
    }
  };
  return (
    <div className={`flex items-center ${getMetaClassNames(mobile)} text-[var(--text-color)] opacity-60`}>
      <time dateTime={createdTime.toString()} className="flex items-center gap-1">
        <Icon name="Calendar" size={mobile ? 12 : 14} />
        <span>{formatDate(createdTime)}</span>
      </time>
      
      <div className="flex items-center gap-1">
        <Icon name="Eye" size={mobile ? 12 : 14} />
        <span>{views.toLocaleString()}</span>
      </div>
      
      <motion.button
        onClick={handleLike}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded ${isLiked ? 'text-red-500' : ''}`}
        whileTap={!mobile ? { scale: 0.9 } : {}}
        animate={isLikeAnimating ? { scale: [1, 1.2, 1] } : {}}
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this post (${likeCount} likes)`}
        type="button"
      >
        <Icon 
          name="Heart" 
          size={mobile ? 12 : 14}
          className={isLiked ? "fill-current" : ""}
        />
        <span>{likeCount.toLocaleString()}</span>
      </motion.button>
    </div>
  );
}