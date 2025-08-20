// FLO 앨범 트랙 조회 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult } from '@/types/api/api';
import { logger } from '@/utils/logger';

const handleAlbumTracksGet = async (
  req: NextRequest,
  context: any
): Promise<APIResult<any>> => {
  try {
    const albumId = context?.params?.albumId;
    const { searchParams } = new URL(req.url);
    const mixYn = searchParams.get('mixYn') || 'N';
    
    if (!albumId) {
      return {
        success: false,
        message: '앨범 ID가 필요합니다'
      };
    }

    logger.flo.info('Album tracks request', { albumId, mixYn });

    // FLO API 헤더 설정
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://music.flo.co.kr/',
      'Origin': 'https://music.flo.co.kr'
    };

    // 실제 FLO API URL
    const apiUrl = `https://api.music-flo.com/meta/v1/album/${albumId}/track?mixYn=${mixYn}`;
    
    logger.flo.debug('FLO API request', { url: apiUrl });
    
    const response = await request.get(apiUrl, { headers });
    
    logger.flo.debug('FLO API response', { 
      hasData: !!response.data 
    });

    if (!response.data) {
      return {
        success: false,
        message: '앨범 트랙 정보를 가져올 수 없습니다',
        data: null
      };
    }

    const responseCode = (response.data as any)?.code;
    if (responseCode === '2000000' || responseCode === undefined) {
      const rawData = (response.data as any).data || {};
      
      // 트랙 데이터 처리
      const tracks = (rawData.list || []).map((track: any) => ({
        id: track.id,
        name: track.name || track.title || '제목 없음',
        trackNumber: track.trackNo || track.trackNumber || 1,
        trackNo: String(track.trackNo || track.trackNumber || 1),
        playTime: track.playTime || track.duration || '',
        titleYn: track.titleYn || 'N',
        representationArtist: {
          id: track.representationArtist?.id || track.artistId || 0,
          name: track.representationArtist?.name || track.artistName || 'Unknown Artist'
        },
        artistList: track.artistList || [],
        album: {
          id: parseInt(albumId),
          title: rawData.album?.title || '',
          imgList: rawData.album?.imgList || []
        }
      }));

      return {
        success: true,
        message: '앨범 트랙 조회 성공',
        data: {
          success: true,
          data: {
            albumId: parseInt(albumId),
            album: rawData.album || {},
            totalCount: tracks.length,
            list: tracks
          }
        }
      };
    } else {
      return {
        success: false,
        message: `앨범 트랙 조회 실패: ${(response.data as any)?.message || '알 수 없는 오류'}`,
        data: null
      };
    }

  } catch (error) {
    logger.flo.error('Album tracks error', error);
    return {
      success: false,
      message: '앨범 트랙 조회 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handleAlbumTracksGet, { auth: false });