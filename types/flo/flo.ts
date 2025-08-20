// FLO 검색 및 멀티 서치 관련 타입 정의

import type { FloImage, FloArtist } from './index';

// === 자동완성 타입 ===
export interface FloAutocompleteItem {
  text: string;
  url?: string;
}

export interface FloAutocompleteSection {
  type: 'KEYWORD' | 'SHORTCUT';
  style?: string;
  list: FloAutocompleteItem[];
}

export interface FloAutocompleteResponse {
  success: boolean;
  data?: {
    code: string;
    data: {
      list: FloAutocompleteSection[];
    };
  };
  message?: string;
}

// === 통합 검색 타입 ===
export interface FloIntegratedSearchRequest {
  keyword: string;
  size?: number;
  page?: number;
}
export interface FloSearchedTrack {
  id: number;
  name: string;
  playTime: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  album: {
    id: number;
    title: string;
    imgList: FloImage[];
  };
  titleYn?: string;
  trackNo?: string;
}

export interface FloSearchedAlbum {
  id: number;
  title: string;
  imgList: FloImage[];
  releaseYmd: string;
  genreStyle: string;
  albumTypeStr: string;
  albumType: string;
  representationArtist: FloArtist;
  artistList: FloArtist[];
  trackCount?: number;
}

export interface FloSearchedArtist {
  id: number;
  name: string;
  imgList: FloImage[];
  genreStyle?: string;
  debutYmd?: string;
  likeCnt?: number;
  fanCnt?: number;
  albumCount?: number;
  trackCount?: number;
}

export interface FloSearchedPlaylist {
  id: number;
  name: string;
  imgList: FloImage[];
  description?: string;
  trackCount?: number;
  playTime?: string;
  likeCnt?: number;
  likeCount?: number;
  updateDt?: string;
  creator?: {
    id: number;
    name: string;
  };
}

export interface FloSearchedVideo {
  id: number;
  title: string;
  imgList: FloImage[];
  thumbnailImageList?: FloImage[];
  playTime: string;
  viewCnt?: number;
  likeCnt?: number;
  artist?: FloArtist;
  representationArtist?: FloArtist;
  uploadDt?: string;
  videoType?: string;
}

export interface FloSearchedLyrics {
  id: number;
  name?: string;
  type?: string;
  trackId: number;
  trackName: string;
  artistName: string;
  lyrics: string;
  lyricText?: string;
  matchedParts?: string[];
  track?: {
    id: number;
    name: string;
    representationArtist: FloArtist;
    album: {
      id: number;
      title: string;
      imgList: FloImage[];
    };
  };
  highlight?: string;
  album?: {
    id: number;
    title: string;
    imgList: FloImage[];
  };
}

export interface FloSearchSection {
  type: 'TRACK' | 'ALBUM' | 'ARTIST' | 'PLAYLIST' | 'VIDEO' | 'LYRICS';
  title: string;
  items?: (FloSearchedTrack | FloSearchedAlbum | FloSearchedArtist | FloSearchedPlaylist | FloSearchedVideo | FloSearchedLyrics)[];
  list?: (FloSearchedTrack | FloSearchedAlbum | FloSearchedArtist | FloSearchedPlaylist | FloSearchedVideo | FloSearchedLyrics)[];
  hasMore: boolean;
  totalCount: number;
}

export interface FloIntegratedSearchResponse {
  success: boolean;
  data?: {
    sections: FloSearchSection[];
    keyword: string;
    totalCount: number;
    suggestions?: string[];
  };
  message?: string;
}

// === 멀티 서치 타입 ===
export interface FloMultiSearchRequest {
  trackText: string;
}

export interface FloSearchTrack extends FloSearchedTrack {
  confidence?: number;
}

export interface FloMultiSearchResponse {
  success: boolean;
  data?: {
    searchId: string;
    status: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    message?: string;
  };
  message?: string;
}

export interface FloMultiSearchStatusResponse {
  success: boolean;
  data?: {
    searchId: string;
    status: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    message?: string;
  };
  message?: string;
}

export interface FloSearchTrackResult {
  originalQuery: string;
  found: boolean;
  track?: FloSearchTrack;
  error?: string;
}

export interface FloMultiSearchResult {
  success: boolean;
  data?: {
    searchId: string;
    results: FloSearchTrackResult[];
    totalCount: number;
    processedCount: number;
    failedCount: number;
  };
  message?: string;
}