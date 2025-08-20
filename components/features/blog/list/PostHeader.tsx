'use client';

import { memo } from 'react';
import Link from 'next/link';

import { getTitleTextSize } from './helpers';

import type { PostType } from '@/types/blog/post';

interface PostHeaderProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
}

export const PostHeader = memo(({ post, mobile, tablet }: PostHeaderProps) => {
  const titleTextSize = getTitleTextSize(mobile, tablet);
  
  return (
    <Link href={`/blog/${post.uid}`}>
      <h2 className={`${titleTextSize} font-bold text-foreground hover:text-accent transition-colors line-clamp-2 leading-tight group-hover:text-accent`}>
        {post.title}
      </h2>
    </Link>
  );
});

PostHeader.displayName = 'PostHeader';