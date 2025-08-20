// V컬러링 HLS 세그먼트 프록시 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { autoLoginClient } from '@/lib/flo/login';
import { logger } from '@/utils/logger';

async function getSegmentProxy(
  req: NextRequest,
  context: { params: Promise<{ id: string, segment: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params;
    const { id: videoId, segment } = resolvedParams;
    
    if (!videoId || !segment) {
      logger.flo.error('Missing video ID or segment for V컬러링');
      return new NextResponse('Video ID and segment are required', { status: 400 });
    }

    console.log(`🎥 V컬러링 세그먼트 프록시 요청: ${videoId}/${segment}`);

    // 메인 스트림 URL 가져오기
    const streamResult = await autoLoginClient.getVcoloringStreamUrl(videoId);
    
    if (!streamResult.success || !streamResult.streamUrl) {
      logger.flo.error('Failed to get V컬러링 stream URL for segment', { videoId, segment });
      console.error(`❌ V컬러링 세그먼트 스트림 URL 획득 실패 (${videoId}/${segment})`);
      return new NextResponse('Failed to get stream URL', { status: 500 });
    }

    // 베이스 URL에서 세그먼트 URL 구성
    const baseUrl = streamResult.streamUrl.substring(0, streamResult.streamUrl.lastIndexOf('/'));
    const segmentUrl = `${baseUrl}/${segment}`;

    console.log(`🌐 V컬러링 실제 세그먼트 URL: ${segmentUrl}`);

    // 세그먼트 데이터 가져오기
    const segmentResponse = await fetch(segmentUrl, {
      headers: {
        'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!segmentResponse.ok) {
      logger.flo.error('Failed to fetch V컬러링 segment', { videoId, segment, status: segmentResponse.status });
      console.error(`❌ V컬러링 세그먼트 응답 실패 (${videoId}/${segment}): ${segmentResponse.status}`);
      return new NextResponse('Failed to fetch segment', { status: segmentResponse.status });
    }

    console.log(`✅ V컬러링 세그먼트 성공 (${videoId}/${segment})`);

    // TS 세그먼트를 그대로 전달
    return new NextResponse(segmentResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp2t',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=3600' // TS 세그먼트는 캐시 가능
      }
    });

  } catch (error) {
    const resolvedParams = await context.params;
    const { id: videoId, segment } = resolvedParams;
    
    logger.flo.error('V컬러링 segment proxy error', { videoId, segment, error });
    console.error(`❌ V컬러링 세그먼트 프록시 오류 (${videoId}/${segment}):`, error);
    
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

// Export handlers directly
export const GET = getSegmentProxy;
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
};