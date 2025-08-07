'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PostType } from '@/types/post';
import { useCardState } from './useCardState';
import { CardImage } from './CardImage';
import { CardContent } from './CardContent';
import { CardActions } from './CardActions';
import { CardEffects } from './CardEffects';

interface BlogCardProps {
  post: PostType;
  className?: string;
}

export const Card = memo(function Card({ post, className = '' }: BlogCardProps) {
  const {
    mobile,
    tablet,
    isBookmarked,
    isLikeAnimating,
    imageError,
    handleBookmarkToggle,
    handleLike,
    handleImageError,
    formatDate
  } = useCardState(post);

  const cardClassName = getCardClassName(mobile, tablet, className);
  const motionProps = getMotionProps(mobile);

  return (
    <motion.div
      className={cardClassName}
      {...motionProps}
    >
      <CardEffects mobile={mobile} />
      
      <Link href={`/blog/${post.uid}`}>
        <CardImage
          post={post}
          mobile={mobile}
          tablet={tablet}
          imageError={imageError}
          onImageError={handleImageError}
        />
        
        <CardContent
          post={post}
          mobile={mobile}
          tablet={tablet}
          formatDate={formatDate}
        />
        
        {mobile && (
          <div className="px-4 pb-4">
            <CardActions
              post={post}
              mobile={mobile}
              isLikeAnimating={isLikeAnimating}
              isBookmarked={isBookmarked}
              onLike={handleLike}
              onBookmark={handleBookmarkToggle}
            />
          </div>
        )}
      </Link>
      
      {!mobile && (
        <CardActions
          post={post}
          mobile={mobile}
          isLikeAnimating={isLikeAnimating}
          isBookmarked={isBookmarked}
          onLike={handleLike}
          onBookmark={handleBookmarkToggle}
        />
      )}
    </motion.div>
  );
});

function getCardClassName(mobile: boolean, tablet: boolean, className: string): string {
  const baseClasses = [
    'flex-none',
    'relative',
    'overflow-hidden',
    'transition-all',
    'duration-700',
    'ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group',
    'bg-[var(--color-card)]',
    'border',
    'border-[var(--border-color)]'
  ];

  const sizeClasses = getSizeClasses(mobile, tablet);
  const roundingClasses = mobile ? 'rounded-xl' : 'rounded-2xl';
  const shadowClasses = mobile ? 'shadow-sm' : 'shadow-md';
  const hoverClasses = getHoverClasses(mobile);

  return [...baseClasses, sizeClasses, roundingClasses, shadowClasses, ...hoverClasses, className]
    .filter(Boolean)
    .join(' ');
}

function getSizeClasses(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'w-full max-w-full';
  if (tablet) return 'w-full max-w-lx';
  return 'w-full max-w-xs';
}

function getHoverClasses(mobile: boolean): string[] {
  if (mobile) return [];
  
  return [
    'hover:shadow-2xl',
    'hover:border-[var(--blog-accent)]/40'
  ];
}

function getMotionProps(mobile: boolean) {
  return {
    whileHover: !mobile ? { y: -8, scale: 1.03 } : {},
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
}

Card.displayName = 'Card';