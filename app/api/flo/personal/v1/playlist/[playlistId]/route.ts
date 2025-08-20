// FLO 플레이리스트 트랙 조회 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult } from '@/types/api/api';
import { logger } from '@/utils/logger';

const handlePlaylistTracksGet = async (
  req: NextRequest,
  context: any
): Promise<APIResult<any>> => {
  try {
    const playlistId = context?.params?.playlistId;
    const { searchParams } = new URL(req.url);
    const mixYn = searchParams.get('mixYn') || 'N';
    
    if (!playlistId) {
      return {
        success: false,
        message: '플레이리스트 ID가 필요합니다'
      };
    }

    logger.flo.info('Playlist tracks request', { playlistId, mixYn });

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

    // ESALBUM(플레이리스트)의 경우 chartnchannel API 사용
    const apiUrl = `https://api.music-flo.com/chartnchannel/v1/channel/${playlistId}?mixYn=${mixYn}&type=CHNL`;
    
    logger.flo.debug('FLO API request', { url: apiUrl });
    
    const response = await request.get(apiUrl, { headers });
    
    logger.flo.debug('FLO API response', { 
      hasData: !!response.data 
    });

    if (!response.data) {
      return {
        success: false,
        message: '플레이리스트 정보를 가져올 수 없습니다',
        data: null
      };
    }

    const responseCode = (response.data as any)?.code;
    if (responseCode === '2000000' || responseCode === undefined) {
      const rawData = (response.data as any)?.data || response.data || {};
      
      // chartnchannel API는 trackList를 직접 제공
      const trackList = rawData.trackList || rawData.list || [];
      
      logger.flo.debug('Playlist tracks data', { 
        hasTrackList: !!rawData.trackList,
        hasList: !!rawData.list,
        trackCount: trackList.length
      });
      
      // 트랙 데이터 처리
      const tracks = trackList.map((track: any, index: number) => ({
        id: track.id || track.trackId,
        name: track.name || track.title || '제목 없음',
        trackNumber: index + 1,
        trackNo: String(index + 1),
        playTime: track.playTime || track.duration || '',
        titleYn: track.titleYn || 'N',
        representationArtist: {
          id: track.representationArtist?.id || track.artistId || 0,
          name: track.representationArtist?.name || track.artistName || 'Unknown Artist'
        },
        artistList: track.artistList || [],
        album: {
          id: track.album?.id || track.albumId || 0,
          title: track.album?.title || track.albumTitle || '',
          imgList: track.album?.imgList || track.albumImgList || []
        }
      }));

      // 플레이리스트 정보
      const playlistInfo = {
        id: rawData.id || parseInt(playlistId),
        name: rawData.name || rawData.title || '플레이리스트',
        description: rawData.description || '',
        trackCount: rawData.trackCount || tracks.length,
        playTime: rawData.playTime || rawData.duration || '',
        likeCnt: rawData.likeCnt || rawData.likeCount || 0,
        creator: {
          id: rawData.creator?.id || rawData.creatorId || 0,
          name: rawData.creator?.name || rawData.creatorName || 'Unknown'
        },
        imgList: rawData.imgList || []
      };

      return {
        success: true,
        message: '플레이리스트 조회 성공',
        data: {
          success: true,
          data: {
            playlistId: parseInt(playlistId),
            playlist: playlistInfo,
            trackList: tracks,
            totalCount: tracks.length
          }
        }
      };
    } else {
      return {
        success: false,
        message: `플레이리스트 조회 실패: ${(response.data as any)?.message || '알 수 없는 오류'}`,
        data: null
      };
    }

  } catch (error) {
    logger.flo.error('Playlist tracks error', error);
    return {
      success: false,
      message: '플레이리스트 조회 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handlePlaylistTracksGet, { auth: false });