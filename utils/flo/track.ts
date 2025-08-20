// FLO 트랙 관련 유틸리티 함수 모음

import type { FloTrack, FloTrackList, FloSearchTrack, FloImage } from '@/types/flo';
import type { TrackInfo } from '@/stores/slice/music';
import floApiService from '@/lib/services/flo/api';
import { logger } from '@/utils/logger';

/**
 * 재생 시간 포맷팅
 * @param playTime - 재생 시간 (string | number | undefined | null)
 * @returns 포맷된 시간 문자열
 */
export const formatPlayTime = (playTime: string | number | undefined | null): string => {
  if (!playTime && playTime !== 0) return '--:--';
  
  // 이미 포맷된 문자열인 경우 (예: "3:45")
  if (typeof playTime === 'string' && playTime.includes(':')) {
    const [min, sec] = playTime.split(':').map(Number);
    return (!isNaN(min) && !isNaN(sec) && sec < 60) ? playTime : '--:--';
  }
  
  // 숫자나 숫자 문자열인 경우 (초 단위)
  const seconds = typeof playTime === 'string' ? parseInt(playTime) : Number(playTime);
  if (isNaN(seconds) || seconds < 0) return '--:--';
  
  // 0초도 표시
  if (seconds === 0) return '0:00';
  
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

/**
 * 트랙 이미지 URL 가져오기
 * @param track - 트랙 정보
 * @param defaultImgList - 기본 이미지 리스트 (앨범 이미지 등)
 * @param size - 이미지 사이즈 (기본값: 350)
 * @returns 이미지 URL
 */
export const getTrackImageUrl = (
  track: any,
  defaultImgList?: FloImage[],
  size: number = 350
): string => {
  try {
    // 트랙의 앨범 이미지가 있는 경우
    if (track?.album?.imgList && Array.isArray(track.album.imgList) && track.album.imgList.length > 0) {
      return floApiService.getImage(track.album.imgList, size);
    }
    
    // 기본 이미지 리스트가 있는 경우
    if (defaultImgList && Array.isArray(defaultImgList) && defaultImgList.length > 0) {
      return floApiService.getImage(defaultImgList, size);
    }
  } catch (error) {
    logger.warn('Error getting track image URL', { error, trackName: track?.name });
  }
  
  // 기본 이미지
  return '/images/default-album.jpg';
};

/**
 * 트랙을 TrackInfo 형태로 변환
 * @param track - FLO 트랙 정보
 * @param albumTitle - 앨범 제목
 * @param imgList - 이미지 리스트
 * @returns TrackInfo 객체
 */
export const convertToTrackInfo = (
  track: any,
  albumTitle?: string,
  imgList?: FloImage[]
): TrackInfo => {
  const imageUrl = getTrackImageUrl(track, imgList, 350);
  
  // Safe conversion of id to string
  let trackId: string;
  if (track.id !== undefined && track.id !== null) {
    trackId = String(track.id);
  } else {
    logger.warn('Track missing id, using fallback', { trackName: track.name });
    trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return {
    id: trackId,
    title: track.name || 'Unknown Track',
    artist: track.representationArtist?.name || track.artist?.name || 'Unknown Artist',
    album: albumTitle || track.album?.title || 'Unknown Album',
    duration: 0,
    albumArt: imageUrl,
    imgList: track.album?.imgList || imgList || []
  };
};

/**
 * 트랙 리스트를 TrackInfo 배열로 변환
 * @param tracks - FLO 트랙 리스트
 * @param albumTitle - 앨범 제목
 * @param imgList - 이미지 리스트
 * @returns TrackInfo 배열
 */
export const convertTracksToPlaylist = (
  tracks: any[],
  albumTitle?: string,
  imgList?: FloImage[]
): TrackInfo[] => {
  return tracks.map((track) => convertToTrackInfo(track, albumTitle, imgList));
};

/**
 * V컬러링 비디오인지 확인
 * @param track - 트랙 정보
 * @returns V컬러링 여부
 */
export const isVcoloringTrack = (track: any): boolean => {
  return track._originalType === 'vcoloring';
};

/**
 * V컬러링 플레이어 열기
 * @param track - 트랙 정보
 * @param imageUrl - 썸네일 이미지 URL
 */
export const openVcoloringPlayer = (track: any, imageUrl: string): void => {
  logger.music.info('V컬러링 비디오 감지 - 비디오 플레이어로 전환', {
    vcoloringId: track._vcoloringId,
    chartId: track._chartId
  });
  
  const vcoloringEvent = new CustomEvent('openVcoloringPlayer', {
    detail: {
      videoId: track._vcoloringId || track.id,
      title: track.name,
      artist: track.representationArtist?.name || 'Unknown Artist',
      thumbnail: imageUrl
    }
  });
  window.dispatchEvent(vcoloringEvent);
};

/**
 * 모바일 디바이스 체크
 * @returns 모바일 여부
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * 검색 결과 트랙을 TrackInfo로 변환
 * @param searchTrack - 검색 결과 트랙
 * @returns TrackInfo 객체
 */
export const convertSearchTrackToTrackInfo = (searchTrack: FloSearchTrack): TrackInfo | null => {
  if (!searchTrack.found || !searchTrack.track) {
    logger.flo.warn('Cannot convert track - not found', { 
      originalQuery: searchTrack.originalQuery 
    });
    return null;
  }
  
  return {
    id: searchTrack.track.id.toString(),
    title: searchTrack.track.name,
    artist: searchTrack.track.representationArtist.name,
    album: searchTrack.track.album.title,
    duration: 0,
    albumArt: searchTrack.track.album.imgList[0]?.url || '/images/default-album.jpg',
    imgList: searchTrack.track.album.imgList || []
  };
};

/**
 * 페이지네이션 계산
 * @param items - 전체 아이템 배열
 * @param currentPage - 현재 페이지
 * @param itemsPerPage - 페이지당 아이템 수
 * @returns 페이지네이션 정보
 */
export const calculatePagination = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number = 20
) => {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
  
  return {
    totalPages,
    startIndex,
    currentItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};