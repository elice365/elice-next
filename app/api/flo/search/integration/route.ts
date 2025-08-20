// FLO 통합 검색 API - 곡, 앨범, 아티스트, 플레이리스트, 영상, 가사 통합 검색
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request/index';
import { request } from '@/lib/fetch';
import type { APIResult } from '@/types/api/api';
import { FLO_SEARCH_CONFIG } from '@/constants/flo/api';
import type { 
  FloIntegratedSearchResponse,
  FloSearchSection,
  FloSearchedTrack,
  FloSearchedAlbum,
  FloSearchedArtist,
  FloSearchedPlaylist,
  FloSearchedVideo,
  FloSearchedLyrics
} from '@/types/flo/flo';
import { logger } from '@/utils/logger';

const handleIntegratedSearchGet = async (
  req: NextRequest
): Promise<APIResult<FloIntegratedSearchResponse>> => {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '';
    const queryType = searchParams.get('queryType') || 'system';
    const sortType = searchParams.get('sortType') || 'ACCURACY';
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || FLO_SEARCH_CONFIG.DEFAULT_PAGE_SIZE.toString());
    
    if (!keyword || keyword.trim().length === 0) {
      return {
        success: false,
        message: '검색어가 필요합니다'
      };
    }

    logger.flo.info('Integrated search request', { 
      keyword,
      queryType,
      sortType,
      page,
      size
    });

    // 먼저 세션 없이 기본 헤더로 테스트
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://music.flo.co.kr/',
      'Origin': 'https://music.flo.co.kr'
    };

    // 실제 FLO API URL 사용 (내부 프록시 처리)
    const searchUrl = `https://api.music-flo.com/search/v2/search/integration?keyword=${encodeURIComponent(keyword)}&queryType=${queryType}&sortType=${sortType}`;
    
    console.log('=== FLO Search Request ===');
    console.log('URL:', searchUrl);
    console.log('Headers:', headers);
    console.log('==========================');
    
    const response = await request.get(searchUrl, { headers });
    
    console.log('=== FLO API Response Status ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('================================');

    // 실제 API 응답 구조 로깅
    console.log('=== FLO Search API Raw Response ===');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    console.log('=====================================');

    // LYRICS 섹션 디버깅
    const responseData = (response.data as any).data;
    if (responseData?.list) {
      const lyricsSection = responseData.list.find((section: any) => section.type === 'LYRICS');
      console.log('=== LYRICS Section Debug ===');
      console.log('LYRICS section found:', !!lyricsSection);
      if (lyricsSection) {
        console.log('LYRICS section:', JSON.stringify(lyricsSection, null, 2));
      }
      console.log('All section types:', responseData.list.map((s: any) => s.type));
      console.log('============================');
    }

    logger.flo.info('Integrated search API response', {
      hasData: !!response.data,
      code: (response.data as any)?.code,
      sectionsCount: (response.data as any)?.data?.sections?.length || 0,
      rawDataKeys: Object.keys((response.data as any)?.data || {}),
      hasDataProperty: !!(response.data as any)?.data
    });

    if (!response.data) {
      console.log('No response data received');
      return {
        success: false,
        message: '통합 검색 응답 없음',
        data: null
      };
    }

    const responseCode = (response.data as any)?.code;
    console.log('Response code:', responseCode);
    
    if (responseCode !== '2000000' && responseCode !== undefined) {
      console.log('Unexpected response code:', responseCode);
      // 코드가 다르더라도 데이터가 있으면 처리 시도
    }

    // 응답 데이터 처리 - 실제 FLO API 구조에 맞게 수정
    const rawData = (response.data as any).data || {};
    const sections: FloSearchSection[] = [];

    console.log('=== Processing Search Data ===');
    console.log('rawData keys:', Object.keys(rawData));
    console.log('Main list length:', rawData.list?.length || 0);
    
    // 실제 FLO API 응답 구조 처리
    // rawData.list 배열을 순회하면서 각 섹션 처리
    if (rawData.list && Array.isArray(rawData.list)) {
      console.log('Processing FLO sections:', rawData.list.length);
      
      rawData.list.forEach((section: any, index: number) => {
        console.log(`Processing section ${index}:`, {
          type: section.type,
          style: section.style,
          listLength: section.list?.length || 0
        });
        
        if (section.type && section.list && Array.isArray(section.list)) {
          const processedSection = processFloSection(section, keyword);
          if (processedSection) {
            sections.push(processedSection);
          }
        }
      });
    } else {
      console.log('No list found in rawData, checking alternative structures');
      // 비어있는 결과는 추가하지 않음
    }

    console.log('Final sections count:', sections.length);
    console.log('================================');

    const floResponse: FloIntegratedSearchResponse = {
      success: true,
      data: {
        keyword,
        totalCount: rawData.totalCount || sections.reduce((sum, section) => sum + section.totalCount, 0),
        sections,
        suggestions: rawData.suggestions || []
      },
      message: '검색 성공'
    };

    return {
      success: true,
      message: '통합 검색 결과를 조회했습니다',
      data: floResponse
    };

  } catch (error) {
    logger.flo.error('Integrated search error', error);
    return {
      success: false,
      message: '통합 검색 중 오류가 발생했습니다'
    };
  }
};

export const GET = handler(handleIntegratedSearchGet, { auth: false });

// FLO API 실제 응답 구조에 맞는 처리 함수
function processFloSection(section: any, keyword: string): FloSearchSection | null {
  const sectionType = section.type?.toUpperCase();
  
  console.log(`Processing FLO section type: ${sectionType}`);
  
  switch (sectionType) {
    case 'TRACK':
      return processFloTrackSection(section);
    case 'ALBUM':
      return processFloAlbumSection(section);
    case 'ARTIST':
      return processFloArtistSection(section);
    case 'PLAYLIST':
      return processFloPlaylistSection(section);
    case 'VIDEO':
      return processFloVideoSection(section);
    case 'LYRICS':
      return processFloLyricsSection(section, keyword);
    default:
      console.log(`Unknown section type: ${sectionType}`);
      return null;
  }
}

// FLO 실제 트랙 데이터 처리
function processFloTrackSection(section: any): FloSearchSection {
  const trackList = section.list || [];
  console.log(`Processing ${trackList.length} tracks`);
  
  const tracks: FloSearchedTrack[] = trackList.map((track: any) => {
    console.log('Processing track:', {
      id: track.id,
      name: track.name,
      artistName: track.representationArtist?.name,
      albumTitle: track.album?.title
    });
    
    return {
      id: track.id?.toString() || Math.random().toString(),
      name: track.name || '제목 없음',
      type: 'TRACK',
      playTime: track.playTime || '',
      representationArtist: {
        id: track.representationArtist?.id || 0,
        name: track.representationArtist?.name || 'Unknown Artist'
      },
      artistList: track.artistList || [],
      album: {
        id: track.album?.id || 0,
        title: track.album?.title || '',
        imgList: track.album?.imgList || []
      },
      rank: track.rank,
      popularity: track.popularity
    };
  });

  return {
    type: 'TRACK',
    title: section.style === 'DETAIL' ? '인기곡' : '곡',
    totalCount: section.totalCount || tracks.length,
    list: tracks,  // Changed from items to list
    hasMore: false
  };
}

// FLO 앨범 데이터 처리
function processFloAlbumSection(section: any): FloSearchSection {
  const albumList = section.list || [];
  console.log(`Processing ${albumList.length} albums`);
  
  const albums: FloSearchedAlbum[] = albumList.map((album: any) => {
    console.log('Processing album:', {
      id: album.id,
      title: album.title,
      trackCount: album.trackCount || 'N/A (not provided in search)',
      releaseYmd: album.releaseYmd,
      artistName: album.representationArtist?.name,
      availableFields: Object.keys(album)
    });
    
    return {
      id: album.id?.toString() || Math.random().toString(),
      name: album.title || album.name || '제목 없음',
      type: 'ALBUM',
      title: album.title || album.name || '제목 없음',
      representationArtist: {
        id: album.representationArtist?.id || 0,
        name: album.representationArtist?.name || 'Unknown Artist'
      },
      artistList: album.artistList || [],
      imgList: album.imgList || [],
      releaseYmd: album.releaseYmd || '',
      trackCount: album.trackCount || null // trackCount not provided in search API
    };
  });

  return {
    type: 'ALBUM',
    title: '앨범',
    totalCount: section.totalCount || albums.length,
    list: albums,
    hasMore: false
  };
}

// FLO 아티스트 데이터 처리
function processFloArtistSection(section: any): FloSearchSection {
  const artistList = section.list || [];
  console.log(`Processing ${artistList.length} artists`);
  
  const artists: FloSearchedArtist[] = artistList.map((artist: any) => ({
    id: artist.id?.toString() || Math.random().toString(),
    name: artist.name || '이름 없음',
    type: 'ARTIST',
    artistType: artist.artistType || '',
    imgList: artist.imgList || [],
    albumCount: artist.albumCount || 0,
    trackCount: artist.trackCount || 0,
    followerCount: artist.followerCount
  }));

  return {
    type: 'ARTIST',
    title: '아티스트',
    totalCount: section.totalCount || artists.length,
    list: artists,
    hasMore: false
  };
}

// FLO 플레이리스트 데이터 처리
function processFloPlaylistSection(section: any): FloSearchSection {
  const playlistList = section.list || [];
  console.log(`Processing ${playlistList.length} playlists`);
  
  const playlists: FloSearchedPlaylist[] = playlistList.map((playlist: any) => ({
    id: playlist.id?.toString() || Math.random().toString(),
    name: playlist.name || playlist.title || '제목 없음',
    type: 'PLAYLIST',
    description: playlist.description || '',
    creator: {
      id: playlist.creator?.id || 0,
      name: playlist.creator?.name || 'Unknown Creator'
    },
    imgList: playlist.imgList || [],
    trackCount: playlist.trackCount || 0,
    likeCount: playlist.likeCount || 0,
    playCount: playlist.playCount || 0
  }));

  return {
    type: 'PLAYLIST',
    title: '플레이리스트',
    totalCount: section.totalCount || playlists.length,
    list: playlists,
    hasMore: false
  };
}

// FLO 비디오 데이터 처리
function processFloVideoSection(section: any): FloSearchSection {
  const videoList = section.list || [];
  console.log(`Processing ${videoList.length} videos`);
  
  const videos: FloSearchedVideo[] = videoList.map((video: any) => {
    console.log('Processing video:', {
      id: video.id,
      title: video.title || video.name,
      viewCount: video.viewCount,
      playCount: video.playCount,
      playTm: video.playTm || video.playTime,
      thumbnailCount: video.thumbnailImageList?.length || 0,
      artistName: video.representationArtist?.name,
      rawVideoObject: JSON.stringify(video, null, 2)
    });
    
    return {
      id: video.id?.toString() || Math.random().toString(),
      name: video.name || video.title || '제목 없음',
      type: 'VIDEO',
      title: video.title || video.name || '제목 없음',
      representationArtist: {
        id: video.representationArtist?.id || 0,
        name: video.representationArtist?.name || 'Unknown Artist'
      },
      thumbnailImageList: video.thumbnailImageList || [],
      playTm: video.playTm || video.playTime || '',
      viewCount: video.viewCount || video.playCount || null // viewCount not provided in search API
    };
  });

  return {
    type: 'VIDEO',
    title: '영상',
    totalCount: section.totalCount || videos.length,
    list: videos,
    hasMore: false
  };
}

// FLO 가사 데이터 처리
function processFloLyricsSection(section: any, keyword: string): FloSearchSection {
  const lyricsList = section.list || [];
  console.log(`Processing ${lyricsList.length} lyrics`);
  
  const lyrics: FloSearchedLyrics[] = lyricsList.map((lyric: any) => {
    console.log('Processing lyric:', {
      id: lyric.id,
      name: lyric.name,
      hasLyrics: !!lyric.lyrics,
      albumTitle: lyric.album?.title,
      artistName: lyric.representationArtist?.name
    });
    
    return {
      id: lyric.id?.toString() || Math.random().toString(),
      name: lyric.name || '제목 없음',
      type: 'LYRICS',
      track: {
        id: lyric.id || 0,
        name: lyric.name || '',
        representationArtist: {
          id: lyric.representationArtist?.id || 0,
          name: lyric.representationArtist?.name || 'Unknown Artist'
        },
        album: {
          id: lyric.album?.id || 0,
          title: lyric.album?.title || '',
          imgList: lyric.album?.imgList || []
        }
      },
      lyricText: lyric.lyrics || '', // 실제 FLO API에서는 'lyrics' 속성 사용
      matchedParts: [keyword] // 검색 키워드를 매치된 부분으로 설정
    };
  });

  return {
    type: 'LYRICS',
    title: '가사',
    totalCount: section.totalCount || lyrics.length,
    list: lyrics,
    hasMore: false
  };
}