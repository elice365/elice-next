'use client';

import { memo } from 'react';
import Image from 'next/image';

import { getImageContainerClasses } from './helpers';

import type { PostType } from '@/types/blog/post';

function getSizeString(mobile: boolean, tablet: boolean): string {
  if (mobile) return "100vw";
  if (tablet) return "112px";
  return "128px";
}

interface PostImageAreaProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
}

export const PostImageArea = memo(({ post, mobile, tablet }: PostImageAreaProps) => {
  const imageContainerClasses = getImageContainerClasses(mobile, tablet);
  const images = post.images?.length ? post.images : [];

  return (
    <div className={imageContainerClasses}>
      <div className="relative w-full h-full">
        {images.length > 0 ? (
          <Image
            src={images[0]}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={getSizeString(mobile, tablet)}
            priority={true}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});

PostImageArea.displayName = 'PostImageArea';