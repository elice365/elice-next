// V컬러링 비디오 스트리밍 API - 음악 스트리밍과 동일한 방식
import { NextRequest, NextResponse } from 'next/server';
import { autoLoginClient } from '@/lib/flo/login';
import { logger } from '@/utils/logger';

async function getVcoloringStreamData(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params;
    const { id: videoId } = resolvedParams;
    
    if (!videoId) {
      logger.flo.error('Missing video ID for V컬러링 stream');
      return new NextResponse('Video ID is required', { status: 400 });
    }

    console.log(`🎥 Starting V컬러링 stream for video: ${videoId}`);
    logger.flo.info('V컬러링 stream request', { videoId });

    // V컬러링 스트림 URL 가져오기
    console.log(`🔍 Attempting to get V컬러링 stream URL for video: ${videoId}`);
    const streamResult = await autoLoginClient.getVcoloringStreamUrl(videoId);
    
    if (!streamResult.success) {
      logger.flo.error('Failed to get V컬러링 stream URL', { videoId, error: streamResult.error });
      console.error(`❌ V컬러링 stream URL failed for video ${videoId}:`, streamResult.error);
      return new NextResponse(streamResult.error || 'Failed to get stream URL', { status: 500 });
    }

    if (!streamResult.streamUrl) {
      logger.flo.error('No stream URL in V컬러링 response', { videoId });
      console.error(`❌ No stream URL found for video ${videoId}`);
      return new NextResponse('Stream URL not found', { status: 404 });
    }

    console.log(`✅ V컬러링 stream URL obtained successfully for video: ${videoId}`);
    logger.flo.info('V컬러링 stream URL obtained', { videoId });

    // HLS 매니페스트 가져오기
    const manifestResponse = await fetch(streamResult.streamUrl, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
        'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!manifestResponse.ok) {
      logger.flo.error('Failed to fetch HLS manifest', { videoId, status: manifestResponse.status });
      return new NextResponse('Failed to fetch video manifest', { status: 500 });
    }

    const manifestContent = await manifestResponse.text();
    console.log(`📄 V컬러링 HLS manifest fetched for video: ${videoId}`);

    // M3U8 매니페스트의 상대 경로들을 프록시 경로로 변환
    const baseUrl = streamResult.streamUrl.substring(0, streamResult.streamUrl.lastIndexOf('/'));
    const modifiedManifest = manifestContent.replace(
      /^(?!#|http)(.*\.m3u8)$/gm,
      `/api/flo/vcoloring/stream/${videoId}/manifest/$1`
    );

    console.log(`🔧 V컬러링 manifest paths converted to proxy for video: ${videoId}`);

    // Content-Type을 HLS manifest로 설정하여 반환
    return new NextResponse(modifiedManifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type'
      }
    });

  } catch (error) {
    const resolvedParams = await context.params;
    const { id: videoId } = resolvedParams;
    
    logger.flo.error('V컬러링 stream error', { videoId, error });
    console.error(`❌ V컬러링 stream error for video ${videoId}:`, error);
    
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

// Export handlers directly (no JSON wrapper)
export const GET = getVcoloringStreamData;
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