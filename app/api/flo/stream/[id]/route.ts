// 음악 트랙 스트리밍 프록시 엔드포인트 (보안을 위한 URL 숨김)
import { NextRequest, NextResponse } from 'next/server';
import { FloAuthClient as AutoLoginClient } from '@/lib/flo/login';
import { FLO_ERRORS } from '@/constants/flo/play';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackId } = await context.params;
    
    if (!trackId) {
      return NextResponse.json({
        success: false,
        message: '트랙 ID가 필요합니다'
      }, { status: 400 });
    }

    // FLO 스트림 URL 직접 가져오기 (HTTP 호출 대신 내부 로직 사용)
    const autoLoginClient = new AutoLoginClient();
    console.log(`🔍 Attempting to get stream URL for track: ${trackId}`);
    
    const streamResult = await autoLoginClient.getMusicStreamUrl(trackId);
    console.log('📡 Stream result:', {
      success: streamResult.success,
      hasStreamUrl: !!streamResult.streamUrl,
      error: streamResult.error
    });
    
    if (!streamResult.success || !streamResult.streamUrl) {
      console.error(`❌ Failed to get stream URL for track ${trackId}:`, streamResult.error);
      return NextResponse.json({
        success: false,
        message: streamResult.error || FLO_ERRORS.STREAM_UNAVAILABLE
      }, { status: 404 });
    }

    console.log(`✅ Stream URL obtained successfully for track: ${trackId}`);

    // 실제 스트림 URL로 프록시 요청
    const headers: Record<string, string> = {
      'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
      'Accept': '*/*'
    };

    // Range 헤더가 있으면 추가
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    // 실제 스트림 데이터를 프록시 (URL 노출 방지)
    const upstreamUrl = streamResult.streamUrl;
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
        'Accept': '*/*',
        ...(rangeHeader && { 'Range': rangeHeader })
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: '스트림 데이터를 가져올 수 없습니다'
      }, { status: response.status });
    }

    // 응답 헤더 설정
    const responseHeaders = new Headers();
    // 원본 콘텐츠 타입 추출 및 정규화 (모바일 호환성)
    const upstreamType = (response.headers.get('Content-Type') || '').toLowerCase();
    const urlLower = upstreamUrl.toLowerCase();
    let normalizedType = upstreamType;
    const looksLikeM4A = urlLower.endsWith('.m4a') || upstreamType.includes('m4a') || upstreamType.includes('mp4') || upstreamType.includes('aac');
    if (!normalizedType || normalizedType.includes('application/octet-stream') || looksLikeM4A) {
      // 대부분 AAC in MP4 컨테이너
      normalizedType = 'audio/mp4';
    }
    responseHeaders.set('Content-Type', normalizedType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Content-Disposition', 'inline');
    
    // Content-Length와 Content-Range 헤더 전달
    if (response.headers.get('Content-Length')) {
      responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
    }
    if (response.headers.get('Content-Range')) {
      responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
    }

    // 스트림 데이터를 클라이언트로 전달 (실제 URL 숨김)
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('음악 트랙 프록시 오류:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '프록시 오류'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    }
  });
}
