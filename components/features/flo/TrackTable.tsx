// 반응형 트랙 테이블 컴포넌트 (모바일/데스크톱 대응)
'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { TrackTableProps } from '@/types/flo';
import { Pagination } from '@/components/ui/Pagination';
import { useAppDispatch } from '@/stores';
import { setCurrentTrack, setPlaylist } from '@/stores/slice/music';
import { logger } from '@/utils/logger';
import {
  formatPlayTime,
  getTrackImageUrl,
  convertToTrackInfo,
  convertTracksToPlaylist,
  isVcoloringTrack,
  openVcoloringPlayer,
  calculatePagination
} from '@/utils/flo/track';

const ResponsiveTrackTable: React.FC<TrackTableProps> = ({
  album,
  tracks,
  onAddToPlaylist,
  onAddToMyList,
}) => {
  const dispatch = useAppDispatch();
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 페이지네이션 계산 (유틸리티 함수 사용)
  const paginationData = useMemo(() =>
    calculatePagination(tracks, currentPage, itemsPerPage),
    [tracks, currentPage, itemsPerPage]
  );

  const { totalPages, startIndex, currentItems: currentTracks, hasNext, hasPrev } = paginationData;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 트랙 이미지 URL 가져오기 (유틸리티 함수 사용)
  const getImageUrl = useCallback((track: any) =>
    getTrackImageUrl(track, album.imgList, 350),
    [album.imgList]
  );

  // 트랙을 글로벌 플레이어로 전송하는 함수 (메모이제이션)
  const handleTrackPlay = useCallback((track: any, trackIndex: number) => {
    logger.music.info('Track play button clicked', {
      trackId: track.id,
      trackName: track.name,
      trackIndex,
      artist: track.representationArtist?.name,
      trackType: track._originalType,
      isVcoloring: isVcoloringTrack(track)
    });

    // V컬러링 비디오인 경우 특별 처리
    if (isVcoloringTrack(track)) {
      openVcoloringPlayer(track, getImageUrl(track));
      return;
    }

    try {
      // 일반 오디오 트랙 처리
      // 모든 트랙을 TrackInfo 형태로 변환
      const trackInfoList = convertTracksToPlaylist(tracks, album.title, album.imgList);

      // 현재 트랙 설정
      const currentTrack = convertToTrackInfo(track, album.title, album.imgList);

      logger.music.debug('Dispatching Redux actions', {
        playlistCount: trackInfoList.length,
        currentTrackId: currentTrack.id,
        startIndex: trackIndex
      });

      // 플레이리스트와 현재 트랙 설정
      dispatch(setPlaylist({ tracks: trackInfoList, startIndex: trackIndex }));
      dispatch(setCurrentTrack(currentTrack));

      logger.music.info('Redux actions dispatched successfully');

      // 모바일 브라우저 자동재생 차단 회피: 사용자 제스처 컨텍스트에서 즉시 재생 트리거
      try {
        window.dispatchEvent(new CustomEvent('flo:play', { detail: { trackId: currentTrack.id } }));
      } catch (e) {
        // 안전하게 무시 (SSR/비표준 환경 대비)
      }
    } catch (error) {
      logger.music.error('Failed to handle track play', { error, trackId: track.id });
    }
  }, [tracks, album.title, album.imgList, getImageUrl, dispatch]);



  if (isMobile) {
    return (
      <div className="w-full bg-card rounded-lg shadow-sm">
        <div className="w-full">
          {currentTracks.map((track, index) => (
            <div key={track.id} className="flex items-center gap-2 p-3 border-b transition-colors last:border-b-0 hover:bg-[var(--hover)]" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
                <Image 
                  src={getImageUrl(track)} 
                  alt={track.name} 
                  width={40} 
                  height={40} 
                  className="rounded-lg object-cover flex-shrink-0" 
                  sizes="40px" 
                  quality={85} 
                  priority={index < 3} 
                />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-medium text-foreground truncate">
                    {track.name}
                  </div>
                  <div className="text-[10px] text-foreground/70 truncate">
                    {track.representationArtist.name}
                  </div>
                  <div className="text-[10px] text-foreground/50 truncate">
                    #{startIndex + index + 1} • {album.title}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-[10px] font-mono text-foreground/50">
                  {formatPlayTime(track.playTime)}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleTrackPlay(track, startIndex + index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTrackPlay(track, startIndex + index);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--blog-accent)] hover:opacity-90 transition-all text-white"
                    title={`재생: ${track.name}`}
                    aria-label={`${track.name} 재생`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="8,5 19,12 8,19" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onAddToPlaylist?.(track)} 
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--hover)] transition-colors text-foreground/60" 
                    title="재생목록에 추가"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="w-full p-3 border-t bg-card/50" style={{ borderColor: 'var(--border-color)' }}>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={tracks.length} hasNext={hasNext} hasPrev={hasPrev} onPageChange={setCurrentPage} size="sm" showInfo={false} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-lg shadow-sm">
      <div className="p-3 sm:p-4 border-b overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 truncate">
          {album.title}
        </h2>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/70">
          <span>{tracks.length}곡</span>
          <span>•</span>
          <span className="truncate">{album.artistList?.[0]?.name || album.representationArtist?.name}</span>
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 lg:px-6 py-3 text-xs lg:text-sm font-bold tracking-wide border-b bg-card/50 text-foreground/60 uppercase overflow-x-auto min-w-[600px]" style={{ borderColor: 'var(--border-color)' }}>
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5">제목</div>
        <div className="col-span-3">아티스트</div>
        <div className="col-span-1 text-center">시간</div>
        <div className="col-span-2 text-center">작업</div>
      </div>

      {/* Mobile/Tablet list view */}
      <div className="md:hidden">
        {currentTracks.map((track, index) => (
          <div key={`mobile-track-${track.id}-${startIndex + index}`} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border-b last:border-b-0 hover:bg-[var(--hover)] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex-shrink-0 text-center w-6 sm:w-8">
              <span className="text-[10px] sm:text-xs text-foreground/50">
                {startIndex + index + 1}
              </span>
            </div>
            <Image 
              src={getImageUrl(track)} 
              alt={track.name} 
              width={36} 
              height={36} 
              className="rounded-lg object-cover flex-shrink-0 sm:w-10 sm:h-10" 
              sizes="(max-width: 640px) 36px, 40px" 
              quality={85} 
              priority={index < 5} 
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                {track.name}
              </div>
              <div className="text-[10px] sm:text-xs text-foreground/70 truncate">
                {track.representationArtist.name} • {formatPlayTime(track.playTime)}
              </div>
            </div>
            <button
              onClick={() => handleTrackPlay(track, startIndex + index)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[var(--blog-accent)] hover:opacity-90 transition-all text-white flex-shrink-0"
              aria-label={`${track.name} 재생`}
            >
              <svg className="w-4 h-4 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-card overflow-x-auto">
        {currentTracks.map((track, index) => (
          <div key={`desktop-track-${track.id}-${startIndex + index}`} className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-4 group cursor-pointer transition-colors hover:bg-[var(--hover)] border-b last:border-b-0 min-w-[600px]" style={{ borderColor: 'var(--border-color)' }}>
            <div className="col-span-1 flex items-center justify-center relative">
              <span className="text-sm text-foreground/50 group-hover:opacity-0 transition-opacity">{startIndex + index + 1}</span>
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleTrackPlay(track, startIndex + index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTrackPlay(track, startIndex + index);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--hover)] transition-colors text-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={`재생: ${track.name}`}
                  aria-label={`${track.name} 재생`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="col-span-5 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={getImageUrl(track)} alt={track.name} fill className="object-cover" sizes="48px" quality={85} priority={index < 5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-foreground truncate">{track.name}</div>
                <div className="text-xs text-foreground/70 truncate">{album.title}</div>
              </div>
            </div>

            <div className="col-span-3 flex items-center">
              <span className="text-sm text-foreground/80 truncate">{track.representationArtist.name}</span>
            </div>

            <div className="col-span-1 flex items-center justify-center">
              <span className="text-sm font-mono text-foreground/50">{formatPlayTime(track.playTime)}</span>
            </div>

            <div className="col-span-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onAddToPlaylist?.(track)} className="flo-button-icon" title="재생목록에 추가">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </button>
              <button onClick={() => onAddToMyList?.(track)} className="flo-button-icon" title="내 리스트에 추가">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button className="flo-button-icon" title="더보기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t bg-card/50" style={{ borderColor: 'var(--border-color)' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={tracks.length} hasNext={currentPage < totalPages} hasPrev={currentPage > 1} onPageChange={setCurrentPage} size="md" showInfo={false} />
        </div>
      )}
    </div>
  );
};

export default memo(ResponsiveTrackTable);
