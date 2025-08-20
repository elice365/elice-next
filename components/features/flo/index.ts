// FLO 컴포넌트 모듈 인덱스
// 모든 FLO 관련 컴포넌트를 중앙에서 export

// 핵심 컴포넌트
export { default as TrackTable } from './TrackTable';
export { FloContentTabs as ContentTabs } from './ContentTabs';
export { FloCard as Card } from './Card';
export { default as Filter } from './Filter';
export { FloLoadingSpinner as Spinner } from './LoadingSpinner';

// 검색 관련 컴포넌트
export { default as SearchInput } from './search/SearchInput';
export { default as SearchResults } from './search/SearchResults';
export { default as MultiSearch } from './search/MultiSearch';

// 타입 정의
export type {
  TrackTableProps,
  FloCardProps,
  FilterOption
} from '@/types/flo';

// 컴포넌트 프리셋 설정
export const FLO_COMPONENT_CONFIG = {
  // TrackTable 기본 설정
  trackTable: {
    itemsPerPage: 20,
    enablePagination: true,
    enablePlayButtons: true,
    enableAddToPlaylist: true,
    enableAddToMyList: true
  },
  
  // Card 기본 설정
  card: {
    defaultImageSize: 350,
    hoverScale: 1.05,
    transitionDuration: 300
  },
  
  // Search 기본 설정
  search: {
    debounceDelay: 300,
    minSearchLength: 2,
    maxAutocompleteResults: 10,
    multiSearchPollingInterval: 2000
  },
  
  // Filter 기본 설정
  filter: {
    defaultCategory: 'all',
    enableMultiSelect: false
  }
} as const;