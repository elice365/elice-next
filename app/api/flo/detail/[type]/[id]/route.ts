// FLO 상세 데이터 API 엔드포인트 - 카드 클릭 시 상세 정보 제공
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult, AuthInfo } from '@/types/api/api';
import { 
  FLO_DETAIL_ENDPOINTS, 
  FLO_RELATED_ENDPOINTS, 
  FLO_API_CONFIG,
  KOREAN_REGEX,
  FLO_CHART_HEADERS,
  DEFAULT_IMAGE_PATH
} from '@/constants/flo/api';
import type { 
  FloContentType,
  FloUnifiedItem,
  FloDetailData
} from '@/types/flo';

// 상세 API 엔드포인트와 관련 데이터 엔드포인트는 constants에서 가져옴

const handleDetailGet = async (
  request: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult<any>> => {
  const { type, id } = await context.params;
  
  if (!isValidContentType(type)) {
    return {
      success: false,
      message: 'Invalid content type'
    };
  }

  if (!id || id === 'undefined') {
    return {
      success: false,
      message: 'Invalid ID parameter'
    };
  }

  // V컬러링 차트 (ID: 30001)는 별도 처리
  if (type === 'charts' && id === '30001') {
    const vcoloringResult = await getVcoloringChart();
    if (vcoloringResult.success) {
      // V컬러링 차트 전용 응답 형식
      const detailData = getDetail(type, id, vcoloringResult, []);
      return {
        success: true,
        data: {
          success: true,
          data: detailData,
          type,
          id,
          cached: true,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        message: vcoloringResult.message || 'V컬러링 차트 데이터를 가져올 수 없습니다'
      };
    }
  }

  // 일반 차트/콘텐츠 처리
  const mainEndpoint = FLO_DETAIL_ENDPOINTS[type](id);
  const apiCalls = [fetchWithCache(mainEndpoint)];

  // 관련 데이터가 있는 경우 병렬 호출
  if (type in FLO_RELATED_ENDPOINTS) {
    const relatedEndpoints = FLO_RELATED_ENDPOINTS[type as keyof typeof FLO_RELATED_ENDPOINTS](id);
    const relatedCalls = relatedEndpoints.map(endpoint => 
      fetchWithCache(endpoint).catch(error => {
        console.warn(`Failed to fetch related data from ${endpoint}:`, error);
        return null; // 관련 데이터 실패 시 null 반환
      })
    );
    apiCalls.push(...relatedCalls);
  }

  // Promise.all로 병렬 API 호출
  const responses = await Promise.all(apiCalls);
  const [mainResponse, ...relatedResponses] = responses;

  // 응답 데이터 처리
  const detailData = getDetail(type, id, mainResponse, relatedResponses);

  return {
    success: true,
    data: {
      success: true,
      data: detailData,
      type,
      id,
      cached: true,
      timestamp: new Date().toISOString()
    }
  };
};

export const GET = handler(handleDetailGet, { auth: false });

// 캐시와 함께 API 호출
async function fetchWithCache(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': FLO_API_CONFIG.USER_AGENT,
      ...FLO_API_CONFIG.HEADERS,
    },
    next: { revalidate: FLO_API_CONFIG.CACHE_TTL }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // 404는 null 반환으로 처리
    }
    throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
  }

  return response.json();
}

// 타입 가드
function isValidContentType(type: string): type is FloContentType {
  return Object.keys(FLO_DETAIL_ENDPOINTS).includes(type);
}

// 상세 데이터 처리 함수
function getDetail(
  type: FloContentType,
  id: string,
  mainResponse: any,
  relatedResponses: any[] = []
): FloDetailData {
  const baseDetail: FloDetailData = {
    id: parseInt(id),
    type,
    mainData: mainResponse,
    additionalData: relatedResponses.filter(Boolean), // null 제거
    hasFilters: false
  };

  switch (type) {
    case 'new-rank':
    case 'new-music':
      return getAlbumDetail(baseDetail, mainResponse, relatedResponses);
    
    case 'contents':
    case 'editors-pick':
    case 'healing':
      return getChannelDetail(baseDetail, mainResponse, relatedResponses);
    
    case 'vcoloring':
      return getVcoloringDetail(baseDetail, mainResponse);
    
    case 'genres':
      return getGenreDetail(baseDetail, mainResponse);
    
    case 'charts':
      return getChartDetail(baseDetail, mainResponse);
    
    default:
      return baseDetail;
  }
}

// 앨범 상세 데이터 처리
function getAlbumDetail(
  baseDetail: FloDetailData,
  albumData: any,
  relatedData: any[]
): FloDetailData {
  const [tracksData, similarData] = relatedData;

  // 앨범의 카테고리에 따라 필터 제공 (new-rank만)
  const hasFilters = baseDetail.type === 'new-rank';
  let categoryFilters: { ALL: any[]; KPOP: any[]; POP: any[]; } | undefined;

  if (hasFilters && tracksData?.data?.list) {
    const tracks = tracksData.data.list;
    
    // 트랙을 KPOP/POP으로 분류 (간단한 휴리스틱 사용)
    const kpopTracks = tracks.filter((track: any) => 
      track.representationArtist?.name && isKoreanArtist(track.representationArtist.name)
    );
    const popTracks = tracks.filter((track: any) => 
      track.representationArtist?.name && !isKoreanArtist(track.representationArtist.name)
    );

    categoryFilters = {
      ALL: tracks,
      KPOP: kpopTracks,
      POP: popTracks
    };
  }

  return {
    ...baseDetail,
    hasFilters,
    categoryFilters: hasFilters ? categoryFilters : undefined,
    mainData: {
      ...albumData,
      tracks: tracksData?.data?.list || [],
      similarAlbums: similarData?.data?.list || []
    }
  };
}

// 트랙 상세 데이터 처리
function getTrackDetail(
  baseDetail: FloDetailData,
  trackData: any
): FloDetailData {
  return {
    ...baseDetail,
    mainData: {
      ...trackData,
      // 트랙 상세 정보 정규화
      playTime: trackData.playTime || '00:00',
      artist: trackData.representationArtist?.name || 'Unknown Artist',
      album: trackData.album || {}
    }
  };
}

// 채널 상세 데이터 처리 (contents, editors-pick, healing)
function getChannelDetail(
  baseDetail: FloDetailData,
  channelData: any,
  relatedData: any[]
): FloDetailData {
  const [tracksData, relatedChannelsData] = relatedData;

  return {
    ...baseDetail,
    mainData: {
      ...channelData,
      tracks: tracksData?.data?.list || [],
      relatedChannels: relatedChannelsData?.data?.list || []
    }
  };
}

// 컬러링 상세 데이터 처리
function getVcoloringDetail(
  baseDetail: FloDetailData,
  vcoloringData: any
): FloDetailData {
  // vcoloringData가 null이거나 빈 객체인 경우 기본값 사용
  if (!vcoloringData || !vcoloringData.data) {
    return {
      ...baseDetail,
      mainData: {
        id: baseDetail.id,
        title: '비디오를 찾을 수 없습니다',
        duration: '00:00',
        artist: 'Unknown Artist',
        thumbnails: [],
        error: 'V컬러링 데이터를 불러올 수 없습니다'
      }
    };
  }

  const videoData = vcoloringData.data || {};
  
  return {
    ...baseDetail,
    mainData: {
      ...videoData,
      // 비디오 메타데이터 정규화
      duration: videoData.playTm || '00:00',
      artist: videoData.representationArtist?.name || 'Unknown Artist',
      thumbnails: videoData.thumbnailImageList || []
    }
  };
}

// 장르 상세 데이터 처리
function getGenreDetail(
  baseDetail: FloDetailData,
  genreData: any
): FloDetailData {
  return {
    ...baseDetail,
    mainData: {
      ...genreData,
      // 장르 차트 정보 정규화
      tracks: genreData.tracks || [],
      chartInfo: genreData.chartInfo || {}
    }
  };
}

// 차트 상세 데이터 처리
function getChartDetail(
  baseDetail: FloDetailData,
  chartData: any
): FloDetailData {
  console.log('Chart detail processing:', {
    id: baseDetail.id,
    hasChartData: !!chartData,
    chartDataType: typeof chartData,
    chartDataKeys: chartData ? Object.keys(chartData) : []
  });

  // V컬러링 차트 (ID: 30001)는 특별 처리
  if (baseDetail.id === 30001) {
    // 내부 API에서 받은 데이터 처리
    const vcoloringVideos = chartData?.data || [];
    console.log(`Processing V컬러링 chart with ${vcoloringVideos.length} videos`);
    
    return {
      ...baseDetail,
      mainData: {
        code: 2000000,
        data: {
          list: vcoloringVideos
        },
        traceId: `VCOLORING_CHART_${Date.now()}`
      }
    };
  }

  return {
    ...baseDetail,
    mainData: {
      ...chartData,
      // 일반 차트 트랙 정보 정규화
      list: chartData?.data?.list || []
    }
  };
}

// 한국 아티스트 판별 휴리스틱 (간단한 구현)
function isKoreanArtist(artistName: string): boolean {
  // 한글이 포함되어 있으면 한국 아티스트로 간주
  return KOREAN_REGEX.test(artistName);
}

// V컬러링 차트 전용 함수 (chart API에서 복사)
async function getVcoloringChart(): Promise<APIResult> {
  try {
    console.log('🎥 Fetching V컬러링 chart data');
    
    // V컬러링 메인 API에서 데이터 가져오기
    const vcoloringUrl = 'https://api.music-flo.com/personal/v1/curations/vcoloring';
    
    const response = await request.get(vcoloringUrl, {
      headers: {
        'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('V컬러링 chart API response:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    const data = response.data as any;
    const vcoloringData = data?.data || {};
    const vcoloringList = vcoloringData.list || [];
    
    console.log(`Found ${vcoloringList.length} V컬러링 videos for chart`);
    
    // V컬러링 비디오를 차트 형식으로 변환
    const items = vcoloringList.map((video: any, index: number) => ({
      id: video.id,
      title: video.videoNm,
      type: 'vcoloring',
      image: video.thumbnailImageList?.[0]?.url || DEFAULT_IMAGE_PATH,
      subtitle: video.representationArtist?.name || '',
      metadata: {
        artist: video.representationArtist?.name || '',
        playTime: video.playTm || '',
        rank: index + 1, // 순서대로 랭킹 부여
        rankStatus: 'stable' // 기본값
      },
      clickParams: {
        vcoloringId: video.id,
        chartId: '30001',
        curationId: vcoloringData.id
      }
    }));

    return {
      success: true,
      message: 'V컬러링 차트 데이터를 성공적으로 가져왔습니다',
      data: items
    };

  } catch (error) {
    console.error('Error fetching V컬러링 chart:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'V컬러링 차트 데이터를 가져오는데 실패했습니다',
      data: null
    };
  }
}