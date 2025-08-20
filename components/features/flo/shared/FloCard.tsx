// FLO 공통 카드 컴포넌트 - 재사용 가능한 카드 UI
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { 
  getCardContainerClass,
  getResponsivePaddingClass,
  getResponsiveTextClass 
} from '@/utils/flo/responsive';

interface FloCardProps {
  image?: string;
  title: string;
  subtitle?: string;
  caption?: string;
  onClick?: () => void;
  className?: string;
  imageAspect?: 'square' | 'video' | 'rect';
  size?: 'sm' | 'md' | 'lg';
}

const FloCard: React.FC<FloCardProps> = memo(({
  image,
  title,
  subtitle,
  caption,
  onClick,
  className = '',
  imageAspect = 'square',
  size = 'md'
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    rect: 'aspect-[4/3]'
  };

  const imageSizes = {
    sm: '(max-width: 640px) 120px, 150px',
    md: '(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px',
    lg: '(max-width: 640px) 200px, (max-width: 1024px) 300px, 400px'
  };

  const BaseCard = (
    <>
      <div className={`${aspectClasses[imageAspect]} relative overflow-hidden rounded-t-md`}>
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes={imageSizes[size]}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-card text-foreground/30">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19V6l12-3v13M9 19c0 1.105-1.895 2-4.236 2S.528 20.105.528 19s1.895-2 4.236-2S9 17.895 9 19zM21 16c0 1.105-1.895 2-4.236 2S12.528 17.105 12.528 16s1.895-2 4.236-2S21 14.895 21 16z" />
            </svg>
          </div>
        )}
      </div>
      <div className={`${getResponsivePaddingClass('sm')} flex flex-col gap-0.5 sm:gap-1 min-w-0`}>
        <h3 className={`${getResponsiveTextClass('title')} text-foreground line-clamp-1 sm:line-clamp-2`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`${getResponsiveTextClass('subtitle')} text-foreground/60 line-clamp-1`}>
            {subtitle}
          </p>
        )}
        {caption && (
          <p className={`${getResponsiveTextClass('caption')} text-foreground/50 line-clamp-1`}>
            {caption}
          </p>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${getCardContainerClass()} text-left ${className}`}
        aria-label={`열기: ${title}`}
      >
        {BaseCard}
      </button>
    );
  }

  return (
    <div className={`${getCardContainerClass()} ${className}`}>
      {BaseCard}
    </div>
  );
});

FloCard.displayName = 'FloCard';

export default FloCard;