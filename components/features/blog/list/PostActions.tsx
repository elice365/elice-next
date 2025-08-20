'use client';

import { memo } from 'react';

import { useBlogActions } from '@/hooks/blog';
import { Icon } from '@/components/ui/Icon';

import type { PostType } from '@/types/blog/post';

interface PostActionsProps {
  post: PostType;
  mobile: boolean;
}

export const PostActions = memo(({ post, mobile }: PostActionsProps) => {
  const { handleLike, handleBookmark, handleShare, isLiked, isBookmarked } = useBlogActions(post);
  
  const buttonSize = mobile ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = mobile ? 'w-3.5 h-3.5' : 'w-4 h-4';
  
  return (
    <div className="flex items-center gap-2 mt-3">
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`${buttonSize} flex items-center justify-center rounded-full transition-colors ${
          isLiked 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-muted hover:bg-muted-foreground/10'
        }`}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
      >
        <Icon 
          name={isLiked ? "heart-filled" : "heart"} 
          className={iconSize} 
        />
      </button>
      
      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`${buttonSize} flex items-center justify-center rounded-full transition-colors ${
          isBookmarked 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-muted hover:bg-muted-foreground/10'
        }`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      >
        <Icon 
          name={isBookmarked ? "bookmark-filled" : "bookmark"} 
          className={iconSize} 
        />
      </button>
      
      {/* Share Button */}
      <button
        onClick={handleShare}
        className={`${buttonSize} flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/10 transition-colors`}
        aria-label="Share post"
      >
        <Icon name="share" className={iconSize} />
      </button>
      
      {/* Comments count (read-only) */}
      <div className="flex items-center gap-1 ml-2 text-muted-foreground text-xs">
        <Icon name="message-circle" className="w-3 h-3" />
        <span>{post.comments || 0}</span>
      </div>
    </div>
  );
});

PostActions.displayName = 'PostActions';