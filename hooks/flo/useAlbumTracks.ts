// 앨범 트랙 로딩 및 캐시 관리 훅
'use client';

import { useState, useCallback, useRef } from 'react';
import apiUtils from '@/lib/api';
import { logger } from '@/utils/logger';
import { FloSearchedTrack } from '@/types/flo/flo';

interface TrackCache {
  [albumId: number]: {
    tracks: FloSearchedTrack[];
    loading: boolean;
    error: string | null;
  };
}

export function useAlbumTracks() {
  const [cache, setCache] = useState<TrackCache>({});
  const loadingRef = useRef<Set<number>>(new Set());

  // 트랙 가져오기 (캐시 없을 때만)
  const fetchIfNeeded = useCallback(async (albumId: number) => {
    // 이미 캐시에 있거나 로딩 중이면 스킵
    if (cache[albumId]?.tracks || loadingRef.current.has(albumId)) {
      return cache[albumId]?.tracks || [];
    }

    // 로딩 시작
    loadingRef.current.add(albumId);
    setCache(prev => ({
      ...prev,
      [albumId]: { tracks: [], loading: true, error: null }
    }));

    try {
      logger.flo.info('Fetching album tracks', { albumId });
      
      const response = await apiUtils.get<any>(
        `/api/flo/meta/v1/album/${albumId}/track?mixYn=N`
      );

      const tracks = response.success 
        ? (response.data?.data?.list || []) 
        : [];

      // 캐시 업데이트
      setCache(prev => ({
        ...prev,
        [albumId]: { tracks, loading: false, error: null }
      }));

      logger.flo.debug('Album tracks fetched', { 
        albumId, 
        trackCount: tracks.length 
      });

      return tracks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '앨범 트랙 로딩 실패';
      
      logger.flo.error('Failed to fetch album tracks', { 
        albumId, 
        error: errorMessage 
      });

      setCache(prev => ({
        ...prev,
        [albumId]: { tracks: [], loading: false, error: errorMessage }
      }));

      return [];
    } finally {
      loadingRef.current.delete(albumId);
    }
  }, [cache]);

  // 캐시된 트랙 가져오기
  const get = useCallback((albumId: number): FloSearchedTrack[] => {
    return cache[albumId]?.tracks || [];
  }, [cache]);

  // 로딩 상태 확인
  const loading = useCallback((albumId: number): boolean => {
    return cache[albumId]?.loading || false;
  }, [cache]);

  // 에러 확인
  const error = useCallback((albumId: number): string | null => {
    return cache[albumId]?.error || null;
  }, [cache]);

  // 캐시 초기화
  const clearCache = useCallback(() => {
    setCache({});
    loadingRef.current.clear();
  }, []);

  return {
    fetchIfNeeded,
    get,
    loading,
    error,
    clearCache
  };
}