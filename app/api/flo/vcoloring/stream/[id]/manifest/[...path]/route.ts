// V컬러링 HLS 서브 매니페스트 프록시 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { autoLoginClient } from '@/lib/flo/login';
import { logger } from '@/utils/logger';

async function getSubManifest(
  req: NextRequest,
  context: { params: Promise<{ id: string, path: string[] }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params;
    const { id: videoId, path } = resolvedParams;
    
    if (!videoId || !path || path.length === 0) {
      logger.flo.error('Missing video ID or manifest path');
      return new NextResponse('Video ID and manifest path are required', { status: 400 });
    }

    const manifestPath = path.join('/');
    console.log(`🎥 Getting V컬러링 sub-manifest for video: ${videoId}, path: ${manifestPath}`);

    // 메인 스트림 URL 가져오기
    const streamResult = await autoLoginClient.getVcoloringStreamUrl(videoId);
    
    if (!streamResult.success || !streamResult.streamUrl) {
      logger.flo.error('Failed to get V컬러링 stream URL for sub-manifest', { videoId });
      return new NextResponse('Failed to get stream URL', { status: 500 });
    }

    // 베이스 URL에서 서브 매니페스트 URL 구성
    const baseUrl = streamResult.streamUrl.substring(0, streamResult.streamUrl.lastIndexOf('/'));
    const subManifestUrl = `${baseUrl}/${manifestPath}`;

    console.log(`🌐 Fetching V컬러링 sub-manifest: ${subManifestUrl}`);

    // 서브 매니페스트 가져오기
    const manifestResponse = await fetch(subManifestUrl, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
        'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!manifestResponse.ok) {
      logger.flo.error('Failed to fetch sub-manifest', { videoId, path: manifestPath, status: manifestResponse.status });
      return new NextResponse('Failed to fetch sub-manifest', { status: 500 });
    }

    const manifestContent = await manifestResponse.text();
    console.log(`📄 V컬러링 sub-manifest fetched for video: ${videoId}, path: ${manifestPath}`);

    // TS 세그먼트 경로들을 프록시 경로로 변환
    const modifiedManifest = manifestContent.replace(
      /^(?!#|http)(.*\.ts)$/gm,
      `/api/flo/vcoloring/stream/${videoId}/segment/$1`
    );

    console.log(`🔧 V컬러링 sub-manifest segments converted to proxy for video: ${videoId}`);

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
    const { id: videoId, path } = resolvedParams;
    
    logger.flo.error('V컬러링 sub-manifest error', { videoId, path, error });
    console.error(`❌ V컬러링 sub-manifest error for video ${videoId}:`, error);
    
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

// Export handlers directly
export const GET = getSubManifest;
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