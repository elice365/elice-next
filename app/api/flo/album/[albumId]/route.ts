// FLO 앨범 상세 정보 API
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { APIResult, AuthInfo } from '@/types/api';
import { request } from '@/lib/fetch';
import { FLO_API_CONFIG } from '@/constants/flo/api';

async function getAlbumData(
  req: NextRequest,
  context: AuthInfo & Record<string, any>
): Promise<APIResult> {
  try {
    const resolvedParams = await context.params;
    const { albumId } = resolvedParams;
    
    if (!albumId) {
      return {
        success: false,
        message: '앨범 ID가 필요합니다',
        data: null
      };
    }

    // FLO 앨범 상세 API 호출
    const albumUrl = `https://api.music-flo.com/meta/v1/album/${albumId}`;
    const tracksUrl = `https://api.music-flo.com/meta/v1/album/${albumId}/track`;
    
    // 병렬로 앨범 정보와 트랙 목록 가져오기
    const [albumResponse, tracksResponse] = await Promise.all([
      request.get(albumUrl, {
        headers: {
          'User-Agent': FLO_API_CONFIG.USER_AGENT,
          ...FLO_API_CONFIG.HEADERS,
        }
      }),
      request.get(tracksUrl, {
        headers: {
          'User-Agent': FLO_API_CONFIG.USER_AGENT,
          ...FLO_API_CONFIG.HEADERS,
        }
      })
    ]);

    // 앨범 데이터 처리
    const albumData = albumResponse?.data as any;
    const tracksData = tracksResponse?.data as any;
    
    const album = albumData?.data || albumData || {};
    const trackList = tracksData?.data?.list || tracksData?.list || [];

    // 응답 형식 맞추기
    const processedAlbum = {
      id: album.id,
      title: album.title,
      imgList: album.imgList || [],
      representationArtist: album.representationArtist || {},
      releaseYmd: album.releaseYmd,
      genreStyle: album.genreStyle,
      albumType: album.albumType,
      trackCount: album.trackCount || trackList.length
    };

    const processedTracks = trackList.map((track: any) => ({
      id: track.id,
      name: track.name,
      trackNumber: track.trackNumber || track.trackNo,
      trackNo: track.trackNo || track.trackNumber,
      playTime: track.playTime || track.playTm || 0, // 원본 숫자 값 그대로 전달
      titleYn: track.titleYn || 'N',
      representationArtist: track.representationArtist || album.representationArtist || {},
      artistList: track.artistList || [],
      album: {
        id: track.album?.id || album.id,
        title: track.album?.title || album.title,
        imgList: track.album?.imgList || track.imgList || album.imgList || []
      }
    }));

    return {
      success: true,
      message: '앨범 정보를 성공적으로 가져왔습니다',
      data: {
        album: processedAlbum,
        tracks: processedTracks
      }
    };

  } catch (error) {
    console.error('Error fetching album data:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '앨범 정보를 가져오는데 실패했습니다',
      data: null
    };
  }
}

// 재생시간 포맷팅 함수
function formatPlayTime(seconds: number): string {
  if (!seconds) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Export handler
export const GET = handler(getAlbumData, {
  auth: false,
  limit: true
});
