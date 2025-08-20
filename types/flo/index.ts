// TypeScript 타입 정의 - FLO API 통합 구조

// === 기본 공통 타입 ===
export interface FloImage {
  size: number;
  url: string;
}

export interface FloArtist {
  id: number;
  name: string;
}

// === 레거시 호환 타입 (기존 컴포넌트용) ===
export interface FloAlbum {
  id: number;
  title: string;
  imgList: FloImage[];
  releaseYmd: string;
  genreStyle: string;
  albumTypeStr: string;
  albumType: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
}

export interface FloTrack {
  id: number;
  name: string;
  playTime: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  titleYn: string;
  trackNo: string;
}

// === 실제 API 응답 타입 (curl 분석 기반) ===
export interface FloNewRankAlbum {
  id: number;
  title: string;
  categoryType: 'KPOP' | 'POP' | 'ALL';
  representationArtist: FloArtist;
  artistList: FloArtist[];
  imgList: FloImage[];
  releaseYmd: string;
  genreStyle: string;
  albumTypeStr: string;
  albumType: string;
}

export interface FloNewRankResponse {
  code: string;
  data: {
    popAlbumList: FloNewRankAlbum[];
  };
  traceId: string;
}

export interface FloTrackList {
  id: number;
  name: string;
  playTime: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  album: {
    id: number;
    title: string;
    imgList: FloImage[];
    genreStyle: string;
    releaseYmd: string;
  };
  titleYn: string;
  trackNo: string;
}

export interface FloTrackListResponse {
  code: string;
  data: {
    list: FloTrackList[];
    totalCount: number;
    tasteMix?: {
      mixYn: string;
      status: string;
      displayMessage: string;
    };
  };
  traceId: string;
}

export interface FloChannel {
  id: number;
  name: string;
  title?: string;
  imgList?: FloImage[];
  img?: {
    availableSizeList: number[];
    urlFormat: string;
  };
  subTitle?: string;
  updateDt?: string;
  badgeList?: any[];
  type?: string;
  personalizationYn?: string;
}

export interface FloChannelResponse {
  code: string;
  data: {
    channelList: FloChannel[];
    totalCount: number;
  };
  traceId: string;
}

export interface FloVcoloring {
  id: number;
  name: string;
  title: string;
  representationArtist: FloArtist;
  thumbnailImageList: FloImage[];
  playTm: string;
  subTitle?: string;
}

export interface FloVcoloringResponse {
  code: string;
  data: {
    vcoloringList: FloVcoloring[];
    totalCount: number;
  };
  traceId: string;
}

export interface FloGenresResponse {
  code: string;
  data: {
    type: string;
    list: any[];
  };
  traceId: string;
}

export interface FloEditorsPickResponse {
  code: string;
  message: string;
  data: {
    list: FloChannel[];
    title: string;
  };
  traceId: string;
}

export interface FloHealingResponse {
  code: string;
  message: string;
  data: {
    list: FloChannel[];
  };
  traceId: string;
}

// 차트 관련 타입
export interface FloChartTab {
  id: number;
  name: string;
  tabName: string;
}

export interface FloChartMenu {
  id: number;
  name: string;
  tabList?: FloChartTab[];
}

export interface FloChartsResponse {
  code: string;
  data: {
    menuList: FloChartMenu[];
  };
  traceId: string;
}

export interface FloChartTrack {
  id: number;
  name: string;
  rank: number;
  rankStatus: string;
  representationArtist: FloArtist;
  album: {
    id: number;
    title: string;
    imgList: FloImage[];
  };
  playTime: string;
}

export interface FloChartDetailResponse {
  code: string;
  data: {
    list: FloChartTrack[];
    totalCount: number;
  };
  traceId: string;
}

export interface FloContentsResponse {
  code: string;
  data: {
    list: {
      type: string;
      content: {
        id?: number;
        title?: string;
        list: FloChannel[];
      };
    }[];
    totalCount?: number;
  };
  traceId?: string;
}

// === 레거시 응답 타입 (호환성 유지) ===
export interface FloAlbumResponse {
  code: string;
  data: {
    popAlbumList: FloAlbum[];
  };
  traceId: string;
}

export interface FloTrackResponse {
  code: string;
  data: {
    list: FloTrack[];
    tasteMix: {
      mixYn: string;
      status: string;
      displayMessage: string;
    };
  };
  traceId: string;
}

// === 통합 시스템 타입 ===
export type FloContentType = 
  | 'new-rank'
  | 'new-music'  // 최신 음악 탭 (앨범 데이터)
  | 'contents'
  | 'vcoloring'
  | 'genres'
  | 'editors-pick'
  | 'healing'
  | 'charts';

export interface FloUnifiedItem {
  id: number;
  title?: string;
  name?: string;
  type: FloContentType;
  image: string;
  subtitle?: string;
  metadata?: {
    artist?: string;
    releaseDate?: string;
    genre?: string;
    trackCount?: number;
    playTime?: string;
    albumTitle?: string;
    curationId?: string;
  };
  categoryType?: 'KPOP' | 'POP' | 'ALL';
  isTrack?: boolean;
  isAlbum?: boolean;
  clickParams?: {
    albumId?: number;
    channelId?: number;
    vcoloringId?: number;
    videoId?: number;
    trackId?: number;
    curationId?: string;
    chartId?: number;
  };
}

export interface FloDetailData {
  id: number;
  type: FloContentType;
  mainData: any;
  additionalData?: any[];
  hasFilters: boolean;
  categoryFilters?: {
    ALL: any[];
    KPOP: any[];
    POP: any[];
  };
}

export interface FloUnifiedResponse {
  success: boolean;
  data: {
    items: FloUnifiedItem[];
    hasFilters: boolean;
    categoryFilters?: any;
    totalCount: number;
  };
  type: FloContentType;
  cached: boolean;
  timestamp: string;
  error?: string;
}

// === 컴포넌트 Props 타입 ===
export interface FloCardProps {
  album: FloAlbum;
  index: number;
  onClick?: (album: FloAlbum) => void;
  className?: string;
}

export interface FloLayoutProps {
  albums: FloAlbum[];
  title?: string;
  subtitle?: string;
  onAlbumClick?: (album: FloAlbum) => void;
  swiperConfig?: any;
  className?: string;
  loading?: boolean;
}

export interface TrackModalProps {
  album: FloAlbum | null;
  isOpen: boolean;
  onClose: () => void;
  tracks: FloTrack[];
  loading: boolean;
  error?: string | null;
}

export interface TrackTableProps {
  album: FloAlbum;
  tracks: FloTrack[];
  onAddToPlaylist?: (track: FloTrack) => void;
  onAddToMyList?: (track: FloTrack) => void;
}

// === 통합 시스템 컴포넌트 Props ===
export interface FloUnifiedCardProps {
  item: FloUnifiedItem;
  index: number;
  onClick?: (item: FloUnifiedItem) => void;
  className?: string;
}

export interface FloUnifiedLayoutProps {
  items: FloUnifiedItem[];
  title?: string;
  subtitle?: string;
  onItemClick?: (item: FloUnifiedItem) => void;
  swiperConfig?: any;
  className?: string;
  loading?: boolean;
  hasFilters?: boolean;
  categoryFilters?: any;
  selectedCategory?: 'ALL' | 'KPOP' | 'POP';
  onCategoryChange?: (category: 'ALL' | 'KPOP' | 'POP') => void;
}

// === API 서비스 타입 ===
export interface FloApiService {
  getNewRankAlbums(): Promise<FloAlbum[]>;
  getAlbumTracks(albumId: number): Promise<FloTrack[]>;
}

export interface FloUnifiedApiService {
  getContentData(type: FloContentType): Promise<FloUnifiedResponse>;
  getDetailData(type: FloContentType, id: number): Promise<FloDetailData>;
}


// FLO 상태 타입 정의
export interface FloState {
  activeTab: FloContentType;
  activeFilter: 'ALL' | 'KPOP' | 'POP';
  items: FloUnifiedItem[];
  allTabsData: Record<string, FloUnifiedItem[]>; // 필터 데이터 포함을 위해 string으로 변경
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  categoryFilters: Record<'ALL' | 'KPOP' | 'POP', FloUnifiedItem[]> | null;
  totalCount: number;
  lastFetched: Record<string, number>;
  cacheExpiry: number;
  filterData: {
    KPOP: FloUnifiedItem[];
    POP: FloUnifiedItem[];
  };
}

// === FLO 검색 관련 타입 ===

// 멀티 트랙 서치 요청 타입
export interface FloMultiSearchRequest {
  trackText: string; // 여러 곡 정보를 개행문자로 구분한 문자열
}

// 멀티 트랙 서치 응답 타입 (시작)
export interface FloMultiSearchResponse {
  code: string;
  data: {
    searchId: string; // 검색 ID (상태 확인 및 결과 조회용)
    status: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  };
  traceId: string;
}

// 멀티 트랙 서치 상태 확인 응답 타입
export interface FloMultiSearchStatusResponse {
  code: string;
  data: {
    searchId: string;
    status: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number; // 진행률 (0-100)
    message?: string;
  };
  traceId: string;
}

// 멀티 트랙 서치 결과 타입
export interface FloMultiSearchResult {
  code: string;
  data: {
    searchId: string;
    status: 'COMPLETED' | 'FAILED';
    results: FloSearchTrack[];
    totalCount: number;
    processedCount: number;
    failedCount: number;
  };
  traceId: string;
}

// 검색된 트랙 정보
export interface FloSearchTrack {
  originalQuery: string; // 원래 검색어 (예: "태연 - 사계")
  found: boolean;
  track?: {
    id: number;
    name: string;
    playTime: string;
    representationArtist: FloArtist;
    artistList: FloArtist[];
    album: {
      id: number;
      title: string;
      imgList: FloImage[];
    };
    confidence: number; // 매칭 정확도 (0-1)
  };
  alternatives?: FloSearchTrack['track'][]; // 대안 트랙들
  error?: string;
}

// 자동완성 키워드 항목
export interface FloAutocompleteItem {
  text: string;
  url?: string; // 바로가기 URL (SHORTCUT 타입인 경우)
}

// 자동완성 응답의 각 섹션
export interface FloAutocompleteSection {
  type: 'KEYWORD' | 'SHORTCUT';
  style: 'INSTANT';
  createDateTime: string;
  list: FloAutocompleteItem[];
}

// 자동완성 응답 타입
export interface FloAutocompleteResponse {
  code: string;
  data: {
    list: FloAutocompleteSection[];
  };
  traceId: string;
}

// 통합 검색 요청 타입
export interface FloIntegratedSearchRequest {
  keyword: string;
  queryType?: 'system' | 'user';
  sortType?: 'ACCURACY' | 'POPULARITY' | 'RECENT';
  page?: number;
  size?: number;
}

// 통합 검색 결과의 각 항목 기본 타입
interface FloSearchBaseItem {
  id: number;
  name: string;
  type: string;
}

// 검색된 트랙
export interface FloSearchedTrack extends FloSearchBaseItem {
  type: 'TRACK';
  playTime: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  album: {
    id: number;
    title: string;
    imgList: FloImage[];
  };
  rank?: number;
  popularity?: number;
}

// 검색된 앨범
export interface FloSearchedAlbum extends FloSearchBaseItem {
  type: 'ALBUM';
  title: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  imgList: FloImage[];
  releaseYmd: string;
  trackCount: number | null;
}

// 검색된 아티스트
export interface FloSearchedArtist extends FloSearchBaseItem {
  type: 'ARTIST';
  artistType: string;
  imgList: FloImage[];
  albumCount: number;
  trackCount: number;
  followerCount?: number;
}

// 검색된 플레이리스트
export interface FloSearchedPlaylist extends FloSearchBaseItem {
  type: 'PLAYLIST';
  description: string;
  creator: {
    id: number;
    name: string;
  };
  imgList: FloImage[];
  trackCount: number;
  likeCount: number;
  playCount: number;
}

// 검색된 영상
export interface FloSearchedVideo extends FloSearchBaseItem {
  type: 'VIDEO';
  title: string;
  representationArtist: FloArtist;
  thumbnailImageList: FloImage[];
  playTm: string;
  viewCount: number | null;
}

// 검색된 가사
export interface FloSearchedLyrics extends FloSearchBaseItem {
  type: 'LYRICS';
  track: {
    id: number;
    name: string;
    representationArtist: FloArtist;
    album: {
      id: number;
      title: string;
      imgList: FloImage[];
    };
  };
  lyricText: string;
  matchedParts: string[]; // 검색어와 매칭된 가사 부분들
}

// 통합 검색 결과 섹션
export interface FloSearchSection {
  type: 'TRACK' | 'ALBUM' | 'ARTIST' | 'PLAYLIST' | 'VIDEO' | 'LYRICS';
  title: string;
  totalCount: number;
  list: (FloSearchedTrack | FloSearchedAlbum | FloSearchedArtist | FloSearchedPlaylist | FloSearchedVideo | FloSearchedLyrics)[];
  hasMore: boolean;
}

// 통합 검색 응답 타입
export interface FloIntegratedSearchResponse {
  code: string;
  data: {
    keyword: string;
    totalCount: number;
    sections: FloSearchSection[];
    suggestions?: string[]; // 추천 검색어
    correctedKeyword?: string; // 오타 수정된 검색어
  };
  traceId: string;
}