// 통합 FLO API 엔드포인트 - handler 함수 사용  
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { request } from '@/lib/fetch';
import { APIResult, AuthInfo } from '@/types/api';
import { 
  FLO_API_CONFIG, 
  FLO_API_ENDPOINTS, 
  FLO_CHART_HEADERS,
  DEFAULT_IMAGE_PATH 
} from '@/constants/flo/api';
import type { 
  FloContentType,
  FloUnifiedItem,
  FloVcoloringResponse,
  FloContentsResponse,
  FloGenresResponse,
  FloEditorsPickResponse,
  FloHealingResponse,
  FloChartsResponse
} from '@/types/flo';

// API 엔드포인트와 추가 엔드포인트는 constants에서 가져옴

// 요청 파라미터 추출 함수
function extractRequestParams(request: NextRequest) {
  const url = new URL(request.url);
  return {
    filter: url.searchParams.get('filter') || 'KPOP',
    page: parseInt(url.searchParams.get('page') || '1'),
    size: parseInt(url.searchParams.get('size') || '50')
  };
}

// 새 음악 처리 함수
async function handleNewMusic(filter: string, page: number, size: number): Promise<APIResult> {
  const validFilter = (filter === 'ALL' || filter === 'KPOP' || filter === 'POP') ? filter : 'ALL';
  const data = await getAlbumsData(validFilter, page, size);
  return {
    success: true,
    message: '최신 음악 데이터를 성공적으로 가져왔습니다',
    data: data.items
  };
}

// 새 랭킹 처리 함수
async function handleNewRank(filter: string, page: number, size: number): Promise<APIResult> {
  const filterData = await getFilteredData(filter, null, page, size);
  return {
    success: true,
    message: '필터 데이터를 성공적으로 가져왔습니다',
    data: filterData.items
  };
}

// 일반 콘텐츠 처리 함수
async function handleGeneralContent(type: FloContentType): Promise<APIResult> {
  const mainEndpoint = FLO_API_ENDPOINTS[type];
  const useChartHeaders = type === 'charts';
  const response = await fetchFromFloApi(mainEndpoint, useChartHeaders);
  const processedData = processData(type, response);

  return {
    success: true,
    message: 'FLO 데이터를 성공적으로 가져왔습니다',
    data: processedData.items
  };
}

async function getFloData(
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> {
  try {
    const resolvedParams = await context.params;
    const { type } = resolvedParams;
    const { filter, page, size } = extractRequestParams(request);
    
    if (!isValidContentType(type)) {
      return {
        success: false,
        message: '지원하지 않는 콘텐츠 타입입니다',
        data: null
      };
    }

    // 타입별 처리 분기
    if (type === 'new-music') {
      return await handleNewMusic(filter, page, size);
    }

    if (type === 'new-rank' && filter) {
      return await handleNewRank(filter, page, size);
    }

    return await handleGeneralContent(type);

  } catch (error) {
    const resolvedParams = await context.params;
    const { type } = resolvedParams;
    console.error(`Error fetching FLO data for type ${type}:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'FLO 데이터를 가져오는데 실패했습니다',
      data: null
    };
  }
}

// lib/fetch request.get 함수 사용 (공통 함수)
async function fetchFromFloApi(url: string, useChartHeaders: boolean = false) {
  try {
    const headers = useChartHeaders 
      ? { ...FLO_CHART_HEADERS }
      : {
          'User-Agent': FLO_API_CONFIG.USER_AGENT,
          ...FLO_API_CONFIG.HEADERS,
        };
        
    const response = await request.get(url, { headers });
    
    console.log('FLO API Response:', {
      url,
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });

    return response.data;
  } catch (error) {
    console.error('FLO API Error:', error);
    throw error;
  }
}

// 타입 가드
function isValidContentType(type: string): type is FloContentType {
  const validTypes: FloContentType[] = [
    'new-rank',
    'new-music',
    'contents',
    'vcoloring',
    'genres',
    'editors-pick',
    'healing',
    'charts'
  ];
  return validTypes.includes(type as FloContentType);
}

// 응답 데이터 처리 함수
function processData(
  type: FloContentType, 
  mainResponse: any
) {
  switch (type) {
    case 'new-rank':
      return getNewRank(mainResponse);
    
    case 'contents':
      return getContents(mainResponse as FloContentsResponse);
    
    case 'vcoloring':
      return getVcoloring(mainResponse as FloVcoloringResponse);
    
    case 'genres':
      return getGenres(mainResponse as FloGenresResponse);
    
    case 'editors-pick':
      return getEditorsPick(mainResponse as FloEditorsPickResponse);
    
    case 'healing':
      return getHealing(mainResponse as FloHealingResponse);
    
    case 'charts':
      return getCharts(mainResponse as FloChartsResponse);
    
    default:
      return {
        items: [],
        hasFilters: false,
        totalCount: 0
      };
  }
}

// 신규 곡 랭킹 데이터 처리 (ALL API - 한국 + 해외 앨범)
function getNewRank(
  mainResponse: any
): {
  items: FloUnifiedItem[];
  hasFilters: boolean;
  categoryFilters?: any;
  totalCount: number;
} {
  // ALL API는 data.list로 앨범 목록 반환
  const albums = (mainResponse as any)?.list || [];
  
  // 통합 형식으로 변환
  const items: FloUnifiedItem[] = albums.map((album: any) => {
    return {
      id: album.id,
      title: album.title,
      type: 'new-rank' as FloContentType,
      image: getImage(album.imgList, 350),
      subtitle: album.representationArtist?.name || '',
      metadata: {
        artist: album.representationArtist?.name || '',
        releaseDate: formatDate(album.releaseYmd),
        genre: album.genreStyle,
      },
      clickParams: {
        albumId: album.id
      }
    };
  });

  return {
    items,
    hasFilters: true, // 필터 버튼 표시
    categoryFilters: null,
    totalCount: items.length
  };
}


// 콘텐츠 채널을 FloUnifiedItem으로 변환
function mapChannelToUnifiedItem(channel: any, curationTitle: string): FloUnifiedItem {
  return {
    id: channel.id,
    title: channel.name,
    type: 'contents' as FloContentType,
    image: channel.img?.urlFormat ? 
      channel.img.urlFormat.replace('{size}', '350x350') : 
      DEFAULT_IMAGE_PATH,
    subtitle: curationTitle,
    clickParams: {
      channelId: channel.id
    }
  };
}

// 컨텐츠 데이터 처리
function getContents(response: FloContentsResponse) {
  const allChannels: FloUnifiedItem[] = [];
  const list = (response as any)?.data?.list || [];
  
  list.forEach((curation: any) => {
    const curationTitle = curation.content?.title || '';
    const channels = curation?.content?.list?.map((channel: any) => 
      mapChannelToUnifiedItem(channel, curationTitle)
    ) || [];
    allChannels.push(...channels);
  });

  return {
    items: allChannels,
    hasFilters: false,
    totalCount: allChannels.length,
    categoryFilters: undefined
  };
}

// 컬러링 데이터 처리
function getVcoloring(response: FloVcoloringResponse) {
  const curationData = (response as any)?.data || {};
  const vcoloringList = curationData.list || [];
  const curationId = curationData.id || null;
  
  const items: FloUnifiedItem[] = vcoloringList.map((video: any) => ({
    id: video.id,
    title: video.videoNm,
    type: 'vcoloring',
    image: video.thumbnailImageList?.[0]?.url || '',
    subtitle: video.representationArtist?.name || '',
    metadata: {
      artist: video.representationArtist?.name || '',
      playTime: video.playTm,
      curationId: curationId  // 큐레이션 ID 추가
    },
    clickParams: {
      vcoloringId: video.id,
      curationId: curationId  // 재생을 위한 큐레이션 ID
    }
  }));

  return {
    items,
    hasFilters: false,
    totalCount: items.length,
    categoryFilters: undefined
  };
}

// 장르 컬렉션 데이터 처리
function getGenres(response: FloGenresResponse) {
  const genreList = (response as any)?.data?.list || [];
  const items: FloUnifiedItem[] = genreList.map((genre: any) => ({
    id: genre.id,
    title: genre.name,
    type: 'genres',
    image: genre.imgList?.[0]?.url || '',
    clickParams: {
      trackId: genre.id
    }
  }));

  return {
    items,
    hasFilters: false,
    totalCount: items.length,
    categoryFilters: undefined
  };
}

// Editor's Pick 데이터 처리
function getEditorsPick(response: FloEditorsPickResponse) {
  const channelList = (response as any)?.data?.list || [];
  const items: FloUnifiedItem[] = channelList.map((channel: any) => ({
    id: channel.id,
    title: channel.name,
    type: 'editors-pick',
    image: getImageFromFormat(channel.img, 350),
    subtitle: channel.creator?.name || '',
    metadata: {
      trackCount: channel.trackCount || 0
    },
    clickParams: {
      channelId: channel.id
    }
  }));

  return {
    items,
    hasFilters: false,
    totalCount: items.length,
    categoryFilters: undefined
  };
}

// 플로 힐링 데이터 처리
function getHealing(response: FloHealingResponse) {
  const channelList = (response as any)?.data?.list || [];
  const items: FloUnifiedItem[] = channelList.map((channel: any) => ({
    id: channel.id,
    title: channel.name,
    type: 'healing',
    image: getImage(channel.imgList, 350),
    subtitle: channel.chnlDispNm || '',
    clickParams: {
      channelId: channel.id
    }
  }));

  return {
    items,
    hasFilters: false,
    totalCount: items.length,
    categoryFilters: undefined
  };
}

// 차트 데이터 처리
function getCharts(response: FloChartsResponse) {
  const menuList = (response as any)?.data?.menuList || [];
  const items: FloUnifiedItem[] = menuList.map((menu: any) => ({
    id: menu.id,
    title: menu.name,
    type: 'charts',
    image: DEFAULT_IMAGE_PATH, // 차트는 기본 이미지 사용
    subtitle: menu.tabList ? `${menu.tabList.length}개의 하위 차트` : '차트',
    clickParams: {
      chartId: menu.id
    }
  }));

  return {
    items,
    hasFilters: false,
    totalCount: items.length,
    categoryFilters: undefined
  };
}


// 데이터 반환 형식 타입
interface FloDataResponse {
  items: FloUnifiedItem[];
  totalCount: number;
  hasMore: boolean;
}

// 앨범 데이터 매핑 헬퍼
function mapAlbumToUnifiedItem(album: any): FloUnifiedItem {
  return {
    id: album.id,
    title: album.title,
    type: 'new-music' as FloContentType,
    image: getImage(album.imgList, 350),
    subtitle: album.representationArtist?.name || '',
    metadata: {
      artist: album.representationArtist?.name || '',
      releaseDate: formatDate(album.releaseYmd),
      genre: album.genreStyle,
    },
    isAlbum: true,
    clickParams: {
      albumId: album.id
    }
  };
}

// 필터에 따른 URL 생성
function buildAlbumUrl(filter: 'ALL' | 'KPOP' | 'POP', page: number, size: number): string {
  const baseUrl = filter === 'ALL' 
    ? 'https://www.music-flo.com/api/meta/v1/album/ALL/new'
    : `https://api.music-flo.com/meta/v1/album/${filter}/new`;
  
  return `${baseUrl}?page=${page}&size=${size}`;
}

// 앨범 API 요청
// Removed duplicate function - using fetchFromFloApi instead

// 최신 음악 (앨범) 데이터 가져오기 - 전체/한국/해외
async function getAlbumsData(
  filter: 'ALL' | 'KPOP' | 'POP',
  page: number = 1,
  size: number = 50
): Promise<FloDataResponse> {
  try {
    const url = buildAlbumUrl(filter, page, size);
    const response = await fetchFromFloApi(url);
    
    console.log('Albums data processing:', {
      filter,
      responseCode: (response as any)?.code,
      hasDataProperty: !!(response as any)?.data,
      dataType: typeof (response as any)?.data,
      listLength: (response as any)?.data?.list?.length || 0
    });
    
    // FLO API 응답 구조: { code, data: { list: [...], totalCount: ... }, traceId }
    const albums = (response as any)?.data?.list || [];
    
    const items = albums.map(mapAlbumToUnifiedItem);
    
    console.log(`Processed ${items.length} albums for filter ${filter}`);
    
    return {
      items,
      totalCount: (response as any)?.data?.totalCount || 0,
      hasMore: albums.length >= size
    };
  } catch (error) {
    console.error(`Error fetching ${filter} albums:`, error);
    return { items: [], totalCount: 0, hasMore: false };
  }
}

// 앨범 데이터를 FloUnifiedItem으로 변환
function mapAlbumToFilteredItem(album: any): FloUnifiedItem {
  return {
    id: album.id,
    title: album.title,
    type: 'new-rank' as FloContentType,
    image: getImage(album.imgList, 350),
    subtitle: album.representationArtist?.name || '',
    metadata: {
      artist: album.representationArtist?.name || '',
      releaseDate: formatDate(album.releaseYmd),
      genre: album.genreStyle,
    },
    isAlbum: true,
    clickParams: {
      albumId: album.id
    }
  };
}

// 앨범 API 호출
async function fetchAlbumData(type: 'KPOP' | 'POP', page: number, size: number) {
  const albumUrl = `https://api.music-flo.com/meta/v1/album/${type}/new?page=${page}&size=${size}`;
  const { data } = await request.get(albumUrl, {
    headers: {
      'User-Agent': FLO_API_CONFIG.USER_AGENT,
      ...FLO_API_CONFIG.HEADERS,
    }
  });
  return data;
}

// 필터별 데이터 가져오기 (앨범 데이터만, 페이지네이션 지원)
async function getFilteredData(
  filter: string, 
  contentType: 'album' | null = null,
  page: number = 1,
  size: number = 50
): Promise<{ items: FloUnifiedItem[], totalCount: number, hasMore: boolean }> {
  try {
    const type = filter as 'KPOP' | 'POP';
    const data = await fetchAlbumData(type, page, size);
    const albums = (data as any)?.list || [];
    
    const albumItems = albums.map(mapAlbumToFilteredItem);
    const totalCount = (data as any)?.totalCount || 0;
    
    return {
      items: albumItems,
      totalCount,
      hasMore: albumItems.length >= size
    };
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    return { items: [], totalCount: 0, hasMore: false };
  }
}


// 유틸리티 함수들
function getImage(imgList: any[], size: number = 350): string {
  if (!imgList || imgList.length === 0) {
    return DEFAULT_IMAGE_PATH;
  }

  const sortedImages = imgList
    .filter(img => img.url && img.size > 0)
    .sort((a, b) => Math.abs(a.size - size) - Math.abs(b.size - size));

  return sortedImages[0]?.url || imgList[0]?.url || DEFAULT_IMAGE_PATH;
}

function getImageFromFormat(img: any, size: number = 350): string {
  if (!img?.urlFormat) return DEFAULT_IMAGE_PATH;
  
  return img.urlFormat.replace('{size}', `${size}x${size}`);
}

function formatDate(releaseYmd: string): string {
  if (!releaseYmd) return '';
  
  try {
    const year = releaseYmd.slice(0, 4);
    const month = releaseYmd.slice(4, 6);
    const day = releaseYmd.slice(6, 8);
    
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('Error formatting release date:', error);
    return releaseYmd;
  }
}

// Export handlers
export const GET = handler(getFloData, {
  auth: false, // FLO 데이터는 인증 없이 접근 가능
  limit: true
});