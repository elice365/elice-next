// FLO 멀티 트랙 서치 API - 여러 곡을 한 번에 검색
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult } from '@/types/api/api';
import { FLO_SEARCH_ENDPOINTS, FLO_CHART_HEADERS } from '@/constants/flo/api';
import type { FloMultiSearchRequest, FloMultiSearchResponse } from '@/types/flo/flo';
import { getValidFloSession, generateFloAuthHeaders, generateMD5Hash } from '@/lib/flo/session';
import { logger } from '@/utils/logger';

const handleMultiSearchPost = async (
  req: NextRequest
): Promise<APIResult<FloMultiSearchResponse>> => {
  try {
    // 요청 본문 파싱
    const body: FloMultiSearchRequest = await req.json();
    
    if (!body.trackText || body.trackText.trim().length === 0) {
      return {
        success: false,
        message: '검색할 곡 정보가 필요합니다'
      };
    }

    logger.flo.info('Multi track search request', {
      trackCount: body.trackText.split('\n').length,
      trackText: body.trackText.substring(0, 100) + '...'
    });

    // FLO 세션 가져오기 (자동 갱신 포함)
    const session = await getValidFloSession();
    if (!session) {
      return {
        success: false,
        message: 'FLO 인증에 실패했습니다. 잠시 후 다시 시도해주세요.'
      };
    }

    // 대안 구현: 개별 검색으로 멀티서치 시뮬레이션
    const tracks = body.trackText.split('\n').filter(track => track.trim().length > 0);
    logger.flo.info('Processing individual track searches', { trackCount: tracks.length });

    const searchId = generateSearchId();
    
    try {
      // 각 트랙에 대해 개별 검색 수행
      const searchPromises = tracks.map(async (trackText) => {
        const trimmedTrack = trackText.trim();
        if (!trimmedTrack) return null;
        
        try {
          // 통합 검색 API 사용
          const searchUrl = FLO_SEARCH_ENDPOINTS.INTEGRATED_SEARCH(trimmedTrack, 'system', 'ACCURACY');
          const searchResponse = await request.get(searchUrl, {
            headers: {
              ...FLO_CHART_HEADERS,
              ...generateFloAuthHeaders(session)
            }
          });

          const responseData = searchResponse.data as any;
          if (responseData?.code === '2000000' && responseData?.data?.list?.length > 0) {
            // 첫 번째 트랙 결과만 추출
            const trackResults = responseData.data.list.find((section: any) => section.type === 'TRACK');
            if (trackResults?.list?.length > 0) {
              return {
                query: trimmedTrack,
                track: trackResults.list[0],
                found: true
              };
            }
          }
          
          return {
            query: trimmedTrack,
            track: null,
            found: false
          };
        } catch (error) {
          logger.flo.error('Individual track search failed', { track: trimmedTrack, error });
          return {
            query: trimmedTrack,
            track: null,
            found: false,
            error: error instanceof Error ? error.message : 'Search failed'
          };
        }
      });

      // 모든 검색 완료 대기
      const searchResults = await Promise.all(searchPromises);
      const validResults = searchResults.filter(result => result !== null);
      
      logger.flo.info('Multi track search completed', {
        totalTracks: tracks.length,
        foundTracks: validResults.filter(r => r?.found).length,
        searchId
      });

      // 결과를 임시 저장 (실제로는 Redis나 DB에 저장해야 함)
      // 여기서는 메모리에 저장하는 간단한 구현
      (global as any).multiSearchResults = (global as any).multiSearchResults || {};
      (global as any).multiSearchResults[searchId] = {
        status: 'COMPLETED',
        results: validResults,
        completedAt: new Date().toISOString()
      };

      const floResponse: FloMultiSearchResponse = {
        success: true,
        data: {
          searchId,
          status: 'COMPLETED' // 즉시 완료로 변경
        }
      };

      return {
        success: true,
        message: `멀티 트랙 서치가 완료되었습니다. ${validResults.filter(r => r?.found).length}/${tracks.length}곡을 찾았습니다.`,
        data: floResponse
      };
    } catch (error) {
      logger.flo.error('Multi track search simulation failed', error);
      return {
        success: false,
        message: '멀티 트랙 서치 처리 중 오류가 발생했습니다'
      };
    }

  } catch (error) {
    logger.flo.error('Multi track search error', error);
    
    // 더 자세한 오류 정보 제공
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    logger.flo.error('Multi track search detailed error', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // 404 오류 처리
    if (errorMessage.includes('404')) {
      return {
        success: false,
        message: '멀티 트랙 서치 기능이 현재 사용할 수 없습니다. 일반 검색을 이용해 주세요.'
      };
    }
    
    return {
      success: false,
      message: errorMessage.includes('로그인') 
        ? 'FLO 인증이 필요합니다. 잠시 후 다시 시도해주세요.'
        : '멀티 트랙 서치 중 오류가 발생했습니다'
    };
  }
};

export const POST = handler(handleMultiSearchPost, { auth: false });

// 유틸리티 함수들
function generateSearchId(): string {
  return Math.floor(Math.random() * 100000).toString();
}

function generateTraceId(): string {
  return `MULTI_SEARCH_${Date.now()}`;
}