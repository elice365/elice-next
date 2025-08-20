'use client';

import { memo } from 'react';

import { Icon } from '@/components/ui/Icon';

import { getMetaClassNames } from './helpers';

import type { PostType } from '@/types/blog/post';

interface PostMetaProps {
  post: PostType;
  mobile: boolean;
}

export const PostMeta = memo(({ post, mobile }: PostMetaProps) => {
  const metaClassNames = getMetaClassNames(mobile);
  
  return (
    <div className={`flex items-center text-muted-foreground ${metaClassNames}`}>
      {/* Date */}
      <div className="flex items-center gap-1">
        <Icon name="calendar" className="w-3 h-3" />
        <span>{new Date(post.createdTime).toLocaleDateString()}</span>
      </div>
      
      {/* Views */}
      <div className="flex items-center gap-1">
        <Icon name="eye" className="w-3 h-3" />
        <span>{post.views.toLocaleString()}</span>
      </div>
      
      {/* Likes */}
      <div className="flex items-center gap-1">
        <Icon name="heart" className="w-3 h-3" />
        <span>{post.likeCount.toLocaleString()}</span>
      </div>
      
      {/* Comments */}
      <div className="flex items-center gap-1">
        <Icon name="message-circle" className="w-3 h-3" />
        <span>{post.comments || 0}</span>
      </div>
      
      {/* Category */}
      {post.category && (
        <div className="flex items-center gap-1">
          <Icon name="tag" className="w-3 h-3" />
          <span className="bg-muted px-2 py-0.5 rounded text-xs">
            {post.category.name}
          </span>
        </div>
      )}
    </div>
  );
});

PostMeta.displayName = 'PostMeta';