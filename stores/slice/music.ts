// 음악 재생 관리 스토어
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logger } from '@/utils/logger';

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt?: string;
  imgList?: { size: number; url: string }[];
  // 추가 메타데이터
  genre?: string;
  releaseDate?: string;
  trackNumber?: number;
  url?: string; // 스트리밍 URL 캐싱용
}

export interface MusicState {
  // 현재 재생 중인 트랙
  currentTrack: TrackInfo | null;
  // 재생 상태
  isPlaying: boolean;
  isLoading: boolean;
  // 재생 진행률 (0-100)
  progress: number;
  // 볼륨 (0-100)
  volume: number;
  // 음소거 여부
  isMuted: boolean;
  // 반복 모드 (none, one, all)
  repeatMode: 'none' | 'one' | 'all';
  // 셔플 모드
  isShuffled: boolean;
  // 재생 목록
  playlist: TrackInfo[];
  // 현재 재생 목록에서의 인덱스
  currentIndex: number;
  // 에러 상태
  error: string | null;
  // 성능 최적화를 위한 추가 상태
  lastPlayedAt: number | null; // 마지막 재생 시간 (timestamp)
  playbackHistory: string[]; // 최근 재생한 트랙 ID 목록 (5개 제한)
  crossfadeEnabled: boolean; // 크로스페이드 기능
  equalizerEnabled: boolean; // 이케완라이저 기능
}

const initialState: MusicState = {
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  progress: 0,
  volume: 70,
  isMuted: false,
  repeatMode: 'none',
  isShuffled: false,
  playlist: [],
  currentIndex: -1,
  error: null,
  lastPlayedAt: null,
  playbackHistory: [],
  crossfadeEnabled: false,
  equalizerEnabled: false,
};

export const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    // 트랙 설정 (개선된 버전)
    setCurrentTrack: (state, action: PayloadAction<TrackInfo>) => {
      const newTrack = action.payload;
      
      // 이전 트랙을 재생 기록에 추가
      if (state.currentTrack && state.currentTrack.id !== newTrack.id) {
        state.playbackHistory = [
          state.currentTrack.id,
          ...state.playbackHistory.filter(id => id !== state.currentTrack!.id).slice(0, 4)
        ];
      }
      
      state.currentTrack = newTrack;
      state.error = null;
      state.lastPlayedAt = Date.now();
    },

    // 재생 상태 설정
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },

    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // 진행률 업데이트 (개선된 버전)
    setProgress: (state, action: PayloadAction<number>) => {
      const newProgress = Math.max(0, Math.min(100, action.payload));
      // 진행률이 현저하게 변경된 경우만 업데이트 (성능 최적화)
      if (Math.abs(state.progress - newProgress) > 0.1) {
        state.progress = newProgress;
      }
    },

    // 볼륨 설정
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(100, action.payload));
      if (action.payload > 0) {
        state.isMuted = false;
      }
    },

    // 음소거 토글
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },

    // 반복 모드 변경
    setRepeatMode: (state, action: PayloadAction<'none' | 'one' | 'all'>) => {
      state.repeatMode = action.payload;
    },

    // 셔플 모드 토글
    toggleShuffle: (state) => {
      state.isShuffled = !state.isShuffled;
    },

    // 재생 목록 설정
    setPlaylist: (state, action: PayloadAction<{ tracks: TrackInfo[]; startIndex?: number }>) => {
      state.playlist = action.payload.tracks;
      state.currentIndex = action.payload.startIndex ?? 0;
      if (state.playlist.length > 0 && state.currentIndex >= 0) {
        state.currentTrack = state.playlist[state.currentIndex];
      }
    },

    // 다음 트랙으로 이동
    nextTrack: (state) => {
      if (state.playlist.length === 0) return;

      if (state.repeatMode === 'one') {
        // 현재 트랙 반복 - progress만 리셋
        state.progress = 0;
        return;
      }

      let nextIndex = state.currentIndex + 1;
      
      if (nextIndex >= state.playlist.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // 재생 중지
          state.isPlaying = false;
          return;
        }
      }

      state.currentIndex = nextIndex;
      state.currentTrack = state.playlist[nextIndex];
      state.progress = 0;
      // 다음 트랙도 자동 재생되도록 isPlaying 유지
      state.isPlaying = true;
    },

    // 이전 트랙으로 이동
    previousTrack: (state) => {
      if (state.playlist.length === 0) return;

      let prevIndex = state.currentIndex - 1;
      
      if (prevIndex < 0) {
        if (state.repeatMode === 'all') {
          prevIndex = state.playlist.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      state.currentIndex = prevIndex;
      state.currentTrack = state.playlist[prevIndex];
      state.progress = 0;
    },

    // 특정 트랙으로 이동
    jumpToTrack: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.playlist.length) {
        state.currentIndex = index;
        state.currentTrack = state.playlist[index];
        state.progress = 0;
      }
    },

    // 에러 설정 (개선된 버전)
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.isLoading = false;
        state.isPlaying = false;
        // Structured logging instead of direct console.error
        logger.music.warn('Music Player Error', {
          error: action.payload,
          currentTrack: state.currentTrack?.id,
          timestamp: Date.now()
        });
      }
    },

    // 상태 초기화
    reset: (state) => {
      Object.assign(state, initialState);
    },

    // 새로운 기능들
    // 크로스페이드 토글
    toggleCrossfade: (state) => {
      state.crossfadeEnabled = !state.crossfadeEnabled;
    },

    // 이퀄라이저 토글
    toggleEqualizer: (state) => {
      state.equalizerEnabled = !state.equalizerEnabled;
    },

    // 재생 기록 지우기
    clearPlaybackHistory: (state) => {
      state.playbackHistory = [];
    },

    // 트랙 정보 업데이트 (스트리밍 URL 캐싱 등)
    updateTrackInfo: (state, action: PayloadAction<{ id: string; updates: Partial<TrackInfo> }>) => {
      const { id, updates } = action.payload;
      
      // 현재 트랙 업데이트
      if (state.currentTrack && state.currentTrack.id === id) {
        state.currentTrack = { ...state.currentTrack, ...updates };
      }
      
      // 플레이리스트에서 해당 트랙 업데이트
      const trackIndex = state.playlist.findIndex(track => track.id === id);
      if (trackIndex !== -1) {
        state.playlist[trackIndex] = { ...state.playlist[trackIndex], ...updates };
      }
    },

    // 성능 최적화된 진행률 업데이트 (throttled)
    setProgressThrottled: (state, action: PayloadAction<number>) => {
      const newProgress = Math.max(0, Math.min(100, action.payload));
      // 0.5% 이상 변화가 있을 때만 업데이트
      if (Math.abs(state.progress - newProgress) >= 0.5) {
        state.progress = newProgress;
      }
    },
  },
});

export const {
  setCurrentTrack,
  setPlaying,
  setLoading,
  setProgress,
  setVolume,
  toggleMute,
  setRepeatMode,
  toggleShuffle,
  setPlaylist,
  nextTrack,
  previousTrack,
  jumpToTrack,
  setError,
  reset,
  // 새로운 액션들
  toggleCrossfade,
  toggleEqualizer,
  clearPlaybackHistory,
  updateTrackInfo,
  setProgressThrottled,
} = musicSlice.actions;

export default musicSlice.reducer;
