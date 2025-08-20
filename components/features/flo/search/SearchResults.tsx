// FLO 검색 결과 컴포넌트 - 곡, 앨범, 아티스트, 플레이리스트, 영상, 가사 렌더링
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { 
  FloSearchSection, 
  FloSearchedTrack, 
  FloSearchedAlbum, 
  FloSearchedArtist, 
  FloSearchedPlaylist, 
  FloSearchedVideo, 
  FloSearchedLyrics 
} from '@/types/flo/flo';
import { logger } from '@/utils/logger';
import { 
  getResponsiveGridClass, 
  getResponsiveTextClass, 
  getCardContainerClass,
  getResponsivePaddingClass
} from '@/utils/flo/responsive';

interface SearchResultsProps {
  sections: FloSearchSection[];
  keyword: string;
  onTrackPlay?: (track: FloSearchedTrack) => void;
  onAlbumClick?: (album: FloSearchedAlbum) => void;
  onArtistClick?: (artist: FloSearchedArtist) => void;
  onPlaylistClick?: (playlist: FloSearchedPlaylist) => void;
  onVideoPlay?: (video: FloSearchedVideo) => void;
  onLyricsClick?: (lyrics: FloSearchedLyrics) => void;
  onMoreClick?: (sectionType: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  sections,
  keyword,
  onTrackPlay,
  onAlbumClick,
  onArtistClick,
  onPlaylistClick,
  onVideoPlay,
  onLyricsClick,
  onMoreClick
}) => {
  // Debug: Log the sections data
  logger.flo.debug('SearchResults sections data', {
    sectionsCount: sections?.length,
    sections: sections?.map(s => ({
      type: s.type,
      title: s.title,
      totalCount: s.totalCount,
      hasMore: s.hasMore,
      listLength: s.list?.length || 0,
      listIsArray: Array.isArray(s.list)
    }))
  });
  
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/60">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          '{keyword}' 검색 결과가 없습니다
        </h3>
        <p className="text-foreground/70">
          다른 검색어를 시도해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {sections.map((section, index) => (
        <div key={`${section.type}-${index}`} className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-xl font-bold text-foreground flex items-center flex-wrap gap-1">
              <span>{section.title}</span>
              <span className="text-xs sm:text-sm font-normal text-foreground/60">
                ({section.totalCount.toLocaleString()})
              </span>
            </h2>
            {section.hasMore && (
              <button
                onClick={() => onMoreClick?.(section.type)}
                className="text-xs sm:text-sm font-medium hover:underline flex-shrink-0"
                style={{ color: 'var(--blog-accent)' }}
              >
                더보기 &gt;
              </button>
            )}
          </div>
          
          {section.type === 'TRACK' && section.list && (
            <TrackSection 
              tracks={section.list as FloSearchedTrack[]} 
              onTrackPlay={onTrackPlay}
            />
          )}
          
          {section.type === 'ALBUM' && section.list && (
            <AlbumSection 
              albums={section.list as FloSearchedAlbum[]} 
              onAlbumClick={onAlbumClick}
            />
          )}
          
          {section.type === 'ARTIST' && section.list && (
            <ArtistSection 
              artists={section.list as FloSearchedArtist[]} 
              onArtistClick={onArtistClick}
            />
          )}
          
          {section.type === 'PLAYLIST' && section.list && (
            <PlaylistSection 
              playlists={section.list as FloSearchedPlaylist[]} 
              onPlaylistClick={onPlaylistClick}
            />
          )}
          
          {(section.type === 'VIDEO' || section.type === 'MV') && section.list && (
            <VideoSection 
              videos={section.list as FloSearchedVideo[]} 
              onVideoPlay={onVideoPlay}
            />
          )}
          
          {section.type === 'LYRICS' && section.list && (
            <LyricsSection 
              lyrics={section.list as FloSearchedLyrics[]} 
              keyword={keyword}
              onLyricsClick={onLyricsClick}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// 트랙 섹션 컴포넌트
const TrackSection: React.FC<{
  tracks: FloSearchedTrack[];
  onTrackPlay?: (track: FloSearchedTrack) => void;
}> = memo(({ tracks, onTrackPlay }) => {
  if (!tracks || tracks.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-1 sm:space-y-2">
      {tracks.slice(0, 5).map((track) => (
      <div 
        key={track.id} 
        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-[var(--hover)] transition-colors group"
      >
        <Image
          src={track.album.imgList.find(img => img.size >= 200)?.url || track.album.imgList[0]?.url || '/images/default-album.jpg'}
          alt={track.name}
          width={40}
          height={40}
          className="rounded-lg object-cover flex-shrink-0 sm:w-12 sm:h-12"
          sizes="(max-width: 640px) 40px, 48px"
        />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="font-medium text-xs sm:text-sm text-foreground truncate">{track.name}</div>
          <div className="text-[10px] sm:text-xs text-foreground/70 truncate">
            {track.representationArtist.name} • {track.album.title}
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-foreground/50 font-mono hidden xs:block">{track.playTime}</div>
        <button
          onClick={() => onTrackPlay?.(track)}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-[var(--blog-accent)] sm:hover:bg-[var(--blog-accent)] transition-colors text-white sm:bg-transparent sm:text-foreground/60 sm:hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
          title={`재생: ${track.name}`}
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        </button>
      </div>
    ))}
    </div>
  );
});

// 앨범 섹션 컴포넌트
const AlbumSection: React.FC<{
  albums: FloSearchedAlbum[];
  onAlbumClick?: (album: FloSearchedAlbum) => void;
}> = memo(({ albums, onAlbumClick }) => {
  // albums가 undefined이거나 배열이 아닌 경우 빈 배열로 처리
  const safeAlbums = Array.isArray(albums) ? albums : [];
  
  return (
    <div className={getResponsiveGridClass('album')}>
      {safeAlbums.slice(0, 10).map((album) => (
        <button
          key={album.id}
          onClick={() => onAlbumClick?.(album)}
          className={getCardContainerClass()}
        >
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={album.imgList.find(img => img.size >= 500)?.url || album.imgList.find(img => img.size >= 350)?.url || album.imgList[0]?.url || '/images/default-album.jpg'}
              alt={album.title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
            />
          </div>
          <div className={`${getResponsivePaddingClass('sm')} flex flex-col gap-1`}>
            <h3 className={`${getResponsiveTextClass('title')} text-foreground line-clamp-1 sm:line-clamp-2 mb-0.5`}>
              {album.title}
            </h3>
            <p className={`${getResponsiveTextClass('subtitle')} text-foreground/70 line-clamp-1`}>
              {album.representationArtist.name}
            </p>
            <p className={`${getResponsiveTextClass('caption')} text-foreground/50 line-clamp-1 mt-0.5`}>
              {album.trackCount ? `${album.trackCount}곡 • ` : ''}{album.releaseYmd.substring(0, 4)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
});

// 아티스트 섹션 컴포넌트  
const ArtistSection: React.FC<{
  artists: FloSearchedArtist[];
  onArtistClick?: (artist: FloSearchedArtist) => void;
}> = memo(({ artists, onArtistClick }) => {
  const safeArtists = Array.isArray(artists) ? artists : [];
  
  return (
    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
      {safeArtists.slice(0, 12).map((artist) => (
        <button
          key={artist.id}
          onClick={() => onArtistClick?.(artist)}
          className="text-center bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full overflow-hidden">
            <Image
              src={artist.imgList.find(img => img.size >= 350)?.url || artist.imgList.find(img => img.size >= 200)?.url || artist.imgList[0]?.url || '/images/default-artist.jpg'}
              alt={artist.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
              sizes="(max-width: 640px) 48px, 64px"
            />
          </div>
          <h3 className="text-[10px] sm:text-xs font-semibold text-foreground line-clamp-2 mb-0.5">
            {artist.name}
          </h3>
          <p className="text-[9px] sm:text-[10px] text-foreground/70">
            {artist.albumCount}앨범 • {artist.trackCount}곡
          </p>
        </button>
      ))}
    </div>
  );
});

// 플레이리스트 섹션 컴포넌트
const PlaylistSection: React.FC<{
  playlists: FloSearchedPlaylist[];
  onPlaylistClick?: (playlist: FloSearchedPlaylist) => void;
}> = memo(({ playlists, onPlaylistClick }) => {
  const safePlaylists = Array.isArray(playlists) ? playlists : [];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
      {safePlaylists.slice(0, 6).map((playlist) => (
        <button
          key={playlist.id}
          onClick={() => onPlaylistClick?.(playlist)}
          className="text-left bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-2 sm:p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex gap-2 sm:gap-3">
            <Image
              src={playlist.imgList.find(img => img.size >= 200)?.url || playlist.imgList[0]?.url || '/images/default-playlist.jpg'}
              alt={playlist.name}
              width={48}
              height={48}
              className="rounded-lg object-cover flex-shrink-0 sm:w-[60px] sm:h-[60px]"
              sizes="(max-width: 640px) 48px, 60px"
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1 sm:line-clamp-2 mb-0.5 sm:mb-1">
                {playlist.name}
              </h3>
              <p className="text-[10px] sm:text-sm text-foreground/70 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2">
                {playlist.description}
              </p>
              <div className="text-[9px] sm:text-xs text-foreground/50">
                <span className="line-clamp-1">
                  {playlist.creator.name} • {playlist.trackCount}곡 • 좋아요 {playlist.likeCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

// 영상 섹션 컴포넌트
const VideoSection: React.FC<{
  videos: FloSearchedVideo[];
  onVideoPlay?: (video: FloSearchedVideo) => void;
}> = memo(({ videos, onVideoPlay }) => {
  const safeVideos = Array.isArray(videos) ? videos : [];
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {safeVideos.slice(0, 8).map((video) => (
        <button
          key={video.id}
          onClick={() => onVideoPlay?.(video)}
          className="text-left bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
        >
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={video.thumbnailImageList[0]?.url || '/images/default-video.jpg'}
              alt={video.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-black ml-1">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.playTm}
            </div>
          </div>
          <div className="p-2 sm:p-3 flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
              {video.title}
            </h3>
            <p className="text-xs text-foreground/70 line-clamp-1 leading-tight">
              {video.representationArtist.name}
            </p>
            <p className="text-xs text-foreground/50">
              {video.viewCount ? `조회수 ${video.viewCount.toLocaleString()}회` : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
});

// 가사 섹션 컴포넌트
const LyricsSection: React.FC<{
  lyrics: FloSearchedLyrics[];
  keyword: string;
  onLyricsClick?: (lyrics: FloSearchedLyrics) => void;
}> = memo(({ lyrics, keyword, onLyricsClick }) => {
  const safeLyrics = Array.isArray(lyrics) ? lyrics : [];
  
  return (
    <div className="space-y-4">
      {safeLyrics.slice(0, 3).map((lyric) => (
        <button
          key={lyric.id}
          onClick={() => onLyricsClick?.(lyric)}
          className="text-left bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex gap-3">
            <div className="w-16 h-16 flex-shrink-0 relative overflow-hidden rounded-lg">
              <Image
                src={lyric.track.album.imgList.find(img => img.size >= 500)?.url || 
                     lyric.track.album.imgList.find(img => img.size >= 350)?.url || 
                     lyric.track.album.imgList.find(img => img.size >= 200)?.url || 
                     lyric.track.album.imgList[0]?.url || '/images/default-album.jpg'}
                alt={lyric.track.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">
                {lyric.track.name}
              </h3>
              <p className="text-sm text-foreground/70 mb-2">
                {lyric.track.representationArtist.name} • {lyric.track.album.title}
              </p>
              <div className="text-sm text-foreground/80 line-clamp-3">
                {highlightKeyword(lyric.lyricText, keyword)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

// 키워드 하이라이트 함수
function highlightKeyword(text: string, keyword: string) {
  if (!keyword) return text;
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

TrackSection.displayName = 'TrackSection';
AlbumSection.displayName = 'AlbumSection';
ArtistSection.displayName = 'ArtistSection';
PlaylistSection.displayName = 'PlaylistSection';
VideoSection.displayName = 'VideoSection';
LyricsSection.displayName = 'LyricsSection';

export default memo(SearchResults);
