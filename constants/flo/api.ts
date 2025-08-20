// FLO API 엔드포인트 상수
import type { FloContentType } from '@/types/flo';

// 메인 API 엔드포인트
export const FLO_API_ENDPOINTS: Record<string, string> = {
  'new-rank': 'https://www.music-flo.com/api/meta/v1/album/ALL/new?page=1&size=40',
  'contents': 'https://api.music-flo.com/curation/v1/curations/contents',
  'vcoloring': 'https://api.music-flo.com/personal/v1/curations/vcoloring',
  'genres': 'https://api.music-flo.com/personal/v1/preferences/genres?osType=IOS',
  'editors-pick': 'https://api.music-flo.com/chartnchannel/v1/editors-pick/list',
  'healing': 'https://api.music-flo.com/personal/v1/channels/floAndDataChnl/list',
  'charts': 'https://api.music-flo.com/display/v3/browser/chart/menu/list'
};

// 추가 API 엔드포인트 (new-rank용)
export const FLO_ADDITIONAL_ENDPOINTS = {
  'new-rank': []
} as const;

// 상세 정보 API 엔드포인트 (카드 클릭 시)
export const FLO_DETAIL_ENDPOINTS = {
  'new-rank': (id: string) => `https://api.music-flo.com/meta/v1/album/${id}`,
  'new-music': (id: string) => `https://api.music-flo.com/meta/v1/album/${id}`,
  'contents': (id: string) => `https://api.music-flo.com/chartnchannel/v1/channel/${id}?mixYn=N&type=CHNL`,
  'vcoloring': (id: string) => `https://api.music-flo.com/personal/v1/vcoloring/${id}`,
  'genres': (id: string) => `https://api.music-flo.com/chartnchannel/v1/chart/track/${id}?mixYn=N`,
  'editors-pick': (id: string) => `https://api.music-flo.com/chartnchannel/v1/channel/${id}?mixYn=N&type=CHNL`,
  'healing': (id: string) => `https://api.music-flo.com/chartnchannel/v1/channel/${id}?mixYn=N&type=CHNL`,
  'charts': (id: string) => `https://api.music-flo.com/display/v1/browser/chart/${id}/list?mixYn=N`
} as const;

// 관련 정보 API 엔드포인트
export const FLO_RELATED_ENDPOINTS = {
  'new-rank': (id: string) => [
    `https://api.music-flo.com/meta/v1/album/${id}/tracks`,
    `https://api.music-flo.com/meta/v1/album/${id}/similar`
  ],
  'contents': (id: string) => [
    `https://api.music-flo.com/curation/v1/channel/${id}/tracks`,
    `https://api.music-flo.com/curation/v1/channel/${id}/related`
  ],
  'editors-pick': (id: string) => [
    `https://api.music-flo.com/chartnchannel/v1/channel/${id}/tracks`,
    `https://api.music-flo.com/chartnchannel/v1/channel/${id}/related`
  ],
  'healing': (id: string) => [
    `https://api.music-flo.com/personal/v1/channel/${id}/tracks`,
    `https://api.music-flo.com/personal/v1/channel/${id}/related`
  ]
} as const;

// API 설정
export const FLO_API_CONFIG = {
  CACHE_TTL: 86400, // 24시간
  TIMEOUT: 10000, // 10초
  USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
} as const;

// FLO 차트 API 전용 헤더
export const FLO_CHART_HEADERS = {
  'x-gm-device-id': 'CB1BB79B-98A9-4CD4-A757-5075E4FEBC2F',
  'x-gm-app-version': '8.5.1',
  'x-gm-os-type': 'IOS',
  'x-gm-os-version': '26.0',
  'x-gm-device-model': 'iPhone16,2',
  'x-gm-app-name': 'FLO',
  'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0'
} as const;

// 한국 아티스트 판별 정규식
export const KOREAN_REGEX = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

// 기본 이미지 경로
export const DEFAULT_IMAGE_PATH = '/images/default-album.jpg';

// 페이지네이션 API 엔드포인트 생성 함수
export const getPagedApiUrl = (type: 'KPOP' | 'POP', contentType: 'track' | 'album', page: number, size: number = 50) => {
  if (contentType === 'track') {
    return `https://api.music-flo.com/meta/v1/track/${type}/new?mixYn=N&page=${page}&size=${size}`;
  } else {
    return `https://api.music-flo.com/meta/v1/album/${type}/new?page=${page}&size=${size}`;
  }
};

// === FLO 검색 API 엔드포인트 ===

// 멀티 트랙 서치 API
export const FLO_SEARCH_ENDPOINTS = {
  // 멀티 트랙 서치 시작
  MULTI_SEARCH: 'https://api.music-flo.com/general/v1/multitracksearch',
  
  // 멀티 트랙 서치 상태 확인
  MULTI_SEARCH_STATUS: (searchId: string) => `https://api.music-flo.com/general/v1/multitracksearch/${searchId}/status`,
  
  // 멀티 트랙 서치 결과 조회
  MULTI_SEARCH_RESULT: (searchId: string) => `https://api.music-flo.com/general/v1/multitracksearch/${searchId}/result`,
  
  // 실시간 자동완성
  AUTOCOMPLETE: (keyword: string) => `https://api.music-flo.com/search/v2/search/instant/integration?keyword=${encodeURIComponent(keyword)}`,
  
  // 통합 검색
  INTEGRATED_SEARCH: (keyword: string, queryType: string = 'system', sortType: string = 'ACCURACY') => 
    `https://api.music-flo.com/search/v2/search/integration?keyword=${encodeURIComponent(keyword)}&queryType=${queryType}&sortType=${sortType}`
} as const;

// FLO 검색 API 설정
export const FLO_SEARCH_CONFIG = {
  // 멀티 서치 폴링 간격 (밀리초)
  MULTI_SEARCH_POLLING_INTERVAL: 1000,
  
  // 멀티 서치 최대 대기 시간 (밀리초)
  MULTI_SEARCH_MAX_WAIT_TIME: 30000,
  
  // 자동완성 디바운스 시간 (밀리초)
  AUTOCOMPLETE_DEBOUNCE_TIME: 300,
  
  // 자동완성 최소 글자 수
  AUTOCOMPLETE_MIN_LENGTH: 1,
  
  // 검색 결과 기본 페이지 크기
  DEFAULT_PAGE_SIZE: 20,
  
  // 검색 캐시 TTL (초)
  SEARCH_CACHE_TTL: 300
} as const;