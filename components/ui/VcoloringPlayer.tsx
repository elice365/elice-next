'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { FLO_ERROR_MESSAGES } from '@/utils/flo';
import { recordFloError, monitorProblematicTrack } from '@/utils/flo/errorTracking';
import Hls from 'hls.js';

interface VcoloringPlayerProps {
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  onClose: () => void;
  autoplay?: boolean;
}

const VcoloringPlayer: React.FC<VcoloringPlayerProps> = ({
  videoId,
  title,
  artist,
  thumbnail,
  onClose,
  autoplay = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // 시간 포맷팅 함수
  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // HLS 정리 함수
  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
      logger.flo.debug('HLS instance destroyed', {});
    }
  }, []);

  // V컬러링 스트림 로드 및 재생
  const loadAndPlay = useCallback(async (videoId: string): Promise<void> => {
    if (!videoRef.current) throw new Error('Video ref not available');

    const video = videoRef.current;
    const proxyUrl = `/api/flo/vcoloring/stream/${videoId}`;
    
    logger.flo.debug('Starting HLS setup', { videoId, proxyUrl });
    console.log(`🎥 Starting V컬러링 HLS playback for video: ${videoId}`);
    
    // 기존 HLS 인스턴스 정리
    cleanupHls();
    
    try {
      if (Hls.isSupported()) {
        // HLS.js 사용 (대부분의 브라우저)
        console.log('🔧 Using HLS.js for playback');
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5, // 버퍼 홀 허용 범위 증가
          startPosition: -1,
          startLevel: -1,
          autoStartLoad: true,
          capLevelToPlayerSize: false,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = false;
          }
        });
        
        hlsRef.current = hls;
        
        // HLS 이벤트 핸들러
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          logger.flo.debug('HLS media attached');
          console.log('📎 HLS media attached');
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          logger.flo.debug('HLS manifest parsed');
          console.log('📄 HLS manifest parsed successfully');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          // bufferSeekOverHole 오류는 무시 (자동 복구됨)
          if (data.details === 'bufferSeekOverHole') {
            console.log('⚠️ Buffer seek over hole detected, auto-recovering...');
            return;
          }
          
          // bufferStalled 오류도 일반적으로 자동 복구됨
          if (data.details === 'bufferStalled') {
            console.log('⚠️ Buffer stalled, waiting for data...');
            return;
          }
          
          // 실제 오류가 있을 때만 로깅
          if (data.type !== undefined && data.details !== undefined) {
            console.error('❌ HLS error:', 
              `Type: ${data.type}`,
              `Details: ${data.details}`,
              `Fatal: ${data.fatal}`
            );
            
            // 오류 추적 시스템에 기록
            recordFloError(
              videoId,
              title,
              `HLS_${data.type}`,
              data.details,
              {
                artist,
                fatal: data.fatal,
                type: data.type
              }
            );
            
            // Love Is Like 비디오 모니터링
            if (title.toLowerCase().includes('love is like')) {
              monitorProblematicTrack('love is like', artist);
            }
          }
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('네트워크 오류 발생, 재시도 중...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('미디어 오류 발생, 복구 시도 중...');
                hls.recoverMediaError();
                break;
              default:
                setError('스트리밍 오류가 발생했습니다');
                setIsPlaying(false);
                setIsLoading(false);
                break;
            }
          }
        });
        
        // 비디오 엘리먼트에 HLS 연결
        hls.attachMedia(video);
        
        // 매니페스트 로드
        hls.loadSource(proxyUrl);
        
        // 매니페스트 파싱 완료 후 재생
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('HLS loading timeout'));
          }, 30000);
          
          const onManifestParsed = () => {
            clearTimeout(timeoutId);
            hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            hls.off(Hls.Events.ERROR, onError);
            resolve();
          };
          
          const onError = (event: any, data: any) => {
            if (data.fatal) {
              clearTimeout(timeoutId);
              hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
              hls.off(Hls.Events.ERROR, onError);
              reject(new Error(`HLS fatal error: ${data.details}`));
            }
          };
          
          hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          hls.on(Hls.Events.ERROR, onError);
        });
        
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari의 네이티브 HLS 지원
        console.log('🍎 Using Safari native HLS support');
        video.src = proxyUrl;
        
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Video loading timeout'));
          }, 30000);
          
          const cleanup = () => {
            clearTimeout(timeoutId);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
          };
          
          const onCanPlay = () => {
            cleanup();
            resolve();
          };
          
          const onError = () => {
            cleanup();
            reject(new Error('Video loading failed'));
          };
          
          video.addEventListener('canplay', onCanPlay, { once: true });
          video.addEventListener('error', onError, { once: true });
          video.load();
        });
        
      } else {
        throw new Error('HLS not supported in this browser');
      }
      
      // 비디오 재생 시작
      logger.flo.debug('Starting video playback');
      await video.play();
      logger.flo.info('Video playback started successfully');
      console.log(`✅ V컬러링 HLS playback started successfully for video: ${videoId}`);
      
    } catch (error) {
      logger.flo.error('LoadAndPlay failed', { videoId, error });
      console.error(`❌ HLS LoadAndPlay failed for video ${videoId}:`, error);
      cleanupHls();
      throw error;
    }
  }, [cleanupHls]);

  // 재생/일시정지 토글
  const togglePlayPause = useCallback(async () => {
    logger.flo.debug('Toggle play/pause clicked', {
      isPlaying,
      hasVideoRef: !!videoRef.current
    });
    
    if (!videoRef.current) {
      logger.flo.warn('Cannot toggle: missing video ref');
      return;
    }

    try {
      if (isPlaying) {
        logger.flo.info('Pausing video');
        videoRef.current.pause();
      } else {
        logger.flo.info('Starting to play video');
        setIsLoading(true);
        await loadAndPlay(videoId);
        logger.flo.info('Load and play completed in toggle');
      }
    } catch (error) {
      logger.flo.error('Toggle play/pause error', { error });
      setError('재생 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, videoId, loadAndPlay]);

  // 진행률 바 클릭
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    try {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      logger.flo.debug('Progress updated via click', { newTime, percentage });
    } catch (error) {
      logger.flo.error('Progress click error', { error });
    }
  }, [duration]);

  // 볼륨 바 클릭
  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newVolume = Math.round(percentage * 100);
    
    try {
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = percentage;
      }
      logger.flo.debug('Volume updated via click', { newVolume, percentage });
    } catch (error) {
      logger.flo.error('Volume click error', { error });
    }
  }, []);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      logger.flo.debug('Video metadata loaded', { duration: video.duration });
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
    };

    const handleEnded = () => {
      logger.flo.info('Video ended');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const errorCode = target.error?.code;
      const errorMessage = target.error?.message || 'Unknown error';
      
      logger.flo.error('Video error occurred', { 
        event: e, 
        errorCode, 
        errorMessage,
        videoId 
      });
      
      console.error(`❌ Video playback error (Video: ${videoId}):`, {
        code: errorCode,
        message: errorMessage
      });
      
      // 사용자 친화적인 오류 메시지
      let userMessage = '비디오 재생 중 오류가 발생했습니다';
      if (errorCode === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
        userMessage = '지원되지 않는 비디오 형식입니다';
      } else if (errorCode === 3) { // MEDIA_ERR_DECODE
        userMessage = '비디오 파일이 손상되었습니다';
      } else if (errorCode === 2) { // MEDIA_ERR_NETWORK
        userMessage = '네트워크 오류로 재생할 수 없습니다';
      } else if (errorCode === 1) { // MEDIA_ERR_ABORTED
        userMessage = '재생이 중단되었습니다';
      }
      
      setError(userMessage);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      logger.flo.debug('Video can play', {});
      setIsLoading(false);
    };

    const handleWaiting = () => {
      logger.flo.debug('Video waiting/buffering', {});
      setIsLoading(true);
    };

    const handlePlay = () => {
      logger.flo.info('Video play event fired', {});
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      logger.flo.debug('Video pause event fired', {});
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoId]);

  // 초기 로드 및 자동 재생
  useEffect(() => {
    if (autoplay && videoRef.current) {
      const startPlayback = async () => {
        try {
          setIsLoading(true);
          await loadAndPlay(videoId);
        } catch (error) {
          logger.flo.error('Auto-play error', { error });
          setError('재생 중 오류가 발생했습니다');
        } finally {
          setIsLoading(false);
        }
      };

      startPlayback();
    }
  }, [videoId, autoplay, loadAndPlay]);

  // 볼륨 설정
  useEffect(() => {
    if (videoRef.current) {
      const targetVolume = isMuted ? 0 : volume / 100;
      videoRef.current.volume = Math.max(0, Math.min(1, targetVolume));
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(100, volume + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 10));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, onClose, volume, duration, toggleMute]);

  // 컴포넌트 언마운트 시 HLS 정리
  useEffect(() => {
    return () => {
      cleanupHls();
    };
  }, [cleanupHls]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-foreground/70">{artist}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-hover transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 비디오 플레이어 */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            className="w-full h-auto max-h-[60vh]"
            poster={thumbnail}
            preload="metadata"
            playsInline
            controlsList="nodownload"
          />
          
          {/* 로딩 오버레이 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* 컨트롤 바 */}
        <div className="space-y-4">
          {/* 진행률 바 */}
          <div className="flex items-center gap-3">
            <span className="text-xs w-12 text-right font-mono text-foreground/70">
              {formatTime(currentTime)}
            </span>
            
            <div 
              className="flex-1 h-2 bg-hover rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <span className="text-xs w-12 font-mono text-foreground/70">
              {formatTime(duration)}
            </span>
          </div>

          {/* 재생 컨트롤 */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors disabled:opacity-50"
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
              )}
            </button>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-hover transition-colors"
                aria-label={isMuted ? "음소거 해제" : "음소거"}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 4L6 8H2v4h4l4 4V4zM14 8l2 2-2 2M16 6l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.776a1 1 0 011.617.776z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div 
                className="w-20 h-2 bg-hover rounded-full cursor-pointer"
                onClick={handleVolumeClick}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-150"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 text-sm text-center px-3 py-2 rounded-lg bg-red-100 text-red-700">
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

export default VcoloringPlayer;