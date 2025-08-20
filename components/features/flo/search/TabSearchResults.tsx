// FLO 탭 기반 검색 결과 컴포넌트 - 각 검색 타입별 개별 API 호출
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  FloSearchedTrack, 
  FloSearchedAlbum, 
  FloSearchedArtist, 
  FloSearchedPlaylist, 
  FloSearchedVideo, 
  FloSearchedLyrics 
} from '@/types/flo/flo';
import { logger } from '@/utils/logger';
import apiUtils from '@/lib/api';
import TrackTable from '../TrackTable';
import AlbumExpandable from './AlbumExpandable';

// 검색 타입 정의
type SearchType = 'TRACK' | 'ALBUM' | 'ARTIST' | 'PLAYLIST' | 'LYRICS';

interface TabSearchResultsProps {
  keyword: string;
  onTrackPlay?: (track: FloSearchedTrack) => void;
  onAlbumClick?: (album: FloSearchedAlbum) => void;
  onArtistClick?: (artist: FloSearchedArtist) => void;
  onPlaylistClick?: (playlist: FloSearchedPlaylist) => void;
  onLyricsClick?: (lyrics: FloSearchedLyrics) => void;
}

interface SearchState {
  activeTab: SearchType;
  loading: boolean;
  error: string | null;
  tracks: FloSearchedTrack[];
  albums: FloSearchedAlbum[];
  artists: FloSearchedArtist[];
  playlists: FloSearchedPlaylist[];
  lyrics: FloSearchedLyrics[];
  artistAlbums: Record<number, FloSearchedAlbum[]>; // 아티스트별 앨범 캐시
  playlistTracks: Record<number, FloSearchedTrack[]>; // 플레이리스트별 트랙 캐시
}

const TabSearchResults: React.FC<TabSearchResultsProps> = ({
  keyword,
  onTrackPlay,
  onAlbumClick,
  onArtistClick,
  onPlaylistClick,
  onLyricsClick
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    activeTab: 'TRACK',
    loading: false,
    error: null,
    tracks: [],
    albums: [],
    artists: [],
    playlists: [],
    lyrics: [],
    artistAlbums: {},
    playlistTracks: {}
  });

  const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
  const [expandedArtist, setExpandedArtist] = useState<number | null>(null);
  const [expandedPlaylist, setExpandedPlaylist] = useState<number | null>(null);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: SearchType) => {
    setSearchState(prev => ({ ...prev, activeTab: tab }));
    setExpandedAlbum(null);
    setExpandedArtist(null);
    setExpandedPlaylist(null);
  }, []);

  // 검색 실행 함수
  const executeSearch = useCallback(async (searchType: SearchType) => {
    if (!keyword.trim()) return;

    setSearchState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.flo.info(`Executing ${searchType} search`, { keyword });

      // 각 타입별 API 엔드포인트
      const searchUrl = `/api/flo/search/v2/search?keyword=${encodeURIComponent(keyword)}&mixYn=N&page=1&queryType=original&searchType=${searchType}&size=50&sortType=ACCURACY`;
      
      const response = await apiUtils.get<any>(searchUrl);

      logger.flo.debug(`${searchType} API Response`, { 
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        listLength: response.data?.data?.list?.length,
        firstItem: response.data?.data?.list?.[0]
      });

      if (response.success && response.data) {
        const results = response.data?.data?.list || [];
        
        // 타입별 결과 저장
        switch (searchType) {
          case 'TRACK':
            logger.flo.debug('Track results', { 
              count: results.length,
              firstTrack: results[0]
            });
            setSearchState(prev => ({ ...prev, tracks: results, loading: false }));
            break;
          case 'ALBUM':
            setSearchState(prev => ({ ...prev, albums: results, loading: false }));
            break;
          case 'ARTIST':
            setSearchState(prev => ({ ...prev, artists: results, loading: false }));
            break;
          case 'PLAYLIST':
            // FLO API에서는 ESALBUM으로 플레이리스트 검색
            const playlistUrl = `/api/flo/search/v2/search?keyword=${encodeURIComponent(keyword)}&mixYn=N&page=1&queryType=original&searchType=ESALBUM&size=50&sortType=ACCURACY`;
            const playlistResponse = await apiUtils.get<any>(playlistUrl);
            
            logger.flo.debug('Playlist API Response', {
              success: playlistResponse.success,
              hasData: !!playlistResponse.data,
              dataKeys: playlistResponse.data ? Object.keys(playlistResponse.data) : [],
              listLength: playlistResponse.data?.data?.list?.length
            });
            
            const playlistResults = playlistResponse.data?.data?.list || [];
            setSearchState(prev => ({ ...prev, playlists: playlistResults, loading: false }));
            logger.flo.info('PLAYLIST search completed', { resultCount: playlistResults.length });
            break;
          case 'LYRICS':
            setSearchState(prev => ({ ...prev, lyrics: results, loading: false }));
            break;
        }

        logger.flo.info(`${searchType} search completed`, { resultCount: results.length });
      } else {
        setSearchState(prev => ({ 
          ...prev, 
          error: '검색 결과를 가져올 수 없습니다', 
          loading: false 
        }));
      }
    } catch (error) {
      logger.flo.error(`${searchType} search error`, error);
      setSearchState(prev => ({ 
        ...prev, 
        error: '검색 중 오류가 발생했습니다', 
        loading: false 
      }));
    }
  }, [keyword]);


  // 아티스트의 앨범 가져오기
  const fetchArtistAlbums = useCallback(async (artistId: number) => {
    // 이미 캐시된 경우 캐시 사용
    if (searchState.artistAlbums[artistId]) {
      return;
    }

    try {
      logger.flo.info('Fetching artist albums', { artistId });
      
      const response = await apiUtils.get<any>(`/api/flo/meta/v1/artist/${artistId}/album?page=1&roleType=RELEASE&size=50&sortType=RECENT`);
      
      if (response.success && response.data) {
        const albums = response.data?.data?.list || [];
        
        // 아티스트 정보 업데이트 (앨범 수 반영)
        setSearchState(prev => ({
          ...prev,
          artistAlbums: { ...prev.artistAlbums, [artistId]: albums },
          artists: prev.artists.map(artist => 
            artist.id === artistId 
              ? { ...artist, albumCount: albums.length }
              : artist
          )
        }));
        logger.flo.info('Artist albums fetched', { artistId, albumCount: albums.length });
      }
    } catch (error) {
      logger.flo.error('Failed to fetch artist albums', { artistId, error });
    }
  }, [searchState.artistAlbums]);

  // 플레이리스트의 트랙 가져오기
  const fetchPlaylistTracks = useCallback(async (playlistId: number) => {
    // 이미 캐시된 경우 캐시 사용
    if (searchState.playlistTracks[playlistId]) {
      return;
    }

    try {
      logger.flo.info('Fetching playlist tracks', { playlistId });
      
      // chartnchannel API 사용
      const response = await apiUtils.get<any>(`/api/flo/personal/v1/playlist/${playlistId}?mixYn=N`);
      
      if (response.success && response.data) {
        const tracks = response.data?.data?.trackList || [];
        setSearchState(prev => ({
          ...prev,
          playlistTracks: { ...prev.playlistTracks, [playlistId]: tracks }
        }));
        logger.flo.info('Playlist tracks fetched', { playlistId, trackCount: tracks.length });
      }
    } catch (error) {
      logger.flo.error('Failed to fetch playlist tracks', { playlistId, error });
    }
  }, [searchState.playlistTracks]);


  // 아티스트 클릭 핸들러
  const handleArtistExpand = useCallback(async (artist: FloSearchedArtist) => {
    if (expandedArtist === artist.id) {
      setExpandedArtist(null);
    } else {
      setExpandedArtist(artist.id);
      await fetchArtistAlbums(artist.id);
    }
    onArtistClick?.(artist);
  }, [expandedArtist, fetchArtistAlbums, onArtistClick]);

  // 플레이리스트 클릭 핸들러
  const handlePlaylistExpand = useCallback(async (playlist: FloSearchedPlaylist) => {
    if (expandedPlaylist === playlist.id) {
      setExpandedPlaylist(null);
    } else {
      setExpandedPlaylist(playlist.id);
      await fetchPlaylistTracks(playlist.id);
    }
    onPlaylistClick?.(playlist);
  }, [expandedPlaylist, fetchPlaylistTracks, onPlaylistClick]);

  // 키워드 변경 시 검색 실행
  useEffect(() => {
    if (keyword.trim()) {
      executeSearch(searchState.activeTab);
    } else {
      // 키워드가 비어있으면 결과 초기화
      setSearchState(prev => ({
        ...prev,
        tracks: [],
        albums: [],
        artists: [],
        playlists: [],
        lyrics: [],
        albumTracks: {},
        artistAlbums: {},
        playlistTracks: {}
      }));
    }
  }, [keyword, searchState.activeTab, executeSearch]);

  // 탭 버튼 스타일
  const getTabStyle = (tab: SearchType) => {
    const isActive = searchState.activeTab === tab;
    return `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? 'bg-[var(--blog-accent)] text-white' 
        : 'bg-card text-foreground hover:bg-hover'
    }`;
  };

  // 탭 이름과 개수 표시
  const getTabLabel = (tab: SearchType) => {
    const counts = {
      TRACK: searchState.tracks.length,
      ALBUM: searchState.albums.length,
      ARTIST: searchState.artists.length,
      PLAYLIST: searchState.playlists.length,
      LYRICS: searchState.lyrics.length
    };
    
    const labels = {
      TRACK: '곡',
      ALBUM: '앨범',
      ARTIST: '아티스트',
      PLAYLIST: '플레이리스트',
      LYRICS: '가사'
    };

    return `${labels[tab]} ${counts[tab] > 0 ? `(${counts[tab]})` : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['TRACK', 'ALBUM', 'ARTIST', 'PLAYLIST', 'LYRICS'] as SearchType[]).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={getTabStyle(tab)}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {searchState.loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blog-accent)]"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {searchState.error && (
        <div className="text-center py-12 text-red-500">
          {searchState.error}
        </div>
      )}

      {/* 검색 결과 렌더링 */}
      {!searchState.loading && !searchState.error && (
        <>
          {/* 트랙 탭 - TrackTable 컴포넌트 재사용 */}
          {searchState.activeTab === 'TRACK' && searchState.tracks.length > 0 && (
            <TrackTable
              album={{
                id: 0,
                title: '검색 결과',
                imgList: [],
                releaseYmd: '',
                genreStyle: '',
                albumTypeStr: '',
                albumType: '',
                representationArtist: { id: 0, name: '다양한 아티스트' },
                artistList: []
              }}
              tracks={searchState.tracks}
              onAddToPlaylist={(track) => logger.flo.info('Add to playlist', { track })}
              onAddToMyList={(track) => logger.flo.info('Add to my list', { track })}
            />
          )}

          {/* 앨범 탭 */}
          {searchState.activeTab === 'ALBUM' && (
            <div className="space-y-4">
              {searchState.albums.map(album => (
                <AlbumExpandable
                  key={album.id}
                  album={album}
                  defaultExpanded={expandedAlbum === album.id}
                  onToggle={(albumId, expanded) => {
                    setExpandedAlbum(expanded ? albumId : null);
                  }}
                  onAlbumClick={onAlbumClick}
                />
              ))}
            </div>
          )}

          {/* 아티스트 탭 */}
          {searchState.activeTab === 'ARTIST' && (
            <div className="space-y-4">
              {searchState.artists.map(artist => (
                <div key={artist.id} className="bg-card rounded-lg p-4 space-y-3">
                  <button
                    onClick={() => handleArtistExpand(artist)}
                    className="w-full flex items-center gap-4 hover:bg-hover p-2 rounded-lg transition-colors"
                  >
                    <div className="relative w-[60px] h-[60px] flex-shrink-0">
                      <Image
                        src={artist.imgList?.[3]?.url || artist.imgList?.[2]?.url || artist.imgList?.[0]?.url || '/images/default-artist.jpg'}
                        alt={artist.name}
                        fill
                        className="rounded-full object-cover"
                        sizes="60px"
                        priority
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-foreground">{artist.name}</h3>
                      <p className="text-sm text-foreground/70">
                        {artist.albumCount > 0 ? `${artist.albumCount}앨범` : '앨범'} • {artist.trackCount > 0 ? `${artist.trackCount}곡` : '곡'}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-foreground/50 transition-transform ${
                        expandedArtist === artist.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 아티스트 앨범 목록 */}
                  {expandedArtist === artist.id && searchState.artistAlbums[artist.id] && (
                    <div className="space-y-4 pl-4">
                      {searchState.artistAlbums[artist.id].map(album => (
                        <AlbumExpandable
                          key={album.id}
                          album={album}
                          defaultExpanded={expandedAlbum === album.id}
                          onToggle={(albumId, expanded) => {
                            setExpandedAlbum(expanded ? albumId : null);
                          }}
                          onAlbumClick={onAlbumClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 플레이리스트 탭 */}
          {searchState.activeTab === 'PLAYLIST' && (
            <div className="space-y-4">
              {searchState.playlists.map(playlist => (
                <div key={playlist.id} className="bg-card rounded-lg p-4 space-y-3">
                  <button
                    onClick={() => handlePlaylistExpand(playlist)}
                    className="w-full flex items-center gap-4 hover:bg-hover p-2 rounded-lg transition-colors"
                  >
                    <div className="relative w-[60px] h-[60px] flex-shrink-0">
                      <Image
                        src={playlist.imgList?.[3]?.url || playlist.imgList?.[2]?.url || playlist.imgList?.[0]?.url || '/images/default-playlist.jpg'}
                        alt={playlist.name}
                        fill
                        className="rounded-lg object-cover"
                        sizes="60px"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-foreground">{playlist.name}</h3>
                      <p className="text-sm text-foreground/70 line-clamp-1">
                        {playlist.description}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {playlist.creator?.name} • {playlist.trackCount}곡
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-foreground/50 transition-transform ${
                        expandedPlaylist === playlist.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 플레이리스트 트랙 목록 - TrackTable 컴포넌트 재사용 */}
                  {expandedPlaylist === playlist.id && searchState.playlistTracks[playlist.id] && (
                    <div className="pl-4">
                      <TrackTable
                        album={{
                          id: 0,
                          title: playlist.name,
                          imgList: playlist.imgList,
                          releaseYmd: '',
                          genreStyle: '',
                          albumTypeStr: 'PLAYLIST',
                          albumType: 'PLAYLIST',
                          representationArtist: { id: 0, name: playlist.creator?.name || '' },
                          artistList: []
                        }}
                        tracks={searchState.playlistTracks[playlist.id]}
                        onAddToPlaylist={(track) => logger.flo.info('Add to playlist', { track })}
                        onAddToMyList={(track) => logger.flo.info('Add to my list', { track })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 가사 탭 */}
          {searchState.activeTab === 'LYRICS' && (
            <div className="space-y-4">
              {searchState.lyrics.map(lyric => (
                <button
                  key={lyric.id}
                  onClick={() => onLyricsClick?.(lyric)}
                  className="w-full text-left bg-card rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex gap-3">
                    <div className="relative w-[60px] h-[60px] flex-shrink-0">
                      <Image
                        src={lyric.track?.album?.imgList?.[3]?.url || lyric.track?.album?.imgList?.[2]?.url || lyric.track?.album?.imgList?.[0]?.url || '/images/default-album.jpg'}
                        alt={lyric.track?.name || ''}
                        fill
                        className="rounded-lg object-cover"
                        sizes="60px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{lyric.track?.name || '제목 없음'}</h3>
                      <p className="text-sm text-foreground/70">
                        {lyric.track?.representationArtist?.name || 'Unknown'} • {lyric.track?.album?.title || ''}
                      </p>
                      <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                        {lyric.lyricText}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 결과 없음 */}
          {!searchState.loading && (
            (searchState.activeTab === 'TRACK' && searchState.tracks.length === 0) ||
            (searchState.activeTab === 'ALBUM' && searchState.albums.length === 0) ||
            (searchState.activeTab === 'ARTIST' && searchState.artists.length === 0) ||
            (searchState.activeTab === 'PLAYLIST' && searchState.playlists.length === 0) ||
            (searchState.activeTab === 'LYRICS' && searchState.lyrics.length === 0)
          ) && (
            <div className="text-center py-12 text-foreground/60">
              검색 결과가 없습니다
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TabSearchResults;