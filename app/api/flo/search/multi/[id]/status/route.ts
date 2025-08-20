// FLO 멀티 트랙 서치 상태 확인 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult, AuthInfo } from '@/types/api/api';
import { FLO_SEARCH_ENDPOINTS, FLO_CHART_HEADERS } from '@/constants/flo/api';
import type { FloMultiSearchStatusResponse } from '@/types/flo/flo';
import { getValidFloSession, generateFloAuthHeaders } from '@/lib/flo/session';
import { logger } from '@/utils/logger';

const handleMultiSearchStatusGet = async (
  req: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult<FloMultiSearchStatusResponse>> => {
  try {
    const { id } = await context.params;
    
    if (!id || id === 'undefined') {
      return {
        success: false,
        message: '검색 ID가 필요합니다'
      };
    }

    logger.flo.info('Multi track search status check', { searchId: id });

    // 메모리에서 검색 상태 확인 (워크어라운드 구현)
    const storedResults = (global as any).multiSearchResults?.[id];
    
    let status = 'NONE';
    let progress = 0;
    let message = '';
    
    if (storedResults) {
      status = storedResults.status || 'COMPLETED';
      progress = 100; // 워크어라운드에서는 즉시 완료
      message = `검색이 완료되었습니다. ${storedResults.results?.length || 0}개의 결과가 있습니다.`;
    } else {
      // 검색 ID가 존재하지 않는 경우
      status = 'NONE';
      progress = 0;
      message = '검색 정보를 찾을 수 없습니다.';
    }

    logger.flo.info('Multi track search status API response', {
      hasData: true,
      code: '2000000',
      status: status
    });

    // 응답 데이터 변환
    const floResponse: FloMultiSearchStatusResponse = {
      success: true,
      data: {
        searchId: id,
        status: status as 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
        progress: progress,
        message: message
      },
      message: '상태 조회 성공'
    };

    return {
      success: true,
      message: '검색 상태를 확인했습니다',
      data: floResponse
    };

  } catch (error) {
    logger.flo.error('Multi track search status check error', error);
    return {
      success: false,
      message: '검색 상태 확인 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handleMultiSearchStatusGet, { auth: false });

