// FLO 유틸리티 모듈 인덱스
// 모든 FLO 관련 유틸리티 함수를 중앙에서 export

export {
  formatPlayTime,
  getTrackImageUrl,
  convertToTrackInfo,
  convertTracksToPlaylist,
  isVcoloringTrack,
  openVcoloringPlayer,
  isMobileDevice,
  convertSearchTrackToTrackInfo,
  calculatePagination
} from './track';

// API 유틸리티 타입 및 상수
export type {
  FloImage,
  FloArtist,
  FloAlbum,
  FloTrack,
  FloTrackList,
  FloChannel,
  FloSearchTrack,
  FloMultiSearchRequest,
  FloMultiSearchResponse
} from '@/types/flo';

// 공통 상수
export const FLO_CONSTANTS = {
  DEFAULT_IMAGE_SIZE: 350,
  DEFAULT_THUMBNAIL_SIZE: 80,
  ITEMS_PER_PAGE: 20,
  MAX_PLAYLIST_SIZE: 100,
  DEFAULT_VOLUME: 70,
  PLAYBACK_HISTORY_LIMIT: 5
} as const;

// 에러 메시지
export const FLO_ERROR_MESSAGES = {
  TRACK_NOT_FOUND: '트랙을 찾을 수 없습니다',
  PLAYBACK_ERROR: '재생 중 오류가 발생했습니다',
  NETWORK_ERROR: '네트워크 오류로 재생할 수 없습니다',
  UNSUPPORTED_FORMAT: '지원되지 않는 오디오 형식입니다',
  SEARCH_FAILED: '검색 중 오류가 발생했습니다',
  SEARCH_TIMEOUT: '검색 시간이 초과되었습니다'
} as const;