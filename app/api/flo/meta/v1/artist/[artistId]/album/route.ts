// FLO 아티스트 앨범 조회 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult } from '@/types/api/api';
import { logger } from '@/utils/logger';

const handleArtistAlbumsGet = async (
  req: NextRequest,
  context: any
): Promise<APIResult<any>> => {
  try {
    const artistId = context?.params?.artistId;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '50';
    const sortType = searchParams.get('sortType') || 'RECENT';
    const roleType = searchParams.get('roleType') || 'RELEASE';
    
    if (!artistId) {
      return {
        success: false,
        message: '아티스트 ID가 필요합니다'
      };
    }

    logger.flo.info('Artist albums request', { 
      artistId,
      page,
      size,
      sortType,
      roleType
    });

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
    const apiUrl = `https://api.music-flo.com/meta/v1/artist/${artistId}/album?page=${page}&roleType=${roleType}&size=${size}&sortType=${sortType}`;
    
    logger.flo.debug('FLO API request', { url: apiUrl });
    
    const response = await request.get(apiUrl, { headers });
    
    logger.flo.debug('FLO API response', { 
      hasData: !!response.data 
    });

    if (!response.data) {
      return {
        success: false,
        message: '아티스트 앨범 정보를 가져올 수 없습니다',
        data: null
      };
    }

    const responseCode = (response.data as any)?.code;
    if (responseCode === '2000000' || responseCode === undefined) {
      const rawData = (response.data as any).data || {};
      
      // 앨범 데이터 처리
      const albums = (rawData.list || []).map((album: any) => ({
        id: album.id,
        title: album.title || album.name || '제목 없음',
        releaseYmd: album.releaseYmd || album.releaseDate || '',
        genreStyle: album.genreStyle || album.genre || '',
        albumTypeStr: album.albumTypeStr || album.albumType || '',
        albumType: album.albumType || '',
        trackCount: album.trackCount || null,
        representationArtist: {
          id: album.representationArtist?.id || parseInt(artistId),
          name: album.representationArtist?.name || rawData.artist?.name || 'Unknown Artist'
        },
        artistList: album.artistList || [],
        imgList: album.imgList || []
      }));

      return {
        success: true,
        message: '아티스트 앨범 조회 성공',
        data: {
          success: true,
          data: {
            artistId: parseInt(artistId),
            artist: rawData.artist || {},
            totalCount: rawData.totalCount || albums.length,
            list: albums,
            page: parseInt(page),
            size: parseInt(size)
          }
        }
      };
    } else {
      return {
        success: false,
        message: `아티스트 앨범 조회 실패: ${(response.data as any)?.message || '알 수 없는 오류'}`,
        data: null
      };
    }

  } catch (error) {
    logger.flo.error('Artist albums error', error);
    return {
      success: false,
      message: '아티스트 앨범 조회 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handleArtistAlbumsGet, { auth: false });