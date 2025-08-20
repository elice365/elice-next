// V컬러링 재생 API 엔드포인트 (별도 경로)
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { request } from '@/lib/fetch';
import { APIResult, AuthInfo } from '@/types/api';
import { 
  FLO_API_CONFIG,
  DEFAULT_IMAGE_PATH 
} from '@/constants/flo/api';

// V컬러링 재생 데이터 가져오기
async function getVcoloringPlayData(
  req: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const url = new URL(req.url);
    const selectedVideoId = url.searchParams.get('selectedVideoId');
    
    if (!id) {
      return {
        success: false,
        message: 'V컬러링 큐레이션 ID가 필요합니다',
        data: null
      };
    }

    // V컬러링 큐레이션 및 선택된 비디오 데이터 가져오기
    let apiUrl = `https://api.music-flo.com/personal/v1/curations/vcoloring/${id}`;
    if (selectedVideoId) {
      apiUrl += `?selectedVideoId=${selectedVideoId}`;
    }
    
    console.log('V컬러링 재생 API 호출:', apiUrl);

    const response = await request.get(apiUrl, {
      headers: {
        'User-Agent': FLO_API_CONFIG.USER_AGENT,
        ...FLO_API_CONFIG.HEADERS,
      }
    });
    
    console.log('V컬러링 재생 API 응답:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      fullResponse: JSON.stringify(response.data, null, 2)
    });

    const data = response.data;
    const curationData = data?.data || {};
    const videoList = curationData.list || [];
    
    // 선택된 비디오 찾기 (selectedVideoId가 있는 경우)
    let selectedVideo = null;
    if (selectedVideoId) {
      selectedVideo = videoList.find((video: any) => video.id === parseInt(selectedVideoId));
      console.log('선택된 비디오 검색:', {
        selectedVideoId,
        selectedVideoIdInt: parseInt(selectedVideoId),
        videoListLength: videoList.length,
        videoIds: videoList.map((v: any) => v.id),
        foundVideo: !!selectedVideo,
        selectedVideoData: selectedVideo ? JSON.stringify(selectedVideo, null, 2) : null
      });
    }
    
    // 스트리밍 정보가 있으면 직접 반환 (기존 API 방식과 동일)
    if (selectedVideoId && selectedVideo) {
      const streamingInfo = await getVideoStreamingInfo(selectedVideo, id);
      if (streamingInfo && streamingInfo.videoUrl) {
        // 프록시 URL 생성 (보안을 위해 실제 스트리밍 URL 숨김)
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const proxyUrl = `${protocol}://${host}/api/flo/stream/${selectedVideo.id}`;
        
        // FLO API와 동일한 응답 형식으로 반환
        return {
          success: true,
          message: 'V컬러링 재생 데이터를 성공적으로 가져왔습니다',
          data: {
            code: "2000000",
            data: {
              url: proxyUrl, // 프록시 URL 사용
              quality: streamingInfo.quality || "720p",
              freeYn: streamingInfo.freeYn || "Y",
              fullYn: streamingInfo.fullYn || "Y", 
              mediaRatingType: streamingInfo.mediaRatingType || "ALL",
              videoType: streamingInfo.videoType || "VCOLORING",
              sttToken: streamingInfo.sttToken || null,
              signature: streamingInfo.signature || null,
              nonce: streamingInfo.nonce || null,
              customCode: 0,
              customDefaultMsg: "성공하였습니다.",
              customMsg: "SUCCESS"
            },
            traceId: `STR${Date.now()}`
          }
        };
      }
    }

    // 큐레이션 정보와 비디오 리스트 반환 (선택된 비디오가 없는 경우)
    const result = {
      curation: {
        id: curationData.id,
        title: curationData.title || 'V컬러링 큐레이션',
        totalCount: videoList.length
      },
      selectedVideo: selectedVideo ? await getVideoStreamingInfo(selectedVideo, id) : null,
      videoList: videoList.map((video: any) => ({
        id: video.id,
        title: video.videoNm,
        playTime: video.playTm,
        mediaRating: video.mediaRatingTypeStr,
        artist: video.representationArtist?.name || video.artistList?.[0]?.name || 'Unknown Artist',
        thumbnail: getVideoThumbnail(video),
        popularity: video.videoPopularity || 0
      }))
    };

    return {
      success: true,
      message: 'V컬러링 재생 데이터를 성공적으로 가져왔습니다',
      data: result
    };

  } catch (error) {
    const resolvedParams = await context.params;
    console.error(`V컬러링 재생 API 오류 (ID: ${resolvedParams.id}):`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'V컬러링 재생 데이터를 가져오는데 실패했습니다',
      data: null
    };
  }
}

// 비디오 스트리밍 정보 가져오기 (실제 FLO 스트리밍 API 사용)
async function getVideoStreamingInfo(selectedVideo: any, curationId: string) {
  try {
    const videoId = selectedVideo.id;
    
    // 실제 FLO 스트리밍 API 엔드포인트 사용
    const streamingUrl = `https://api.music-flo.com/stream/v1/videos/${videoId}/watch/url?quality=720p`;
    
    // FLO 앱에서 사용하는 실제 헤더들
    const floHeaders = {
      'Host': 'api.music-flo.com',
      'x-gm-dvc-disp-nm': 'aVBob25l', // iPhone 디바이스명 (Base64)
      'x-gm-os-version': '26.0',
      'Authorization': 'FLO NjA3N2FlMGI4YWE5Njc3ZmU2ZTM5NTM1ZTEwNDYyOGM=', // FLO 토큰
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

    let streamingData = null;
    
    try {
      console.log(`FLO 스트리밍 URL 호출: ${streamingUrl}`);
      const response = await request.get(streamingUrl, {
        headers: floHeaders
      });
      
      if (response.data && response.data.code === '2000000' && response.data.data && response.data.data.url) {
        streamingData = response.data;
        console.log(`FLO 스트리밍 데이터 성공`, JSON.stringify(streamingData, null, 2));
      }
    } catch (error) {
      console.log(`FLO 스트리밍 API 실패: ${streamingUrl}`, error);
    }

    const baseVideoInfo = {
      id: selectedVideo.id,
      title: selectedVideo.videoNm,
      playTime: selectedVideo.playTm,
      mediaRating: selectedVideo.mediaRatingTypeStr,
      artist: selectedVideo.representationArtist?.name || selectedVideo.artistList?.[0]?.name || 'Unknown Artist',
      thumbnail: getVideoThumbnail(selectedVideo),
      agencyId: selectedVideo.agencyId,
      // 원본 비디오 정보의 모든 필드들
      allVideoFields: Object.keys(selectedVideo).reduce((acc: any, key) => {
        acc[key] = selectedVideo[key];
        return acc;
      }, {}),
    };

    if (streamingData) {
      // 스트리밍 데이터에서 URL 추출
      const streamingInfo = streamingData.data || {};
      return {
        ...baseVideoInfo,
        // FLO API 응답 구조에 맞춰 URL 추출
        videoUrl: streamingInfo.url || null,  // 메인 HLS URL
        streamingUrl: streamingInfo.url || null,  // 동일한 URL을 streamingUrl로도 설정
        hlsUrl: streamingInfo.url || null,  // HLS URL
        dashUrl: null,  // DASH는 제공되지 않는 것 같음
        quality: streamingInfo.quality || '720p',
        freeYn: streamingInfo.freeYn || 'N',
        fullYn: streamingInfo.fullYn || 'N',
        mediaRatingType: streamingInfo.mediaRatingType || 'ALL',
        videoType: streamingInfo.videoType || 'VCOLORING',
        // 스트리밍 토큰 정보
        sttToken: streamingInfo.sttToken || null,
        signature: streamingInfo.signature || null,
        nonce: streamingInfo.nonce || null,
        // 스트리밍 응답의 모든 필드들
        streamingFields: streamingInfo
      };
    } else {
      // 스트리밍 데이터를 찾지 못한 경우 기본 정보만 반환
      return {
        ...baseVideoInfo,
        videoUrl: null,
        streamingUrl: null,
        hlsUrl: null,
        dashUrl: null,
        streamingFields: null,
        errorMessage: '스트리밍 URL을 찾을 수 없습니다. FLO 서비스에서 해당 비디오가 스트리밍을 지원하지 않거나 추가 인증이 필요할 수 있습니다.'
      };
    }
  } catch (error) {
    console.error('스트리밍 정보 가져오기 실패:', error);
    return {
      id: selectedVideo.id,
      title: selectedVideo.videoNm,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 비디오 썸네일 이미지 추출
function getVideoThumbnail(video: any): string {
  if (video.thumbnailImageList && video.thumbnailImageList.length > 0) {
    // 350px 크기 선호, 없으면 가장 큰 이미지
    const preferred = video.thumbnailImageList.find((img: any) => img.size === 350);
    if (preferred) return preferred.url;
    
    const sorted = video.thumbnailImageList.sort((a: any, b: any) => b.size - a.size);
    return sorted[0]?.url || DEFAULT_IMAGE_PATH;
  }
  
  // representationArtist 이미지 사용
  if (video.representationArtist?.imgList && video.representationArtist.imgList.length > 0) {
    const artistImg = video.representationArtist.imgList.find((img: any) => img.size === 350);
    if (artistImg) return artistImg.url;
    
    return video.representationArtist.imgList[0]?.url || DEFAULT_IMAGE_PATH;
  }
  
  return DEFAULT_IMAGE_PATH;
}

// Export handlers
export const GET = handler(getVcoloringPlayData, {
  auth: false, // V컬러링 데이터는 인증 없이 접근 가능
  limit: true
});