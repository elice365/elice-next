// HLS 중첩 플레이리스트 프록시 엔드포인트 (index_v.m3u8 등)
import { NextRequest, NextResponse } from 'next/server';

// HLS 중첩 플레이리스트 프록시 처리
async function getPlaylistProxy(
  req: NextRequest,
  context: { params: Promise<{ id: string, playlist: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    const { id, playlist } = resolvedParams;
    
    if (!id || !playlist) {
      return NextResponse.json({
        success: false,
        message: '비디오 ID와 플레이리스트가 필요합니다'
      }, { status: 400 });
    }

    console.log(`플레이리스트 프록시 요청: ${id}/${playlist}`);

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
        
        // 실제 플레이리스트 URL 생성
        const playlistUrl = `${baseUrl}/${playlist}`;
        
        console.log(`실제 플레이리스트 URL: ${playlistUrl}`);
        
        // 플레이리스트 데이터 가져오기
        const playlistResponse = await fetch(playlistUrl, {
          headers: {
            'User-Agent': 'FLO/8.5.1 (kr.co.musicmates.radio; build:20250804153854; iOS 26.0.0) Alamofire/5.8.0',
            'Accept': '*/*'
          }
        });
        
        if (!playlistResponse.ok) {
          throw new Error(`플레이리스트 응답 실패: ${playlistResponse.status}`);
        }
        
        const playlistContent = await playlistResponse.text();
        console.log('플레이리스트 내용:', playlistContent);
        
        // TS 세그먼트 파일들을 프록시 URL로 변경
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const proxyBaseUrl = `${protocol}://${host}/api/flo/stream/${id}`;
        
        const modifiedContent = playlistContent.replace(
          /^(index_v_\d+\.ts)$/gm, 
          (match) => `${proxyBaseUrl}/segment/${match}`
        );
        
        console.log('수정된 플레이리스트:', modifiedContent);
        
        // 수정된 플레이리스트를 반환
        return new NextResponse(modifiedContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-cache'
          }
        });
      }
    }
    
    console.error('플레이리스트 스트리밍 URL 획득 실패');
    return NextResponse.json({
      success: false,
      message: '플레이리스트를 가져올 수 없습니다'
    }, { status: 404 });

  } catch (error) {
    console.error('플레이리스트 프록시 오류:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '플레이리스트 프록시 오류'
    }, { status: 500 });
  }
}

// Export handlers
export const GET = getPlaylistProxy;
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