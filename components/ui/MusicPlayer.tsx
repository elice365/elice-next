'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/stores';
import {
  setPlaying,
  setProgress,
  setVolume,
  toggleMute,
  nextTrack,
  previousTrack,
  setError,
  setLoading,
} from '@/stores/slice/music';
import { getImage } from '@/lib/services/flo/api';
import { logger } from '@/utils/logger';
import { recordFloError, monitorProblematicTrack } from '@/utils/flo/errorTracking';

const MusicPlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    volume,
    isMuted,
    error
  } = useAppSelector((state) => state.music);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 시간 포맷팅 함수
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 사용되지 않는 함수 제거 - 이제 프록시 URL을 직접 사용
  // const getStreamUrl = useCallback(...) 제거됨

  // 오디오 로드 및 재생 공통 함수 (메모이제이션)
  const loadAndPlay = useCallback(async (trackId: string): Promise<void> => {
    if (!audioRef.current) throw new Error('Audio ref not available');

    // 프록시 URL 사용하여 실제 FLO URL 노출 방지
    const proxyUrl = `/api/flo/stream/${trackId}`;
    logger.music.debug('Setting audio src', { trackId, proxyUrl });
    console.log(`🎵 Starting music playback for track: ${trackId}`);
    
    const audio = audioRef.current;
    audio.src = proxyUrl;
    
    logger.music.debug('Waiting for audio to be ready');
    
    try {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Audio loading timeout'));
        }, 30000); // 30초 타임아웃
        
        const cleanup = () => {
          clearTimeout(timeoutId);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('loadstart', onLoadStart);
        };
        
        const onCanPlay = () => {
          logger.music.debug('Audio can play - ready to start');
          cleanup();
          resolve();
        };
        
        const onError = (event: Event) => {
          const target = event.target as HTMLAudioElement;
          const errorCode = target.error?.code ?? 0;
          const codeMap: Record<number, string> = {
            1: 'MEDIA_ERR_ABORTED',
            2: 'MEDIA_ERR_NETWORK',
            3: 'MEDIA_ERR_DECODE',
            4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
          };
          const errorMessage = codeMap[errorCode] || 'Unknown audio error';
          
          const logData = { 
            trackId, 
            event, 
            errorCode,
            errorMessage 
          };
          if (errorCode === 1) {
            // Abort during source change or user stop: treat as non-fatal
            logger.music.warn('Audio loading aborted', logData);
          } else {
            logger.music.error(`Audio loading error (code ${errorCode})`, logData);
          }
          
          // 오류 추적 시스템에 기록
          if (currentTrack) {
            recordFloError(
              trackId,
              currentTrack.title,
              'AUDIO_LOAD_ERROR',
              errorMessage,
              {
                artist: currentTrack.artist,
                errorCode,
                url: proxyUrl
              }
            );
            
          // Love Is Like 트랙 모니터링
          if (currentTrack.title.toLowerCase().includes('love is like')) {
            monitorProblematicTrack('love is like', currentTrack.artist);
          }
          }
          
          // Use centralized logger only to avoid duplicate console noise
          cleanup();
          reject(new Error(`Audio loading failed: ${errorMessage}`));
        };
        
        const onLoadStart = () => {
          logger.music.debug('Audio loading started');
        };
        
        audio.addEventListener('canplay', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.addEventListener('loadstart', onLoadStart, { once: true });
        
        audio.load();
      });

      logger.music.debug('Calling audio.play()');
      try {
        await audio.play();
      } catch (err: any) {
        // 모바일 브라우저 자동재생 차단 대응
        const name = err?.name || '';
        const msg = err?.message || '';
        if (name === 'NotAllowedError' || name === 'NotAllowedErr' || /gesture|user/i.test(msg)) {
          logger.music.warn('Autoplay blocked by browser. Await user interaction.');
          throw new Error('AUTOPLAY_BLOCKED');
        }
        throw err;
      }
      logger.music.info('Audio.play() completed');
      console.log(`✅ Music playback started successfully for track: ${trackId}`);
    } catch (error) {
      logger.music.error('LoadAndPlay failed', { trackId, error });
      throw error;
    }
  }, []);

  // 재생/일시정지 토글 (메모이제이션)
  const togglePlayPause = useCallback(async () => {
    logger.music.debug('Toggle play/pause clicked', {
      isPlaying,
      hasCurrentTrack: !!currentTrack,
      hasAudioRef: !!audioRef.current
    });
    
    if (!currentTrack || !audioRef.current) {
      logger.music.warn('Cannot toggle: missing track or audio ref');
      return;
    }

    try {
      if (isPlaying) {
        logger.music.info('Pausing audio');
        audioRef.current.pause();
        // pause 이벤트에서 상태가 자동 업데이트됨
      } else {
        logger.music.info('Starting to play audio');
        dispatch(setLoading(true));
        // 직접 trackId 사용하여 프록시 URL로 재생
        await loadAndPlay(currentTrack.id);
        logger.music.info('Load and play completed in toggle');
        // play 이벤트에서 상태가 자동 업데이트됨
      }
    } catch (error) {
      logger.music.error('Toggle play/pause error', { error });
      dispatch(setError('재생 중 오류가 발생했습니다'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [isPlaying, currentTrack, dispatch, loadAndPlay]);

  // 진행률 바 클릭 (메모이제이션)
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    try {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      dispatch(setProgress((newTime / duration) * 100));
      logger.music.debug('Progress updated via click', { newTime, percentage });
    } catch (error) {
      logger.music.error('Progress click error', { error });
    }
  }, [duration, dispatch]);

  // 볼륨 바 클릭 (메모이제이션)
  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newVolume = Math.round(percentage * 100);
    
    try {
      dispatch(setVolume(newVolume));
      if (audioRef.current) {
        audioRef.current.volume = percentage;
      }
      logger.music.debug('Volume updated via click', { newVolume, percentage });
    } catch (error) {
      logger.music.error('Volume click error', { error });
    }
  }, [dispatch]);

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      logger.music.debug('Audio metadata loaded', { duration: audio.duration });
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const duration = audio.duration;
      setCurrentTime(current);
      if (duration) {
        const progressPercent = (current / duration) * 100;
        dispatch(setProgress(progressPercent));
      }
    };

    const handleEnded = () => {
      logger.music.info('Audio playback ended', {
        currentTrack: currentTrack?.title,
        currentIndex: currentTrack?.id
      });
      
      // 다음 트랙으로 이동
      dispatch(nextTrack());
      
      // nextTrack 액션이 isPlaying을 true로 유지하므로
      // 새로운 currentTrack이 설정되면 useEffect에서 자동 재생됨
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const errorCode = target.error?.code ?? 0;
      const codeMap: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      };
      const errorMessage = codeMap[errorCode] || 'Unknown error';

      // Treat aborted loads as non-fatal during source switches or user pauses
      if (errorCode === 1) {
        logger.music.warn('Audio aborted', {
          errorCode,
          errorMessage,
          currentTrack: currentTrack?.id,
        });
        return;
      }

      logger.music.error(`Audio error occurred (code ${errorCode})`, {
        event: e,
        errorCode,
        errorMessage,
        currentTrack: currentTrack?.id,
      });

      // 사용자 친화적인 오류 메시지
      let userMessage = '오디오 재생 중 오류가 발생했습니다';
      if (errorCode === 4) {
        userMessage = '지원되지 않는 오디오 형식입니다';
      } else if (errorCode === 3) {
        userMessage = '오디오 파일이 손상되었습니다';
      } else if (errorCode === 2) {
        userMessage = '네트워크 오류로 재생할 수 없습니다';
      }

      dispatch(setError(userMessage));
      dispatch(setPlaying(false));
    };

    const handleCanPlay = () => {
      logger.music.debug('Audio can play');
      dispatch(setLoading(false));
    };

    const handleWaiting = () => {
      logger.music.debug('Audio waiting/buffering');
      dispatch(setLoading(true));
    };

    const handlePlay = () => {
      logger.music.info('Audio play event fired');
      dispatch(setPlaying(true));
      dispatch(setLoading(false));
    };

    const handlePause = () => {
      logger.music.info('Audio pause event fired');
      dispatch(setPlaying(false));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [dispatch, currentTrack?.id]);

  // 볼륨 설정
  useEffect(() => {
    if (audioRef.current) {
      const targetVolume = isMuted ? 0 : volume / 100;
      audioRef.current.volume = Math.max(0, Math.min(1, targetVolume));
    }
  }, [volume, isMuted]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            dispatch(previousTrack());
          } else if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            dispatch(nextTrack());
          } else if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch(setVolume(Math.min(100, volume + 10)));
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch(setVolume(Math.max(0, volume - 10)));
          break;
        case 'KeyM':
          e.preventDefault();
          dispatch(toggleMute());
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, dispatch, volume, duration]);

  // 사용자 제스처 내 재생 트리거(모바일 자동재생 차단 회피)
  useEffect(() => {
    const onFloPlay = async (evt: Event) => {
      const ce = evt as CustomEvent<{ trackId?: string }>;
      const targetTrackId = ce.detail?.trackId || currentTrack?.id;
      if (!targetTrackId || !audioRef.current) return;
      try {
        dispatch(setLoading(true));
        // 현재 진행 중인 오디오 초기화 후 바로 재생
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        await loadAndPlay(targetTrackId);
      } catch (error) {
        logger.music.error('Gesture-based play failed', { error, trackId: targetTrackId });
        if (error instanceof Error && error.message === 'AUTOPLAY_BLOCKED') {
          dispatch(setError('모바일 브라우저에서 자동재생이 차단되었습니다. 재생 버튼을 눌러주세요.'));
        } else {
          dispatch(setError('재생 중 오류가 발생했습니다'));
        }
        dispatch(setPlaying(false));
      } finally {
        dispatch(setLoading(false));
      }
    };

    window.addEventListener('flo:play', onFloPlay as EventListener);
    return () => window.removeEventListener('flo:play', onFloPlay as EventListener);
  }, [currentTrack?.id, dispatch, loadAndPlay]);


  // 새 트랙 설정시 자동 재생
  useEffect(() => {
    const startPlayback = async () => {
      logger.music.debug('New track effect triggered', {
        currentTrack: currentTrack?.title,
        currentTrackId: currentTrack?.id,
        isPlaying,
        hasAudioRef: !!audioRef.current
      });
      
      // 자동 재생은 사용자가 재생 상태로 만든 후(또는 다음 트랙으로 넘어갈 때)만 시도
      if (currentTrack && audioRef.current && isPlaying) {
        try {
          logger.music.info('Starting playback for track', { 
            trackId: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist
          });
          dispatch(setLoading(true));
          
          // 현재 재생 중인 오디오 정지
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // 새 트랙 재생
          await loadAndPlay(currentTrack.id);
          logger.music.info('Load and play completed for new track');
        } catch (error) {
          logger.music.error('Auto-play error', { error });
          // 모바일 자동재생 차단의 경우 사용자 안내 메시지 제공
          if (error instanceof Error && error.message === 'AUTOPLAY_BLOCKED') {
            dispatch(setError('모바일 브라우저에서 자동재생이 차단되었습니다. 재생 버튼을 눌러주세요.'));
          } else {
            dispatch(setError('재생 중 오류가 발생했습니다'));
          }
          dispatch(setPlaying(false));
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    startPlayback();
  }, [currentTrack?.id, dispatch, loadAndPlay, isPlaying]); // 트랙 변경시 자동 재생 (isPlaying 조건 포함)

  // 앨범 아트 URL 가져오기 (메모이제이션 및 개선)
  const albumArtUrl = useMemo(() => {
    logger.music.debug('Computing album art URL', {
      hasCurrentTrack: !!currentTrack,
      hasImgList: !!(currentTrack?.imgList),
      imgListLength: currentTrack?.imgList?.length || 0,
      hasAlbumArt: !!currentTrack?.albumArt,
      albumArt: currentTrack?.albumArt
    });

    // 우선순위 1: imgList가 있으면 해당 리스트에서 이미지 선택
    if (currentTrack?.imgList && currentTrack.imgList.length > 0) {
      const imageUrl = getImage(currentTrack.imgList, 80);
      logger.music.debug('Using image from imgList', { imageUrl, imgList: currentTrack.imgList });
      return imageUrl;
    }
    
    // 우선순위 2: albumArt URL이 있고 유효한 URL인 경우 사용
    if (currentTrack?.albumArt && currentTrack.albumArt !== '/images/default-album.jpg') {
      logger.music.debug('Using provided albumArt URL', { albumArt: currentTrack.albumArt });
      return currentTrack.albumArt;
    }
    
    // 우선순위 3: 기본 이미지 사용
    const defaultUrl = '/images/default-album.jpg';
    logger.music.debug('Using default album image', { defaultUrl });
    return defaultUrl;
  }, [currentTrack]);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 shadow-lg z-50 backdrop-blur-sm"
      style={{ 
        background: 'var(--player-bg)',
        borderTop: '1px solid var(--player-border)',
        boxShadow: '0 -4px 12px -1px rgba(0, 0, 0, 0.1)'
      }}
      role="region"
      aria-label="음악 플레이어"
    >
      <audio 
        ref={audioRef}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        aria-hidden="true"
      />
      
      <div className="px-4 py-3">
        {/* 메인 플레이어 영역 */}
        <div className="flex items-center gap-4">
          {/* 앨범 아트 및 트랙 정보 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 flex-shrink-0 bg-card rounded-lg overflow-hidden">
              {albumArtUrl && albumArtUrl !== '/images/default-album.jpg' ? (
                <img
                  src={albumArtUrl}
                  alt={currentTrack?.album || '앨범'}
                  className="w-full h-full object-cover shadow-md"
                  style={{ border: '1px solid var(--border-color)' }}
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    logger.music.warn('Album art failed to load', { src: target.src });
                    // 무한 루프 방지: 이미 기본 이미지인 경우 숨김
                    if (target.src.includes('default-album.jpg')) {
                      target.style.display = 'none';
                      return;
                    }
                    target.src = '/images/default-album.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0zm-3.5-2a1 1 0 100-2 1 1 0 000 2zm-4 4a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 
                className="text-sm font-medium truncate transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                {currentTrack?.title || '트랙을 선택하세요'}
              </h4>
              <p 
                className="text-xs truncate transition-colors opacity-70"
                style={{ color: 'var(--foreground)' }}
              >
                {currentTrack?.artist || '아티스트'}
              </p>
            </div>
          </div>

          {/* 재생 컨트롤 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(previousTrack())}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="이전 곡"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              disabled={!currentTrack || isLoading}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: !currentTrack || isLoading ? 'var(--hover)' : 'var(--button)',
                color: !currentTrack || isLoading ? 'var(--foreground)' : 'var(--button-text)',
                boxShadow: !currentTrack && !isLoading ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isLoading ? (
                <div className="w-5 h-5 animate-spin">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dasharray" values="0 32;16 16;0 32;0 32" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="stroke-dashoffset" values="0;-16;-32;-32" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              ) : isPlaying ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              )}
            </button>

            <button
              onClick={() => dispatch(nextTrack())}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="다음 곡"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* 볼륨 컨트롤 */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleMute())}
              className="p-2 rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={isMuted ? "음소거 해제" : "음소거"}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 4L6 8H2v4h4l4 4V4zM14 8l2 2-2 2M16 6l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.776a1 1 0 011.617.776zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div 
              className="w-20 h-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--hover)' }}
              onClick={handleVolumeClick}
            >
              <div 
                className="h-full rounded-full transition-all duration-150"
                style={{ 
                  width: `${isMuted ? 0 : volume}%`,
                  backgroundColor: 'var(--player-volume-fill)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mt-3 flex items-center gap-3">
          <span 
            className="text-xs w-10 text-right font-mono tabular-nums"
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            {formatTime(currentTime)}
          </span>
          
          <div 
            className="flex-1 h-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-y-125 group"
            style={{ backgroundColor: 'var(--hover)' }}
            onClick={handleProgressClick}
          >
            <div 
              className="h-full rounded-full transition-all duration-150 relative group-hover:shadow-lg"
              style={{ 
                width: `${progress}%`,
                backgroundColor: 'var(--button)',
                boxShadow: progress > 0 ? `0 0 8px rgba(from var(--button) r g b / 0.3)` : 'none'
              }}
            >
              {/* Progress indicator dot */}
              {progress > 0 && (
                <div 
                  className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ 
                    backgroundColor: 'var(--button)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                />
              )}
            </div>
          </div>
          
          <span 
            className="text-xs w-10 font-mono tabular-nums"
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            {formatTime(duration)}
          </span>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div 
            className="mt-2 text-xs text-center px-3 py-2 rounded-lg animate-pulse"
            style={{ 
              backgroundColor: 'var(--admin-badge-danger)',
              color: 'var(--admin-danger)'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
