'use client';

import { memo } from 'react';

import { PostImageArea } from './PostImageArea';
import { PostHeader } from './PostHeader';
import { PostMeta } from './PostMeta';
import { PostActions } from './PostActions';
import { getGridClasses, getContentClasses } from './helpers';

import type { PostType } from '@/types/blog/post';

interface BlogListItemProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
}

export const BlogListItem = memo(({ post, mobile, tablet }: BlogListItemProps) => {
  const gridClasses = getGridClasses(mobile, tablet);
  const contentClasses = getContentClasses(mobile);
  
  return (
    <article className={gridClasses}>
      <PostImageArea post={post} mobile={mobile} tablet={tablet} />
      
      <div className={contentClasses}>
        <PostHeader post={post} mobile={mobile} tablet={tablet} />
        <PostMeta post={post} mobile={mobile} />
        <PostActions post={post} mobile={mobile} />
      </div>
    </article>
  );
});

BlogListItem.displayName = 'BlogListItem';