// FLO 멀티 트랙 서치 결과 조회 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult, AuthInfo } from '@/types/api/api';
import { FLO_SEARCH_ENDPOINTS, FLO_CHART_HEADERS } from '@/constants/flo/api';
import type { FloMultiSearchResult } from '@/types/flo/flo';
import { getFloSession } from '@/lib/db/flo';
import { logger } from '@/utils/logger';

const handleMultiSearchResultGet = async (
  req: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult<FloMultiSearchResult>> => {
  try {
    const { id } = await context.params;
    
    if (!id || id === 'undefined') {
      return {
        success: false,
        message: '검색 ID가 필요합니다'
      };
    }

    logger.flo.info('Multi track search result request', { searchId: id });

    // FLO 세션 가져오기
    const session = await getFloSession();
    if (!session) {
      return {
        success: false,
        message: 'FLO 세션이 필요합니다'
      };
    }

    // 메모리에 저장된 결과 조회
    const storedResults = (global as any).multiSearchResults?.[id];
    
    if (!storedResults) {
      return {
        success: false,
        message: '검색 결과를 찾을 수 없습니다. 검색 ID가 유효하지 않거나 결과가 만료되었습니다.'
      };
    }

    logger.flo.info('Multi track search result retrieved', {
      searchId: id,
      status: storedResults.status,
      resultCount: storedResults.results?.length || 0
    });

    // 결과 데이터 변환
    const processedResults = storedResults.results?.map((result: any) => ({
      originalQuery: result?.query || '',
      found: result?.found || false,
      track: result?.found && result?.track ? {
        id: result.track.id,
        name: result.track.name,
        playTime: result.track.playTime || '',
        representationArtist: {
          id: result.track.representationArtist?.id || 0,
          name: result.track.representationArtist?.name || result.track.artistList?.[0]?.name || 'Unknown Artist'
        },
        artistList: result.track.artistList || [],
        album: {
          id: result.track.album?.id || 0,
          title: result.track.album?.title || '',
          imgList: result.track.album?.imgList || []
        },
        confidence: result.track.confidence || 0
      } : undefined,
      alternatives: [],
      error: result?.error || (!result?.found ? 'Track not found' : undefined)
    })) || [];

    const foundCount = processedResults.filter((r: any) => r.found).length;
    const totalCount = processedResults.length;

    const floResponse: FloMultiSearchResult = {
      success: true,
      data: {
        searchId: id,
        results: processedResults,
        totalCount,
        processedCount: totalCount,
        failedCount: totalCount - foundCount
      },
      message: '검색 결과 조회 성공'
    };

    return {
      success: true,
      message: `검색 결과를 조회했습니다. ${foundCount}/${totalCount}곡을 찾았습니다.`,
      data: floResponse
    };

  } catch (error) {
    logger.flo.error('Multi track search result error', error);
    return {
      success: false,
      message: '검색 결과 조회 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handleMultiSearchResultGet, { auth: false });

// 유틸리티 함수
function generateAuthHash(accessToken: string): string {
  // 실제 FLO API의 Authorization 해시 생성 로직
  // 임시로 간단한 해시 생성
  return Buffer.from(accessToken.substring(0, 32)).toString('base64').substring(0, 32);
}