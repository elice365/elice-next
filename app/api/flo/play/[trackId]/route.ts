// FLO 음악 직접 스트리밍 API
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

// 메모리 캐시로 스트림 URL 저장
const streamCache = new Map<string, { url: string, timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

// 만료된 캐시 정리
function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of streamCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      streamCache.delete(key);
    }
  }
}

const handleStreamGet = async (
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) => {
  const { trackId } = await params;
  
  if (!trackId) {
    return NextResponse.json({
      success: false,
      message: 'Track ID required',
      data: null
    }, { status: 400 });
  }

  // 캐시 확인
  let cached = streamCache.get(trackId);
  
  if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
    // 캐시 없거나 만료됨 - FLO API 호출
    logger.info('Getting fresh stream URL', 'FLO', { trackId });
    
    const { FloAuthClient: AutoLoginClient } = await import('@/lib/flo/login');
    const autoLoginClient = new AutoLoginClient();
    const streamResult = await autoLoginClient.getMusicStreamUrl(trackId);
    
    logger.debug('Stream result', 'FLO', { trackId, success: streamResult.success, error: streamResult.error });
    
    if (!streamResult.success || !streamResult.streamUrl) {
      logger.error('Failed to get stream URL', 'FLO', { trackId, error: streamResult.error });
      return NextResponse.json({
        success: false, 
        message: streamResult.error || 'Stream not available',
        data: null
      }, { status: 400 });
    }
    
    // 캐시 저장
    cached = { url: streamResult.streamUrl, timestamp: Date.now() };
    streamCache.set(trackId, cached);
    cleanupExpiredCache();
    
    logger.info('Fresh stream URL cached', 'FLO', { trackId });
  }

  // Range 요청 헤더 처리 (오디오 시킹 지원)
  const requestHeaders = new Headers();
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    requestHeaders.set('Range', rangeHeader);
  }

  try {
    // FLO URL에서 직접 스트리밍 프록시
    const response = await fetch(cached.url, {
      headers: requestHeaders
    });
    
    if (!response.ok) {
      logger.error('Stream fetch failed', 'FLO', { trackId, status: response.status });
      return NextResponse.json({
        success: false,
        message: 'Stream fetch failed',
        data: null
      }, { status: response.status });
    }

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    if (response.headers.get('Content-Length')) {
      headers.set('Content-Length', response.headers.get('Content-Length')!);
    }
    
    if (response.headers.get('Content-Range')) {
      headers.set('Content-Range', response.headers.get('Content-Range')!);
    }

    // 직접 스트리밍 반환
    return new NextResponse(response.body, {
      status: rangeHeader ? 206 : 200,
      headers
    });
  } catch (error) {
    logger.error('Stream proxy error', 'FLO', { trackId, error });
    return NextResponse.json({
      success: false,
      message: 'Stream proxy error',
      data: null
    }, { status: 500 });
  }
};

export const GET = handleStreamGet;