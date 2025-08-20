// FLO 콘텐츠 타입별 설정 상수
import type { FloContentType } from '@/types/flo';

export interface FloContentConfig {
  type: FloContentType;
  titleKey: string;
  defaultTitle: string;
  subtitleKey: string;
  hasFilters: boolean;
  cacheTime: number; // 캐시 시간 (분)
  refreshInterval: number; // 자동 새로고침 간격 (분)
}

export const FLO_CONTENT_CONFIG: Record<FloContentType, FloContentConfig> = {
  'new-rank': {
    type: 'new-rank',
    titleKey: 'content.newRank',
    defaultTitle: '최신 음악 랭킹',
    subtitleKey: 'content.newRankDesc',
    hasFilters: true,
    cacheTime: 30,
    refreshInterval: 60
  },
  'new-music': {
    type: 'new-music',
    titleKey: 'content.newMusic',
    defaultTitle: '최신 음악',
    subtitleKey: 'content.newMusicDesc',
    hasFilters: true,
    cacheTime: 60,
    refreshInterval: 120
  },
  'contents': {
    type: 'contents',
    titleKey: 'content.contents',
    defaultTitle: '큐레이션 컬렉션',
    subtitleKey: 'content.contentsDesc',
    hasFilters: false,
    cacheTime: 180,
    refreshInterval: 360
  },
  'vcoloring': {
    type: 'vcoloring',
    titleKey: 'content.vcoloring',
    defaultTitle: '비디오 컬러링',
    subtitleKey: 'content.vcoloringDesc',
    hasFilters: false,
    cacheTime: 240,
    refreshInterval: 480
  },
  'genres': {
    type: 'genres',
    titleKey: 'content.genres',
    defaultTitle: '장르별 차트',
    subtitleKey: 'content.genresDesc',
    hasFilters: false,
    cacheTime: 120,
    refreshInterval: 240
  },
  'editors-pick': {
    type: 'editors-pick',
    titleKey: 'content.editorsPick',
    defaultTitle: '에디터 추천',
    subtitleKey: 'content.editorsPickDesc',
    hasFilters: false,
    cacheTime: 180,
    refreshInterval: 360
  },
  'healing': {
    type: 'healing',
    titleKey: 'content.healing',
    defaultTitle: '힐링 & 휴식',
    subtitleKey: 'content.healingDesc',
    hasFilters: false,
    cacheTime: 240,
    refreshInterval: 480
  },
  'charts': {
    type: 'charts',
    titleKey: 'content.charts',
    defaultTitle: '차트',
    subtitleKey: 'content.chartsDesc',
    hasFilters: false,
    cacheTime: 120,
    refreshInterval: 240
  }
};

// API 엔드포인트 매핑
export const API_ENDPOINTS: Record<FloContentType, string> = {
  'new-rank': '/api/flo/new-rank',
  'new-music': '/api/flo/new-music',
  'contents': '/api/flo/contents',
  'vcoloring': '/api/flo/vcoloring',
  'genres': '/api/flo/genres',
  'editors-pick': '/api/flo/editors-pick',
  'healing': '/api/flo/healing',
  'charts': '/api/flo/charts'
};

// 기본 설정
export const DEFAULT_CACHE_TIME = 60; // 1시간
export const DEFAULT_REFRESH_INTERVAL = 120; // 2시간
export const MAX_ITEMS_PER_PAGE = 50;
export const DEFAULT_IMAGE_SIZE = 350;