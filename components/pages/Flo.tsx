// FLO 클라이언트 컴포넌트
'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAppDispatch, useAppSelector } from '@/stores';
import { setActiveTab, setActiveFilter, setServerData } from '@/stores/slice/flo';
import { setCurrentTrack, setPlaylist, setPlaying } from '@/stores/slice/music';
import type { TrackInfo } from '@/stores/slice/music';
import type { FloContentType, FloAlbum, FloUnifiedItem } from '@/types/flo';
import type { FloProps } from '@/types/ui/components';
import TrackTable from '@/components/features/flo/TrackTable';
import VcoloringPlayer from '@/components/ui/VcoloringPlayer';
import SearchInput from '@/components/features/flo/search/SearchInput';
import SearchResults from '@/components/features/flo/search/SearchResults';
import MultiSearch from '@/components/features/flo/search/MultiSearch';
import TabSearchResults from '@/components/features/flo/search/TabSearchResults';
import {
  FloIntegratedSearchResponse,
  FloSearchedTrack,
  FloSearchedAlbum,
  FloSearchedArtist,
  FloSearchedPlaylist,
  FloSearchedVideo,
  FloSearchedLyrics
} from '@/types/flo/flo';
import { logger } from '@/utils/logger';
import apiUtils from '@/lib/api';
import {
  getResponsiveGridClass,
  getTabButtonClass,
  getFilterButtonClass,
  getHeaderClass,
  getSectionSpacingClass,
  getResponsiveTextClass,
  getCardContainerClass,
  getResponsivePaddingClass,
  getIconSizeClass
} from '@/utils/flo/responsive';

interface ExtendedFloProps extends FloProps {
  serverData?: Record<string, FloUnifiedItem[]>;
}

type FloFilter = 'ALL' | 'KPOP' | 'POP';

interface SearchState {
  keyword: string;
  loading: boolean;
  results: FloIntegratedSearchResponse | null;
  error: string | null;
  showSearch: boolean;
  showMultiSearch: boolean;
  useTabSearch: boolean; // 탭 검색 모드 사용 여부
}

// 전체 보기 트랙 리스트 컴포넌트 (앨범에서 실제 트랙 데이터 가져오기)
const FullTableTrackList: React.FC<{
  fullTableFilter: FloFilter;
  activeTab: string;
  serverData?: Record<string, FloUnifiedItem[]>;
}> = ({ fullTableFilter, activeTab, serverData }) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllTracks = async () => {
      try {
        setLoading(true);
        setError(null);

        // 앨범 데이터 가져오기 - ALL 필터일 때 실제 ALL API 데이터 사용
        const albumItems = serverData?.[`${activeTab}-${fullTableFilter}`] || [];

        // Track loading for all albums - ${albumItems.length} albums

        // 각 앨범의 첫 번째 트랙 정보 가져오기
        const trackPromises = albumItems.map(async (albumItem, index) => {
          try {
            const albumId = albumItem.clickParams?.albumId || albumItem.id;
            const url = `/api/flo/album/${albumId}`;
            const data = await apiUtils.get(url);

            const responseData = data.data as any;
            if (data.success && responseData?.tracks && responseData.tracks.length > 0) {
              // 첫 번째 트랙 (대표곡) 반환
              const firstTrack = responseData.tracks[0];
              const albumInfo = responseData.album;
              return {
                id: firstTrack.id, // 실제 트랙 ID 사용
                name: firstTrack.name || albumItem.title || '',
                trackNumber: index + 1,
                trackNo: String(index + 1),
                playTime: firstTrack.playTime || '',
                titleYn: firstTrack.titleYn || 'N',
                representationArtist: firstTrack.representationArtist || {
                  id: 0,
                  name: albumItem.subtitle || 'Unknown Artist'
                },
                artistList: firstTrack.artistList || [],
                album: {
                  id: albumId,
                  title: albumInfo?.title || albumItem.title || '',
                  imgList: albumInfo?.imgList || (albumItem.image ? [{ url: albumItem.image, size: 350 }] : [])
                }
              };
            } else {
              // 앨범 정보를 가져올 수 없는 경우 더미 데이터 반환 (재생 불가)
              console.warn(`⚠️ 앨범 ${albumId}의 트랙 정보를 가져올 수 없습니다`);
              return {
                id: `dummy-${albumItem.id}`, // 더미 ID (재생 시 에러 발생)
                name: albumItem.title || 'Unknown Track',
                trackNumber: index + 1,
                trackNo: String(index + 1),
                playTime: '',
                titleYn: 'N',
                representationArtist: {
                  id: 0,
                  name: albumItem.subtitle || 'Unknown Artist'
                },
                artistList: [],
                album: {
                  id: albumItem.id,
                  title: albumItem.title || '',
                  imgList: albumItem.image ? [{ url: albumItem.image, size: 350 }] : []
                }
              };
            }
          } catch (error) {
            logger.error(`Failed to fetch tracks for album ${albumItem.id}:`, error);
            return null;
          }
        });

        const trackResults = await Promise.all(trackPromises);
        const validTracks = trackResults.filter(track => track !== null);

        console.log(`✅ 전체 보기: ${validTracks.length}개 트랙 정보 로드 완료`);
        setTracks(validTracks);
      } catch (error) {
        logger.error('Failed to load tracks for all view:', error);
        setError('트랙 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (serverData) {
      fetchAllTracks();
    }
  }, [fullTableFilter, activeTab, serverData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blog-accent)]"></div>
        <div className="ml-3 text-foreground/70">트랙 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            데이터를 불러올 수 없습니다
          </h3>
          <p className="mb-4 text-foreground/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <TrackTable
      album={{
        id: 0,
        title: `${getFullTableTitle(fullTableFilter)} 최신 음악`,
        imgList: [],
        releaseYmd: '',
        genreStyle: '',
        albumTypeStr: 'COLLECTION',
        albumType: 'COLLECTION',
        representationArtist: { id: 0, name: 'Various Artists' },
        artistList: []
      }}
      tracks={tracks}
      onAddToPlaylist={(track) => logger.info('Add to playlist', 'FLO', track)}
      onAddToMyList={(track) => logger.info('Add to my list', 'FLO', track)}
    />
  );
};

export default function Flo({ initialType = 'new-music', serverData }: Readonly<ExtendedFloProps>) {
  const t = useTranslations('flo');
  const dispatch = useAppDispatch();
  const { activeTab, activeFilter, items, loading, error } = useAppSelector(state => state.flo);
  const [selectedAlbum, setSelectedAlbum] = useState<FloAlbum | null>(null);
  const [albumTracks, setAlbumTracks] = useState<any[]>([]);
  const [showTrackTable, setShowTrackTable] = useState(false);
  const [showVcoloringPlayer, setShowVcoloringPlayer] = useState(false);
  const [vcoloringData, setVcoloringData] = useState<any>(null);
  // 초기값을 서버 데이터로 설정 (new-music의 기본 필터는 ALL)
  const initialItems = serverData?.['new-music'] || serverData?.['new-music-ALL'] || [];
  const [displayItems, setDisplayItems] = useState<FloUnifiedItem[]>(initialItems);
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullTableFilter, setFullTableFilter] = useState<FloFilter>('KPOP');

  // 검색 상태
  const [searchState, setSearchState] = useState<SearchState>({
    keyword: '',
    loading: false,
    results: null,
    error: null,
    showSearch: false,
    showMultiSearch: false,
    useTabSearch: true // 기본적으로 탭 검색 모드 사용
  });

  const getActiveStyle = useMemo(() => (isActive: boolean) => (
    isActive
      ? { borderColor: 'var(--border-color)', color: 'var(--blog-accent)' }
      : {}
  ), []);

  const getFilterButtonStyle = useMemo(() => (isActive: boolean) => (
    isActive
      ? { background: 'var(--blog-accent)', borderColor: 'var(--blog-accent)' }
      : { background: 'var(--background)', borderColor: 'var(--border-color)' }
  ), []);

  // Tabs horizontal scroll controls (for small screens)
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = useCallback((delta: number) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }, []);

  // Note: rely on native horizontal scroll with proper CSS; custom drag removed for stability

  // 서버 데이터를 Redux에 초기화 (한 번만 실행)
  useEffect(() => {
    logger.debug('FLO Client - serverData received', 'FLO', {
      hasData: !!serverData,
      keys: serverData ? Object.keys(serverData) : [],
      'new-music': serverData?.['new-music']?.length || 0,
      'new-music-KPOP': serverData?.['new-music-KPOP']?.length || 0,
      'new-music-POP': serverData?.['new-music-POP']?.length || 0
    });

    if (serverData && Object.keys(serverData).length > 0) {
      dispatch(setServerData(serverData));
      dispatch(setActiveTab(initialType));
    }
  }, [dispatch, initialType, serverData]);

  // V컬러링 플레이어 이벤트 리스너
  useEffect(() => {
    const handleVcoloringPlayerEvent = (event: any) => {
      console.log('V컬러링 플레이어 이벤트 수신:', event.detail);
      setVcoloringData(event.detail);
      setShowVcoloringPlayer(true);
    };

    window.addEventListener('openVcoloringPlayer', handleVcoloringPlayerEvent);

    return () => {
      window.removeEventListener('openVcoloringPlayer', handleVcoloringPlayerEvent);
    };
  }, []);

  // 필터에 따라 표시할 아이템 업데이트
  useEffect(() => {
    if (!serverData) {
      // 서버 데이터가 없으면 Redux의 items 사용
      setDisplayItems(items);
      return;
    }

    if (activeTab === 'new-music') {
      // ALL 필터일 때도 실제 ALL API 데이터를 사용
      const filterKey = `${activeTab}-${activeFilter}`;
      setDisplayItems(serverData[filterKey] || []);
    } else {
      // 다른 탭들은 해당 탭의 데이터 사용
      const tabData = serverData[activeTab] || items;
      setDisplayItems(tabData);
    }
  }, [activeTab, items, activeFilter, serverData]);

  const handleTabChange = (newTab: FloContentType) => {
    dispatch(setActiveTab(newTab));
    setShowTrackTable(false);
    setSelectedAlbum(null);
    setShowFullTable(false);
  };

  const handleFilterChange = (filter: FloFilter) => {
    // Redux 액션을 디스패치하면 자동으로 데이터가 변경됨
    dispatch(setActiveFilter(filter));
  };

  const handleShowFullTable = (filter: FloFilter) => {
    setFullTableFilter(filter as any);
    setShowFullTable(true);
  };

  // 검색 관련 핸들러들
  const handleSearchToggle = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      showSearch: !prev.showSearch,
      showMultiSearch: false
    }));
  }, []);

  const handleMultiSearchToggle = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      showMultiSearch: !prev.showMultiSearch,
      showSearch: false
    }));
  }, []);

  // 통합 검색 실행
  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;

    setSearchState(prev => ({
      ...prev,
      keyword: keyword.trim(),
      loading: true,
      error: null
    }));

    try {
      logger.flo.info('Integrated search started', { keyword });

      const response = await apiUtils.get<FloIntegratedSearchResponse>(
        `/api/flo/search/integration?keyword=${encodeURIComponent(keyword.trim())}`
      );

      if (response.success && response.data) {
        setSearchState(prev => ({
          ...prev,
          results: response.data || null,
          loading: false
        }));

        logger.flo.info('Search completed', {
          keyword,
          totalCount: response.data.data?.totalCount,
          sectionsCount: response.data.data?.sections.length
        });
      } else {
        setSearchState(prev => ({
          ...prev,
          results: null,
          error: response.message || '검색 중 오류가 발생했습니다',
          loading: false
        }));
      }
    } catch (error) {
      logger.flo.error('Search error', error);
      setSearchState(prev => ({
        ...prev,
        results: null,
        error: '검색 중 오류가 발생했습니다',
        loading: false
      }));
    }
  }, []);

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      keyword: '',
      results: null,
      error: null,
      // showSearch는 유지 - 검색창을 닫지 않음
      showSearch: prev.showSearch
    }));
  }, []);

  // 트랙 재생 처리
  const handleSearchTrackPlay = useCallback((track: FloSearchedTrack) => {
    logger.flo.info('Track play from search', {
      trackId: track.id,
      trackName: track.name,
      artist: track.representationArtist.name,
      albumImgList: track.album.imgList,
      firstImageUrl: track.album.imgList[0]?.url
    });

    try {
      const trackInfo: TrackInfo = {
        id: track.id.toString(),
        title: track.name,
        artist: track.representationArtist.name,
        album: track.album.title,
        duration: 0,
        albumArt: track.album.imgList[0]?.url || '/images/default-album.jpg',
        imgList: track.album.imgList || []
      };

      logger.flo.info('Setting track info for player', {
        trackInfo,
        albumArt: trackInfo.albumArt,
        imgListLength: trackInfo.imgList?.length
      });

      dispatch(setPlaylist({ tracks: [trackInfo], startIndex: 0 }));
      dispatch(setCurrentTrack(trackInfo));
      dispatch(setPlaying(true));

      logger.flo.info('Track play dispatched successfully');
    } catch (error) {
      logger.flo.error('Failed to play track from search', { error, trackId: track.id });
    }
  }, [dispatch]);

  // 앨범 클릭 처리
  const handleSearchAlbumClick = useCallback((album: FloSearchedAlbum) => {
    logger.flo.info('Album click from search', {
      albumId: album.id,
      albumTitle: album.title,
      artist: album.representationArtist.name
    });

    // 검색 모드는 유지하고 결과만 닫기 (선택적)
    // 사용자가 계속 검색하고 싶을 수 있으므로 검색창은 열어둠

    // 기존 앨범 클릭 로직 재사용
    const albumItem: FloUnifiedItem = {
      id: album.id,
      title: album.title,
      type: 'new-music',
      image: album.imgList[0]?.url || '/images/default-album.jpg',
      subtitle: album.representationArtist.name,
      clickParams: { albumId: album.id }
    };
    handleAlbumData(albumItem);
  }, []);

  // 아티스트 클릭 처리
  const handleSearchArtistClick = useCallback((artist: FloSearchedArtist) => {
    logger.flo.info('Artist click from search', {
      artistId: artist.id,
      artistName: artist.name
    });
    // 향후 아티스트 상세 페이지로 이동하는 로직 구현
  }, []);

  // 플레이리스트 클릭 처리
  const handleSearchPlaylistClick = useCallback((playlist: FloSearchedPlaylist) => {
    logger.flo.info('Playlist click from search', {
      playlistId: playlist.id,
      playlistName: playlist.name,
      creator: playlist.creator?.name
    });
    // 향후 플레이리스트 상세 페이지로 이동하는 로직 구현
  }, []);

  // 영상 재생 처리
  const handleSearchVideoPlay = useCallback((video: FloSearchedVideo) => {
    logger.flo.info('Video play from search', {
      videoId: video.id,
      videoTitle: video.title,
      artist: video.representationArtist?.name
    });

    setVcoloringData({
      videoId: video.id.toString(),
      title: video.title,
      artist: video.representationArtist?.name,
      thumbnail: video.thumbnailImageList?.[0]?.url
    });
    setShowVcoloringPlayer(true);
  }, []);

  // 가사 클릭 처리
  const handleSearchLyricsClick = useCallback((lyrics: FloSearchedLyrics) => {
    logger.flo.info('Lyrics click from search', {
      lyricsId: lyrics.id,
      trackName: lyrics.track?.name,
      artist: lyrics.track?.representationArtist?.name
    });

    // 가사가 포함된 트랙 재생
    if (lyrics.track) {
      const track: FloSearchedTrack = {
        id: lyrics.track.id,
        name: lyrics.track.name,
        playTime: '',
        representationArtist: lyrics.track.representationArtist,
        artistList: [],
        album: lyrics.track.album
      };
      handleSearchTrackPlay(track);
    }
  }, [handleSearchTrackPlay]);

  // 더보기 클릭 처리
  const handleSearchMoreClick = useCallback((sectionType: string) => {
    logger.flo.info('More click from search', {
      sectionType,
      keyword: searchState.keyword
    });
    // 향후 섹션별 상세 검색 결과 페이지로 이동하는 로직 구현
  }, [searchState.keyword]);


  // 앨범 데이터 처리 함수
  const handleAlbumData = async (item: FloUnifiedItem) => {
    const albumId = item.clickParams?.albumId || item.id;
    logger.flo.debug('Album ID', { albumId });

    if (!albumId) {
      logger.flo.error('No album ID found for item', item);
      return;
    }

    try {
      const url = `/api/flo/album/${albumId}`;
      logger.flo.debug('Fetching from', { url });
      const data = await apiUtils.get(url);
      logger.flo.debug('Album API response', data);

      if (data.success && data.data) {
        const albumData = data.data as any;
        logger.flo.debug('Album tracks', { tracks: albumData.tracks });
        setSelectedAlbum(albumData.album);
        setAlbumTracks(albumData.tracks || []);
        setShowTrackTable(true);
      } else {
        logger.flo.error('Invalid album data', data);
      }
    } catch (error) {
      logger.flo.error('Failed to fetch album details', error);
    }
  };

  // 채널 데이터를 앨범 형식으로 변환
  const createChannelAsAlbum = (item: FloUnifiedItem) => {
    return {
      id: item.id,
      title: item.title || '',
      imgList: item.image ? [{ url: item.image, size: 350 }] : [],
      releaseYmd: '',
      genreStyle: item.type,
      albumTypeStr: 'CHANNEL',
      albumType: 'CHANNEL',
      representationArtist: { id: 0, name: item.subtitle || '' },
      artistList: []
    };
  };

  // 트랙 데이터 추출
  const extractTracks = (mainData: any) => {
    if (mainData?.data?.list) return mainData.data.list;
    if (mainData?.data?.trackList) return mainData.data.trackList;
    if (mainData?.list) return mainData.list;
    if (Array.isArray(mainData)) return mainData;
    return [];
  };

  // 트랙 데이터 포맷팅
  const formatTracks = (tracks: any[], channelAsAlbum: any) => {
    return tracks.map((track: any, index: number) => {
      // V컬러링 아이템 특별 처리
      if (track.type === 'vcoloring') {
        // Safe ID generation for V-coloring tracks
        let vcoloringId: string | number;
        if (track.id !== undefined && track.id !== null && track.id !== '') {
          vcoloringId = track.id;
        } else if (track.vcoloringId !== undefined && track.vcoloringId !== null && track.vcoloringId !== '') {
          vcoloringId = track.vcoloringId;
        } else {
          vcoloringId = `vcoloring_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
          logger.flo.warn('V-coloring track missing ID, generated fallback', { 
            trackName: track.title || track.videoNm,
            generatedId: vcoloringId
          });
        }

        return {
          id: vcoloringId,
          name: track.title || track.videoNm || '제목 없음',
          playTime: track.metadata?.playTime || track.playTm || '',
          representationArtist: {
            id: track.representationArtist?.id || track.metadata?.artistId || 0,
            name: track.subtitle || track.metadata?.artist || track.representationArtist?.name || '아티스트 없음'
          },
          artistList: [],
          titleYn: 'N',
          trackNo: String(index + 1),
          album: {
            id: channelAsAlbum.id,
            title: channelAsAlbum.title,
            imgList: track.image ? [{ url: track.image, size: 350 }] : (channelAsAlbum.imgList || [])
          },
          // V컬러링 정보 보존
          _originalType: 'vcoloring',
          _vcoloringId: track.clickParams?.vcoloringId || vcoloringId,
          _chartId: track.clickParams?.chartId,
          _curationId: track.clickParams?.curationId
        };
      }

      // 일반 트랙 처리
      // Safe ID generation - ensure track always has a valid ID
      let trackId: string | number;
      if (track.id !== undefined && track.id !== null && track.id !== '') {
        trackId = track.id;
      } else if (track.trackId !== undefined && track.trackId !== null && track.trackId !== '') {
        trackId = track.trackId;
      } else {
        // Generate fallback ID using timestamp and random value to ensure uniqueness
        trackId = `track_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        logger.flo.warn('Chart track missing ID, generated fallback', { 
          trackName: track.name || track.trackNm || track.title,
          generatedId: trackId,
          albumTitle: channelAsAlbum.title
        });
      }

      return {
        id: trackId,
        name: track.name || track.trackNm || track.title || '제목 없음',
        playTime: track.playTime || track.playTm || track.duration || '',
        representationArtist: track.representationArtist || track.artist || {
          id: track.representationArtist?.id || track.artist?.id || track.artistList?.[0]?.id || 0,
          name: track.representationArtist?.name || track.artist?.name || track.artistName || track.artistList?.[0]?.name || '아티스트 없음'
        },
        artistList: track.artistList || [],
        titleYn: track.titleYn || 'N',
        trackNo: String(track.trackNo || index + 1),
        album: {
          id: track.album?.id || track.albumId || channelAsAlbum.id,
          title: track.album?.title || track.albumTitle || channelAsAlbum.title,
          imgList: (function() {
            // Ensure imgList is always a valid array
            if (track.album?.imgList && Array.isArray(track.album.imgList) && track.album.imgList.length > 0) {
              return track.album.imgList;
            }
            if (track.imgList && Array.isArray(track.imgList) && track.imgList.length > 0) {
              return track.imgList;
            }
            if (track.album?.imgUrl) {
              return [{ url: track.album.imgUrl, size: 350 }];
            }
            if (channelAsAlbum.imgList && Array.isArray(channelAsAlbum.imgList) && channelAsAlbum.imgList.length > 0) {
              return channelAsAlbum.imgList;
            }
            // Fallback to empty array
            return [];
          })()
        },
        // V컬러링 정보 보존
        _originalType: track.type || (track.clickParams?.vcoloringId ? 'vcoloring' : undefined),
        _vcoloringId: track.clickParams?.vcoloringId,
        _chartId: track.clickParams?.chartId,
        _curationId: track.clickParams?.curationId
      };
    });
  };

  // 채널/차트 데이터 처리 함수
  const handleChannelData = async (item: FloUnifiedItem) => {
    try {
      const data = await apiUtils.get(`/api/flo/detail/${item.type}/${item.id}`);
      logger.flo.debug(`${item.type} detail data`, data);

      if (data.success && data.data) {
        const mainData = (data.data as any)?.data?.mainData;
        logger.flo.debug('Main data', mainData);

        const channelAsAlbum = createChannelAsAlbum(item);
        const tracks = extractTracks(mainData);
        const formattedTracks = formatTracks(tracks, channelAsAlbum);

        logger.flo.debug('Formatted tracks', {
          tracks: formattedTracks,
          albumImages: formattedTracks.map(t => ({
            name: t.name,
            imgList: t.album?.imgList
          }))
        });

        setSelectedAlbum(channelAsAlbum);
        setAlbumTracks(formattedTracks);
        setShowTrackTable(true);
      } else {
        logger.flo.error('Failed to get detail data', data);
      }
    } catch (error) {
      logger.flo.error('Failed to fetch details', error);
    }
  };

  // V컬러링 재생 처리 함수 (새로운 스트리밍 방식)
  const handleVcoloringPlay = async (item: FloUnifiedItem) => {
    console.log('=== handleVcoloringPlay 시작 ===', item);

    const videoId = item.clickParams?.vcoloringId || item.id;

    console.log('V컬러링 재생 정보:', {
      videoId: videoId,
      title: item.title,
      artist: item.subtitle,
      thumbnail: item.image
    });

    logger.flo.debug('V컬러링 재생 요청', {
      videoId,
      item
    });

    // 새로운 간단한 V컬러링 재생 데이터 설정
    setVcoloringData({
      videoId: videoId.toString(),
      title: item.title || 'V컬러링',
      artist: item.subtitle || 'Unknown Artist',
      thumbnail: item.image
    });
    setShowVcoloringPlayer(true);
  };

  // 메인 카드 클릭 핸들러 (리팩토링된 버전)
  const handleCardClick = async (item: FloUnifiedItem) => {
    console.log('=== CARD CLICKED ===', {
      item,
      type: item.type,
      clickParams: item.clickParams
    });

    logger.flo.debug('Card clicked', {
      item,
      type: item.type,
      clickParams: item.clickParams
    });

    // V컬러링은 비디오이므로 특별 처리
    if (item.type === 'vcoloring') {
      console.log('=== V컬러링 클릭 감지 ===');
      await handleVcoloringPlay(item);
      return;
    }

    // 앨범 타입과 채널/차트 타입 구분 처리
    if (item.type === 'new-music' || item.type === 'new-rank') {
      await handleAlbumData(item);
    } else {
      await handleChannelData(item);
    }
  };

  const handleBackToList = () => {
    setShowTrackTable(false);
    setSelectedAlbum(null);
  };

  const handleCloseVcoloringPlayer = () => {
    setShowVcoloringPlayer(false);
    setVcoloringData(null);
  };

  const tabOptions = [
    { value: 'new-music', label: '최신 음악' },
    { value: 'contents', label: '큐레이션' },
    { value: 'vcoloring', label: 'V컬러링' },
    { value: 'genres', label: '장르별' },
    { value: 'editors-pick', label: '에디터 픽' },
    { value: 'healing', label: '힐링' },
    { value: 'charts', label: '차트' }
  ] as const;

  return (
    <div className="w-full bg-background text-foreground flo-container">

      {/* 헤더 */}
      <div className="text-white relative z-30 w-full max-w-full" style={{ background: 'var(--blog-accent)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-full max-w-full px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">FLO</h1>
              <p className="opacity-90 text-sm sm:text-base">
                {t('subtitle', { default: '모든 음악이 흐르는 곳' })}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleSearchToggle}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg transition-colors"
                title="통합 검색"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium hidden xs:inline">검색</span>
              </button>
              <button
                onClick={handleMultiSearchToggle}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg transition-colors"
                title="멀티 트랙 검색"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs sm:text-sm font-medium hidden xs:inline">멀티</span>
              </button>
            </div>
          </div>

          {/* 검색 입력 영역 */}
          {searchState.showSearch && (
            <div className="mt-3 sm:mt-4 space-y-2">
              <SearchInput
                onSearch={handleSearch}
                onClear={handleClearSearch}
                initialValue={searchState.keyword}
                autoFocus
                placeholder="아티스트, 곡, 앨범 검색..."
              />
              {/* 검색 모드 토글 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchState(prev => ({ ...prev, useTabSearch: !prev.useTabSearch }))}
                  className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>{searchState.useTabSearch ? '탭 검색 모드' : '통합 검색 모드'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="sticky top-0 z-10 bg-card border-b backdrop-blur-[12px] w-full max-w-full" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-full max-w-full px-3 sm:px-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* 탭 버튼들 - 순수 네이티브 스크롤 */}
            <div
              className="overflow-x-auto scrollbar-hide max-w-full"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div ref={tabsRef} className="flex gap-1 sm:gap-2 py-2 px-1 w-max">
                {tabOptions.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={getTabButtonClass(activeTab === tab.value)}
                    style={getActiveStyle(activeTab === tab.value)}
                  >
                    {tab.label}
                    {activeTab === tab.value && (
                      <span
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[30%] h-[3px] rounded-t-[3px]"
                        style={{ background: 'var(--blog-accent)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 버튼 - 최신 음악 탭 */}
            {activeTab === 'new-music' && (
              // 최신 음악: 전체/한국/해외
              <div className="overflow-x-auto scrollbar-hide pb-2 sm:pb-3">
                <div className="flex gap-1 sm:gap-2 min-w-max px-1">
                  <button
                    onClick={() => handleFilterChange('ALL')}
                    className={getFilterButtonClass(activeFilter === 'ALL')}
                    style={getFilterButtonStyle(activeFilter === 'ALL')}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => handleFilterChange('KPOP')}
                    className={getFilterButtonClass(activeFilter === 'KPOP')}
                    style={getFilterButtonStyle(activeFilter === 'KPOP')}
                  >
                    한국
                  </button>
                  <button
                    onClick={() => handleFilterChange('POP')}
                    className={getFilterButtonClass(activeFilter === 'POP')}
                    style={getFilterButtonStyle(activeFilter === 'POP')}
                  >
                    해외
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {!showFullTable && (
        <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
          {/* 멀티 검색 UI */}
          {searchState.showMultiSearch && (
            <div>
              <MultiSearch
                onClose={() => setSearchState(prev => ({ ...prev, showMultiSearch: false }))}
                className="w-full max-w-full"
              />
            </div>
          )}

          {/* 검색 결과 표시 */}
          {searchState.showSearch && (searchState.results || searchState.useTabSearch) && searchState.keyword && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <button
                  onClick={handleClearSearch}
                  className="flex items-center gap-2 transition-colors flex-shrink-0"
                  style={{ color: 'var(--blog-accent)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">메인으로 돌아가기</span>
                  <span className="sm:hidden">뒤로</span>
                </button>
                <h2 className="text-base sm:text-xl font-bold text-foreground truncate flex-1">
                  <span className="hidden sm:inline">'{searchState.keyword}' 검색 결과</span>
                  <span className="sm:hidden">'{searchState.keyword}'</span>
                </h2>
              </div>

              {/* 탭 검색 모드 */}
              {searchState.useTabSearch ? (
                <TabSearchResults
                  keyword={searchState.keyword}
                  onTrackPlay={handleSearchTrackPlay}
                  onAlbumClick={handleSearchAlbumClick}
                  onArtistClick={handleSearchArtistClick}
                  onPlaylistClick={handleSearchPlaylistClick}
                  onLyricsClick={handleSearchLyricsClick}
                />
              ) : (
                /* 통합 검색 모드 */
                searchState.results && (
                  <SearchResults
                    sections={searchState.results.data?.sections || []}
                    keyword={searchState.keyword}
                    onTrackPlay={handleSearchTrackPlay}
                    onAlbumClick={handleSearchAlbumClick}
                    onArtistClick={handleSearchArtistClick}
                    onPlaylistClick={handleSearchPlaylistClick}
                    onVideoPlay={handleSearchVideoPlay}
                    onLyricsClick={handleSearchLyricsClick}
                    onMoreClick={handleSearchMoreClick}
                  />
                )
              )}
            </div>
          )}

          {/* 검색 로딩 상태 */}
          {searchState.loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blog-accent)]"></div>
              <div className="ml-3 text-foreground/70">검색 중...</div>
            </div>
          )}

          {/* 검색 에러 상태 */}
          {searchState.error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  검색 중 오류가 발생했습니다
                </h3>
                <p className="mb-4 text-foreground/70">{searchState.error}</p>
                <button
                  onClick={() => handleSearch(searchState.keyword)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* 기존 FLO 콘텐츠 */}
          {!searchState.showSearch && !searchState.showMultiSearch && (
            <>
              {/* 상세/로딩/에러 상태 분기 */}
              {showTrackTable && selectedAlbum && (
                <div className="space-y-4">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--blog-accent)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    목록으로 돌아가기
                  </button>
                  <TrackTable
                    album={selectedAlbum}
                    tracks={albumTracks}
                    onAddToPlaylist={(track) => logger.info('Add to playlist', 'FLO', track)}
                    onAddToMyList={(track) => logger.info('Add to my list', 'FLO', track)}
                  />
                </div>
              )}
              {(!showTrackTable || !selectedAlbum) && loading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--blog-accent)]"></div>
                </div>
              )}
              {(!showTrackTable || !selectedAlbum) && !loading && error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      데이터를 불러올 수 없습니다
                    </h3>
                    <p className="mb-4 text-foreground/70">
                      {error}
                    </p>
                  </div>
                </div>
              )}
              {(!showTrackTable || !selectedAlbum) && !loading && !error && (
                <div className="space-y-8">
                  {/* 최신 음악 탭 */}
                  {renderContent()}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 전체보기 테이블 - 화면 전환 방식 */}
      {showFullTable && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="space-y-4 w-full max-w-7xl mx-auto">
            <button
              onClick={() => setShowFullTable(false)}
              className="flex items-center gap-2 transition-colors"
              style={{ color: 'var(--blog-accent)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {getFullTableTitle(fullTableFilter)} 최신 음악
            </h2>

            <div className="w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <FullTableTrackList
                fullTableFilter={fullTableFilter}
                activeTab={activeTab}
                serverData={serverData}
              />
            </div>
          </div>
        </div>
      )}

      {/* V컬러링 플레이어 */}
      {showVcoloringPlayer && vcoloringData && (
        <VcoloringPlayer
          videoId={vcoloringData.videoId}
          title={vcoloringData.title}
          artist={vcoloringData.artist}
          thumbnail={vcoloringData.thumbnail}
          onClose={handleCloseVcoloringPlayer}
          autoplay={true}
        />
      )}

    </div>
  );

  // Helper function to render content based on active tab and state
  function renderContent() {
    if (activeTab === 'new-music' && displayItems.length > 0) {
      return renderNewMusicContent();
    }

    if (activeTab === 'new-music' && displayItems.length === 0) {
      return (
        <div className="text-center py-12 text-foreground/60">
          데이터를 불러오는 중...
        </div>
      );
    }

    if (activeTab === 'new-rank' && activeFilter === 'ALL') {
      return renderNewRankAllContent();
    }

    return renderGeneralContent();
  }

  // Helper function to render new music content
  function renderNewMusicContent() {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base sm:text-xl font-bold text-foreground">
            {getFilterTitle(activeFilter)}
          </h2>
          <button
            onClick={() => handleShowFullTable(activeFilter)}
            className="text-xs sm:text-sm font-medium hover:underline" style={{ color: 'var(--blog-accent)' }}
          >
            전체보기 &gt;
          </button>
        </div>
        <div className={`${getResponsiveGridClass('album')} w-full max-w-full`}>
          {displayItems.slice(0, 20).map((item) => (
            <button
              key={`track-${item.id}`}
              type="button"
              onClick={() => handleCardClick(item)}
              aria-label={`앨범 열기: ${item.title}`}
              className={getCardContainerClass()}
            >
              {renderItemCard(item)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Helper function to render new rank ALL content
  function renderNewRankAllContent() {
    const albums = displayItems;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">
            최신 앨범
          </h2>
          <span className="text-sm text-foreground/70">
            총 {albums.length}개
          </span>
        </div>
        <div className={`${getResponsiveGridClass('album')} w-full max-w-full`}>
          {albums.slice(0, 20).map((item) => (
            <button
              key={`album-${item.id}`}
              type="button"
              onClick={() => handleCardClick(item)}
              aria-label={`앨범 열기: ${item.title}`}
              className={getCardContainerClass()}
            >
              {renderItemCard(item)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Helper function to render general content
  function renderGeneralContent() {
    if (displayItems.length === 0) {
      return (
        <div className="text-center py-12 text-foreground/60">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.895 2-4.236 2S.528 20.105.528 19s1.895-2 4.236-2S9 17.895 9 19zM21 16c0 1.105-1.895 2-4.236 2S12.528 17.105 12.528 16s1.895-2 4.236-2S21 14.895 21 16z" />
            </svg>
          </div>
          데이터가 없습니다
        </div>
      );
    }

    // V컬러링 탭인 경우 특별한 그리드 레이아웃 사용
    if (activeTab === 'vcoloring') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {displayItems.map((item) => (
            <button
              key={`item-${item.id}`}
              type="button"
              onClick={() => handleCardClick(item)}
              aria-label={`V컬러링 재생: ${item.title}`}
              className="text-left bg-card rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {renderItemCard(item)}
            </button>
          ))}
        </div>
      );
    }

    // 일반 컨텐츠 그리드
    return (
      <div className={`${getResponsiveGridClass('general')}`}>
        {displayItems.map((item) => (
          <button
            key={`item-${item.id}`}
            type="button"
            onClick={() => handleCardClick(item)}
            aria-label={`컨텐츠 열기: ${item.title}`}
            className="text-left bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {renderItemCard(item)}
          </button>
        ))}
      </div>
    );
  }

  // Helper function to render item card
  function renderItemCard(item: FloUnifiedItem) {
    // V컬러링 카드 특별 처리
    if (item.type === 'vcoloring') {
      return (
        <>
          <div className="relative w-full">
            {/* 16:9 비율로 변경 (V컬러링 영상 비율) */}
            <div className="aspect-video relative overflow-hidden rounded-t-md bg-gradient-to-b from-purple-600/10 to-pink-600/10">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const placeholder = target.parentElement?.querySelector('.image-placeholder');
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              {/* V컬러링 플레이 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                    V컬러링
                  </span>
                  <div className="bg-white/90 rounded-full p-2 backdrop-blur-sm">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* V컬러링 라벨 */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                V컬러링
              </div>
              <div className="image-placeholder flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20" style={{ display: item.image ? 'none' : 'flex' }}>
                <span className="text-4xl mb-2">🎵</span>
                <span className="text-xs text-foreground/60">V컬러링</span>
              </div>
            </div>
            {/* 콘텐츠 정보 */}
            <div className={`${getResponsivePaddingClass('sm')} flex flex-col gap-1 sm:gap-1.5 min-w-0`}>
              <h3 className={`${getResponsiveTextClass('title')} text-foreground font-semibold line-clamp-2 leading-tight`}>
                {item.title}
              </h3>
              <p className={`${getResponsiveTextClass('subtitle')} text-foreground/70 line-clamp-1`}>
                {item.subtitle}
              </p>
              {/* V컬러링 추가 정보 */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] sm:text-xs text-foreground/50 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  뮤직비디오
                </span>
              </div>
            </div>
          </div>
        </>
      );
    }

    // 일반 앨범/트랙 카드
    return (
      <>
        <div className="aspect-square relative overflow-hidden rounded-t-md">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const placeholder = target.parentElement?.querySelector('.image-placeholder');
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="image-placeholder flex items-center justify-center w-full h-full text-foreground/50 text-lg" style={{ display: item.image ? 'none' : 'flex' }}>
            🎵
          </div>
        </div>
        <div className={`${getResponsivePaddingClass('sm')} flex flex-col gap-0.5 sm:gap-1 min-w-0`}>
          <h3 className={`${getResponsiveTextClass('title')} text-foreground line-clamp-1 sm:line-clamp-2`}>
            {item.title}
          </h3>
          <p className={`${getResponsiveTextClass('subtitle')} text-foreground/60 line-clamp-1`}>
            {item.subtitle}
          </p>
        </div>
      </>
    );
  }
}

// 필터별 제목 헬퍼 함수
function getFilterTitle(filter: 'ALL' | 'KPOP' | 'POP'): string {
  const filterTitles = {
    'ALL': '전체 최신 음악',
    'KPOP': '국내 최신 음악',
    'POP': '해외 최신 음악'
  };
  return filterTitles[filter];
}

// 전체보기 테이블 제목 헬퍼 함수
function getFullTableTitle(filter: 'ALL' | 'KPOP' | 'POP'): string {
  const tableTitles = {
    'ALL': '전체',
    'KPOP': '한국',
    'POP': '해외'
  };
  return tableTitles[filter];
}
