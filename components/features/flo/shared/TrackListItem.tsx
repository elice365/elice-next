// FLO 공통 트랙 리스트 아이템 컴포넌트
'use client';

import React, { memo } from 'react';
import Image from 'next/image';

interface TrackListItemProps {
  track: {
    id: number | string;
    name: string;
    representationArtist: {
      name: string;
    };
    album?: {
      title?: string;
      imgList?: Array<{ url: string; size: number }>;
    };
    playTime?: string;
  };
  index?: number;
  imageUrl?: string;
  onPlay?: () => void;
  onAddToPlaylist?: () => void;
  variant?: 'default' | 'compact' | 'mobile';
  showIndex?: boolean;
  showAlbum?: boolean;
}

const TrackListItem: React.FC<TrackListItemProps> = memo(({
  track,
  index,
  imageUrl,
  onPlay,
  onAddToPlaylist,
  variant = 'default',
  showIndex = false,
  showAlbum = true
}) => {
  const getImageUrl = () => {
    if (imageUrl) return imageUrl;
    if (track.album?.imgList?.length) {
      return track.album.imgList.find(img => img.size >= 200)?.url || 
             track.album.imgList[0]?.url || 
             '/images/default-album.jpg';
    }
    return '/images/default-album.jpg';
  };

  const formatPlayTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  if (variant === 'mobile') {
    return (
      <div className="flex items-center gap-2 p-2 border-b transition-colors last:border-b-0 hover:bg-[var(--hover)]" 
           style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <Image 
            src={getImageUrl()} 
            alt={track.name} 
            width={36} 
            height={36} 
            className="rounded object-cover flex-shrink-0" 
            sizes="36px" 
            quality={85} 
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-xs font-medium text-foreground truncate">
              {track.name}
            </div>
            <div className="text-[10px] text-foreground/70 truncate">
              {track.representationArtist.name}
            </div>
            {showAlbum && track.album?.title && (
              <div className="text-[10px] text-foreground/50 truncate">
                {showIndex && index !== undefined && `#${index + 1} • `}
                {track.album.title}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {track.playTime && (
            <div className="text-[10px] font-mono text-foreground/50">
              {formatPlayTime(track.playTime)}
            </div>
          )}
          <div className="flex items-center gap-0.5">
            {onPlay && (
              <button
                onClick={onPlay}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--blog-accent)] hover:opacity-90 transition-all text-white"
                aria-label={`재생: ${track.name}`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              </button>
            )}
            {onAddToPlaylist && (
              <button 
                onClick={onAddToPlaylist} 
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--hover)] transition-colors text-foreground/60" 
                aria-label="재생목록에 추가"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-[var(--hover)] transition-colors group">
        <Image
          src={getImageUrl()}
          alt={track.name}
          width={40}
          height={40}
          className="rounded-lg object-cover flex-shrink-0 sm:w-12 sm:h-12"
          sizes="(max-width: 640px) 40px, 48px"
        />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="font-medium text-xs sm:text-sm text-foreground truncate">
            {track.name}
          </div>
          <div className="text-[10px] sm:text-xs text-foreground/70 truncate">
            {track.representationArtist.name}
            {showAlbum && track.album?.title && ` • ${track.album.title}`}
          </div>
        </div>
        {track.playTime && (
          <div className="text-[10px] sm:text-xs text-foreground/50 font-mono hidden xs:block">
            {formatPlayTime(track.playTime)}
          </div>
        )}
        {onPlay && (
          <button
            onClick={onPlay}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-[var(--blog-accent)] sm:hover:bg-[var(--blog-accent)] transition-colors text-white sm:bg-transparent sm:text-foreground/60 sm:hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`재생: ${track.name}`}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-[var(--hover)] transition-colors group" 
         style={{ borderColor: 'var(--border-color)' }}>
      {showIndex && index !== undefined && (
        <div className="flex-shrink-0 text-center w-8">
          <span className="text-xs text-foreground/50">
            {index + 1}
          </span>
        </div>
      )}
      <Image 
        src={getImageUrl()} 
        alt={track.name} 
        width={48} 
        height={48} 
        className="rounded-lg object-cover flex-shrink-0" 
        sizes="48px" 
        quality={85} 
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-sm font-medium text-foreground truncate">
          {track.name}
        </div>
        <div className="text-xs text-foreground/70 truncate">
          {track.representationArtist.name}
          {showAlbum && track.album?.title && ` • ${track.album.title}`}
          {track.playTime && ` • ${formatPlayTime(track.playTime)}`}
        </div>
      </div>
      {onPlay && (
        <button
          onClick={onPlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--blog-accent)] hover:opacity-90 transition-all text-white flex-shrink-0"
          aria-label={`${track.name} 재생`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        </button>
      )}
    </div>
  );
});

TrackListItem.displayName = 'TrackListItem';

export default TrackListItem;