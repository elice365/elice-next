// React Hook - FLO API 데이터 페칭 (최적화 버전)
'use client';

import { useState, useCallback } from 'react';
import { FloAlbum, FloTrack } from '@/types/flo';
import { floApiService } from '@/lib/services/flo/api';
import { useFloFetch } from './useFloFetch';

/**
 * 신보 랭킹 앨범 데이터를 가져오는 Hook (캐싱 적용)
 */
export function useAlbums() {
  const fetcher = useCallback(() => floApiService.getNewRankAlbums(), []);
  
  const { data, loading, error, refetch, isStale } = useFloFetch<FloAlbum[]>(
    'flo:albums:newrank',
    fetcher,
    {
      cacheTime: 10 * 60 * 1000, // 10분 캐시
      staleTime: 60 * 1000, // 1분 후 stale
    }
  );

  return {
    albums: data || [],
    loading,
    error: error?.message || null,
    refetch,
    isStale
  };
}

/**
 * 특정 앨범의 트랙 데이터를 가져오는 Hook (캐싱 적용)
 */
export function useTracks(albumId: number | null) {
  const fetcher = useCallback(() => {
    if (!albumId) return Promise.resolve([]);
    return floApiService.getAlbumTracks(albumId);
  }, [albumId]);
  
  const { data, loading, error, refetch } = useFloFetch<FloTrack[]>(
    albumId ? `flo:tracks:album:${albumId}` : 'flo:tracks:empty',
    fetcher,
    {
      enabled: !!albumId,
      cacheTime: 30 * 60 * 1000, // 30분 캐시
      staleTime: 5 * 60 * 1000, // 5분 후 stale
    }
  );

  return {
    tracks: data || [],
    loading,
    error: error?.message || null,
    refetch: albumId ? refetch : undefined,
  };
}

/**
 * 통합 FLO API Hook - 앨범과 트랙을 함께 관리 (최적화)
 */
export function useFlo() {
  const albumsResult = useAlbums();
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const tracksResult = useTracks(selectedAlbumId);

  const selectAlbum = useCallback((albumId: number) => {
    setSelectedAlbumId(albumId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAlbumId(null);
  }, []);

  return {
    // 앨범 데이터
    albums: albumsResult.albums,
    albumsLoading: albumsResult.loading,
    albumsError: albumsResult.error,
    albumsStale: albumsResult.isStale,
    refetchAlbums: albumsResult.refetch,

    // 트랙 데이터
    tracks: tracksResult.tracks,
    tracksLoading: tracksResult.loading,
    tracksError: tracksResult.error,
    refetchTracks: tracksResult.refetch,

    // 선택 상태
    selectedAlbumId,
    selectAlbum,
    clearSelection,
    
    // 전체 리프레시
    refreshAll: useCallback(() => {
      albumsResult.refetch();
      if (tracksResult.refetch) {
        tracksResult.refetch();
      }
    }, [albumsResult.refetch, tracksResult.refetch])
  };
}