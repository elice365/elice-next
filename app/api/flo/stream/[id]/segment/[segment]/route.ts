// HLS 세그먼트 프록시 엔드포인트
import { NextRequest, NextResponse } from 'next/server';

// HLS 세그먼트 프록시 처리
async function getSegmentProxy(
  req: NextRequest,
  context: { params: Promise<{ id: string, segment: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    const { id, segment } = resolvedParams;
    
    if (!id || !segment) {
      return NextResponse.json({
        success: false,
        message: '비디오 ID와 세그먼트가 필요합니다'
      }, { status: 400 });
    }

    console.log(`세그먼트 프록시 요청: ${id}/${segment}`);

    // 먼저 실제 스트리밍 URL을 가져와야 함
    const streamingUrl = `https://api.music-flo.com/stream/v1/videos/${id}/watch/url?quality=720p`;
    
    // FLO 앱에서 사용하는 실제 헤더들
    const floHeaders = {
      'Host': 'api.music-flo.com',
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'x-gm-os-version': '26.0',
      'Authorization': 'FLO NjA3N2FlMGI4YWE5Njc3ZmU2ZTM5NTM1ZTEwNDYyOGM=',
      'x-gm-device-id': 'CB1BB79B-98A9-4CD4-A757-5075E4FEBC2F',
      'x-gm-request-time': Date.now().toString(),
      'Content-MD5': '8e050af438f664df2b6c6bad309fbcdc',
      'Accept': '*/*',
      'x-gm-device-model': 'iPhone16,2',
      'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
      'x-gm-app-name': 'FLO',
      'Accept-Language': 'ko-KR;q=1.0, en-KR;q=0.9',
      'x-gm-os-type': 'IOS',
      'x-gm-seq': '41',
      'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json; charset=UTF-8',
      'x-gm-app-version': '8.5.1',
      'x-gm-access-token': 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxODM0MjM5NCIsImdkbSI6eyJjdHQiOiJJRCIsImRubyI6MTEzMDEzOTYwLCJjbm8iOjE5NDEzNzQzLCJpcnQiOiJGTE8iLCJtbm8iOjE4MzQyMzk0LCJtc3QiOm51bGx9LCJpc3MiOiJodHRwczpcL1wvYXBpLm11c2ljbWF0ZXMuY28ua3IiLCJleHAiOjE3NTc3NzA2MzUsImlhdCI6MTc1NTE3ODYzNSwianRpIjoiMDU4YTQ3NGM5ZTQ3NDc5MGFlNTRkNWNjODJhMjg5ZTQifQ.BQHFLa5mFr7QjZgDs-9Hd02_EsSwEq7Mmb4MKTY4nYM'
    };

    // 스트리밍 URL 정보 가져오기
    const streamResponse = await fetch(streamingUrl, {
      headers: floHeaders
    });
    
    if (streamResponse.ok) {
      const streamingData = await streamResponse.json();
      
      if (streamingData && streamingData.code === '2000000' && streamingData.data && streamingData.data.url) {
        const hlsUrl = streamingData.data.url;
        
        // HLS URL에서 베이스 경로 추출
        const baseUrl = hlsUrl.substring(0, hlsUrl.lastIndexOf('/'));
        
        // 실제 세그먼트 URL 생성
        const segmentUrl = `${baseUrl}/${segment}`;
        
        console.log(`실제 세그먼트 URL: ${segmentUrl}`);
        
        // 세그먼트 데이터 가져오기
        const segmentResponse = await fetch(segmentUrl, {
          headers: {
            'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
            'Accept': '*/*'
          }
        });
        
        if (!segmentResponse.ok) {
          throw new Error(`세그먼트 응답 실패: ${segmentResponse.status}`);
        }
        
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
      }
    }
    
    console.error('세그먼트 스트리밍 URL 획득 실패');
    return NextResponse.json({
      success: false,
      message: '세그먼트를 가져올 수 없습니다'
    }, { status: 404 });

  } catch (error) {
    console.error('세그먼트 프록시 오류:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '세그먼트 프록시 오류'
    }, { status: 500 });
  }
}

// Export handlers
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