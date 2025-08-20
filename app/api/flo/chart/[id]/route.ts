// 차트 상세 API 엔드포인트
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { request } from '@/lib/fetch';
import { APIResult, AuthInfo } from '@/types/api';
import { 
  FLO_CHART_HEADERS,
  DEFAULT_IMAGE_PATH 
} from '@/constants/flo/api';
import type { 
  FloChartDetailResponse
} from '@/types/flo';

// 차트 상세 데이터 가져오기
async function getChartDetail(
  req: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    
    if (!id) {
      return {
        success: false,
        message: '차트 ID가 필요합니다',
        data: null
      };
    }

    // V컬러링 차트 (ID: 30001)는 별도 처리
    if (id === '30001') {
      return await getVcoloringChart();
    }

    const url = `https://api.music-flo.com/display/v1/browser/chart/${id}/list?mixYn=N`;
    
    const response = await request.get(url, {
      headers: {
        ...FLO_CHART_HEADERS
      }
    });
    
    console.log('Chart detail API response:', {
      url,
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    const data = response.data;

    const chartResponse = data as FloChartDetailResponse;
    const trackList = chartResponse?.data?.list || [];
    
    // 차트 트랙을 통합 형식으로 변환
    const items = trackList.map((track: any) => ({
      id: track.id,
      title: track.name,
      type: 'charts',
      image: getImage(track.album?.imgList, 350),
      subtitle: track.representationArtist?.name || '',
      metadata: {
        artist: track.representationArtist?.name || '',
        albumTitle: track.album?.title || '',
        playTime: track.playTime || '',
        rank: track.rank || 0,
        rankStatus: track.rankStatus || ''
      },
      clickParams: {
        trackId: track.id,
        chartId: id
      }
    }));

    return {
      success: true,
      message: '차트 상세 데이터를 성공적으로 가져왔습니다',
      data: items
    };

  } catch (error) {
    const resolvedParams = await context.params;
    console.error(`Error fetching chart detail for ID ${resolvedParams.id}:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '차트 상세 데이터를 가져오는데 실패했습니다',
      data: null
    };
  }
}

// V컬러링 차트 전용 함수
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

// 유틸리티 함수 - 이미지 URL 가져오기
function getImage(imgList: any[], size: number = 350): string {
  if (!imgList || imgList.length === 0) {
    return DEFAULT_IMAGE_PATH;
  }

  const sortedImages = imgList
    .filter(img => img.url && img.size > 0)
    .sort((a, b) => Math.abs(a.size - size) - Math.abs(b.size - size));

  return sortedImages[0]?.url || imgList[0]?.url || DEFAULT_IMAGE_PATH;
}

// Export handlers
export const GET = handler(getChartDetail, {
  auth: false, // 차트 데이터는 인증 없이 접근 가능
  limit: true
});