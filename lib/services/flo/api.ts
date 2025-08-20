// FLO API 서비스 - 함수형 구현
import type { FloAlbum, FloTrack, FloAlbumResponse, FloTrackResponse, FloApiService } from '@/types/flo';

const BASE_URL = 'https://www.music-flo.com/api/meta/v1/album';

/**
 * 신보 랭킹 앨범 데이터를 가져오는 함수
 */
export const getAlbums = async (): Promise<FloAlbum[]> => {
  try {
    const response = await fetch(`${BASE_URL}/ALL/new/rank?size=20`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: FloAlbumResponse = await response.json();
    
    if (data.code !== '0000') {
      throw new Error(`API error! code: ${data.code}`);
    }
    
    return data.data.popAlbumList || [];
  } catch (error) {
    console.error('Error fetching new rank albums:', error);
    throw error;
  }
};

/**
 * 특정 앨범의 트랙 데이터를 가져오는 함수
 */
export const getTracks = async (albumId: number): Promise<FloTrack[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${albumId}/track`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: FloTrackResponse = await response.json();
    
    if (data.code !== '0000') {
      throw new Error(`API error! code: ${data.code}`);
    }
    
    return data.data.list || [];
  } catch (error) {
    console.error('Error fetching album tracks:', error);
    throw error;
  }
};

/**
 * 이미지 URL 최적화 함수
 */
export const getImage = (imgList: { size: number; url: string }[], size: number = 350): string => {
  if (!imgList || imgList.length === 0) {
    return '/images/default-album.jpg'; // 기본 이미지 경로
  }

  // 목표 크기에 가장 가까운 이미지 찾기
  const sortedImages = imgList
    .filter(img => img.url && img.size > 0)
    .sort((a, b) => Math.abs(a.size - size) - Math.abs(b.size - size));

  return sortedImages[0]?.url || imgList[0]?.url || '/images/default-album.jpg';
};

/**
 * 릴리즈 날짜 포맷팅 함수
 */
export const formatDate = (releaseYmd: string): string => {
  if (!releaseYmd) return '';
  
  try {
    // YYYYMMDD 형식을 YYYY.MM.DD로 변환
    const year = releaseYmd.slice(0, 4);
    const month = releaseYmd.slice(4, 6);
    const day = releaseYmd.slice(6, 8);
    
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('Error formatting release date:', error);
    return releaseYmd;
  }
};

/**
 * FLO API 서비스 객체 (인터페이스 호환성을 위해)
 */
export const floApiService: FloApiService & {
  getImage: typeof getImage;
  formatDate: typeof formatDate;
} = {
  getNewRankAlbums: getAlbums,
  getAlbumTracks: getTracks,
  getImage,
  formatDate,
};

// 기본 export로 서비스 객체 제공
export default floApiService;