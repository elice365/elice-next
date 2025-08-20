// FLO 스트림 서비스

import { request } from '@/lib/fetch';
import { FLO_CONFIG, FLO_ERRORS } from '@/constants/flo/play';
import type { FloStreamResponse, FloAuthConfig } from '@/types/flo/play';

/**
 * FLO 스트림 URL 가져오기
 */
export async function getFloStreamUrl(
  resourceId: string,
  accessToken: string,
  config: FloAuthConfig
): Promise<FloStreamResponse> {
  try {
    const params = new URLSearchParams({
      bitrate: FLO_CONFIG.STREAM_PARAMS.BITRATE,
      flacYn: FLO_CONFIG.STREAM_PARAMS.FLAC_YN,
      hlsYn: FLO_CONFIG.STREAM_PARAMS.HLS_YN,
      resourceType: FLO_CONFIG.STREAM_PARAMS.RESOURCE_TYPE,
      skipDislikeYn: FLO_CONFIG.STREAM_PARAMS.SKIP_DISLIKE_YN
    });

    const url = `${FLO_CONFIG.API_BASE_URL}${FLO_CONFIG.ENDPOINTS.STREAM_URL}/${resourceId}/listen/url?${params.toString()}`;

    const headers = {
      'Host': 'api.music-flo.com',
      'Cache-Control': 'no-store',
      'User-Agent': FLO_CONFIG.HEADERS.USER_AGENT,
      'x-gm-device-id': config.deviceId,
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Connection': 'keep-alive',
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${config.apiKey}`,
      'Accept-Language': FLO_CONFIG.HEADERS.ACCEPT_LANGUAGE,
      'x-gm-app-name': FLO_CONFIG.HEADERS.APP_NAME,
      'x-gm-device-model': config.deviceModel,
      'x-gm-app-version': config.appVersion,
      'x-gm-os-version': config.osVersion,
      'Accept': '*/*',
      'Content-Type': FLO_CONFIG.HEADERS.CONTENT_TYPE,
      'x-gm-os-type': FLO_CONFIG.HEADERS.OS_TYPE,
      'x-gm-seq': '219',
      'Accept-Encoding': FLO_CONFIG.HEADERS.ACCEPT_ENCODING,
      'x-gm-access-token': accessToken
    };

    const response = await request.get(url, { headers });

    const streamResponseData = response.data as any;
    if (streamResponseData?.code === '2000000') {
      const streamData = streamResponseData.data;
      return {
        success: true,
        data: {
          url: streamData.url || streamData.streamUrl,
          streamUrl: streamData.url || streamData.streamUrl,
          bitrate: FLO_CONFIG.STREAM_PARAMS.BITRATE,
          duration: streamData.duration || 0,
          format: streamData.format || 'aac'
        }
      };
    }

    return {
      success: false,
      error: (response.data as any)?.message || FLO_ERRORS.STREAM_UNAVAILABLE
    };
  } catch (error) {
    console.error('FLO stream URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : FLO_ERRORS.STREAM_UNAVAILABLE
    };
  }
}

/**
 * 음원 정보 가져오기
 */
export async function getTrackInfo(
  trackId: string,
  accessToken: string,
  config: FloAuthConfig
) {
  try {
    const headers = {
      'Host': 'api.music-flo.com',
      'Cache-Control': 'no-store',
      'User-Agent': FLO_CONFIG.HEADERS.USER_AGENT,
      'x-gm-device-id': config.deviceId,
      'x-gm-dvc-disp-nm': 'aVBob25l',
      'Content-MD5': 'd41d8cd98f00b204e9800998ecf8427e',
      'Connection': 'keep-alive',
      'x-gm-request-time': Date.now().toString(),
      'Authorization': `FLO ${config.apiKey}`,
      'Accept-Language': FLO_CONFIG.HEADERS.ACCEPT_LANGUAGE,
      'x-gm-app-name': FLO_CONFIG.HEADERS.APP_NAME,
      'x-gm-device-model': config.deviceModel,
      'x-gm-app-version': config.appVersion,
      'x-gm-os-version': config.osVersion,
      'Accept': '*/*',
      'Content-Type': FLO_CONFIG.HEADERS.CONTENT_TYPE,
      'x-gm-os-type': FLO_CONFIG.HEADERS.OS_TYPE,
      'x-gm-seq': '220',
      'Accept-Encoding': FLO_CONFIG.HEADERS.ACCEPT_ENCODING,
      'x-gm-access-token': accessToken
    };

    const response = await request.get(
      `${FLO_CONFIG.API_BASE_URL}/meta/v1/track/${trackId}`,
      { headers }
    );

    const trackResponseData = response.data as any;
    if (trackResponseData?.code === '2000000') {
      const track = trackResponseData.data.track || trackResponseData.data;
      return {
        success: true,
        data: {
          id: track.id,
          title: track.name,
          artist: track.artistList?.map((a: any) => a.name).join(', '),
          album: track.album?.title,
          duration: track.trackLength,
          image: track.album?.imgList?.[0]?.url
        }
      };
    }

    return {
      success: false,
      error: 'Failed to get track info'
    };
  } catch (error) {
    console.error('FLO track info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get track info'
    };
  }
}