// 재사용 가능한 FLO 앨범 카드 컴포넌트
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { FloCardProps } from '@/types/flo';
import { floApiService } from '@/lib/services/flo/api';
import PlayButton from '@/components/ui/PlayButton';
import { 
  getCardContainerClass, 
  getResponsiveTextClass, 
  getResponsivePaddingClass,
  getResponsiveImageSize 
} from '@/utils/flo/responsive';

export const FloCard = memo<FloCardProps>(({
  album,
  index,
  onClick,
  className = ''
}) => {
  const imageUrl = floApiService.getImage(album.imgList, 350);
  const artistNames = album.artistList.map(artist => artist.name).join(', ');
  const releaseDate = floApiService.formatDate(album.releaseYmd);

  const handleClick = () => {
    onClick?.(album);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div
        className={`${getCardContainerClass()} group cursor-pointer hover:transform hover:-translate-y-0.5 flex flex-col w-full relative ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${album.title} by ${artistNames} 앨범 상세보기`}
        data-album-id={album.id}
      >
        {/* 순위 뱃지 */}
        <div
          className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-background/90 rounded text-[10px] sm:text-xs font-bold shadow-sm backdrop-blur-sm"
          style={{ color: 'var(--blog-accent)' }}
          aria-label={`순위 ${index + 1}위`}
        >
          {index + 1}
        </div>

        {/* 앨범 커버 이미지 */}
        <div className="relative aspect-square overflow-hidden bg-card rounded-t-lg">
          <Image
            src={imageUrl}
            alt={`${album.title} 앨범 커버`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={getResponsiveImageSize('card')}
            priority={index < 6}
            quality={85}
          />

          {/* 호버 시 재생 버튼 */}
          <div
            className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation(); // 앨범 클릭 이벤트와 분리
            }}
          >
            <div className="transform scale-80 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <PlayButton
                trackId={album.id.toString()} // 앨범 ID를 사용 (첫 번째 곡 재생을 위한 트리거)
                trackTitle={album.title}
                artist={artistNames}
                size="lg"
                variant="primary"
                className="w-14 h-14 bg-background shadow-lg"
                onPlay={() => {
                  console.log('🎵 Playing album:', album.title);
                }}
                onError={(error) => {
                  console.warn('❌ Album play failed, opening album instead:', error);
                  // 재생 실패 시 앨범 상세 페이지로 이동
                  handleClick();
                }}
              />
            </div>
          </div>
        </div>

        {/* 앨범 정보 */}
        <div className={`${getResponsivePaddingClass('sm')} flex flex-col gap-1 sm:gap-1.5 flex-1 overflow-hidden`}>
          <h3 className={`${getResponsiveTextClass('title')} text-foreground line-clamp-1 sm:line-clamp-2 leading-tight break-words mb-0.5`}>
            {album.title}
          </h3>
          <p className={`${getResponsiveTextClass('subtitle')} text-foreground/70 font-medium line-clamp-1 leading-tight break-words`}>
            {artistNames}
          </p>

          {/* 태그들 - 모바일에서는 최소화 */}
          <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-auto">
            {album.genreStyle && (
              <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 ${getResponsiveTextClass('caption')} font-medium rounded border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800`}>
                {album.genreStyle}
              </span>
            )}
            {album.albumTypeStr && (
              <span className={`hidden sm:inline-flex px-1 py-0.5 ${getResponsiveTextClass('caption')} font-medium rounded border whitespace-nowrap bg-card text-foreground/60 border-border`}>
                {album.albumTypeStr}
              </span>
            )}
            {releaseDate && (
              <span className={`hidden md:inline-flex px-1 py-0.5 ${getResponsiveTextClass('caption')} font-medium rounded border whitespace-nowrap bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800`}>
                {releaseDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FloCard.displayName = 'FloCard';
