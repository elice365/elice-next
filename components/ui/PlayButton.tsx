'use client';

import React, { useState } from 'react';
import type { FloPlayResponse } from '@/types/flo/play';
import apiUtils from '@/lib/api';
import { logger } from '@/utils/logger';

interface PlayButtonProps {
  // 기본 PlayButton 프로퍼티
  trackId?: string;
  trackTitle?: string;
  artist?: string;
  size?: 'sm' | 'md' | 'lg' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
  onPlay?: (streamUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
  
  // MusicPlayer용 프로퍼티
  isPlaying?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

function PlayButtonComponent({
  trackId,
  trackTitle,
  artist,
  size = 'md',
  variant = 'primary',
  onPlay,
  onError,
  className = '',
  isPlaying: externalIsPlaying,
  isLoading: externalIsLoading,
  onClick
}: Readonly<PlayButtonProps>) {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  
  // 외부에서 제공된 상태가 있으면 사용, 없으면 내부 상태 사용
  const isLoading = externalIsLoading ?? internalIsLoading;
  const isPlaying = externalIsPlaying ?? internalIsPlaying;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    large: 'w-14 h-14'
  };

  const variantClasses = {
    primary: 'bg-[var(--blog-accent)] text-white hover:opacity-90',
    secondary: 'bg-card border border-[var(--border-color)] text-foreground hover:bg-[var(--hover)]',
    minimal: 'bg-transparent text-foreground hover:bg-[var(--hover)]'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    large: 'w-7 h-7'
  };

  // Helper to handle successful or failed play responses
  const handlePlayResponse = (result: FloPlayResponse, tid: string) => {
    if (result.success) {
      logger.flo.info('Track info received, using proxy URL');
      const streamUrl = `/api/flo/stream/${tid}`;

      if (onPlay) {
        // 프록시 URL 사용 (실제 FLO URL 노출 방지)
        onPlay(streamUrl);
      } else {
        // 기본 동작: 프록시 URL로 재생
        playAudio(streamUrl);
      }

      setInternalIsPlaying(true);
      return;
    }

    const error = result.error || 'Failed to get stream URL';
    logger.flo.error('Play failed', { error });

    if (onError) {
      onError(error);
    } else {
      alert(`재생 실패: ${error}`);
    }
  };

  // Helper to handle exceptions from the play request
  const handlePlayError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    logger.flo.error('Play request failed', { error: errorMessage });

    if (onError) {
      onError(errorMessage);
    } else {
      alert(`재생 요청 실패: ${errorMessage}`);
    }
  };

  const handlePlay = async () => {
    if (isLoading) return;

    // 외부 onClick이 제공되면 그것을 사용 (MusicPlayer 컴포넌트용)
    if (onClick) {
      onClick();
      return;
    }

    // trackId가 없으면 기본 동작 불가
    if (!trackId) return;

    setInternalIsLoading(true);
    try {
      logger.flo.info(`Playing track: ${trackId}`);

      const result: FloPlayResponse = await apiUtils.post('/api/flo/play', {
        resource: trackId
      });

      handlePlayResponse(result, trackId);
    } catch (error) {
      handlePlayError(error);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const playAudio = (streamUrl: string) => {
    try {
      // 기존 오디오 중지
      const existingAudio = document.querySelector('audio[data-flo-player]') as HTMLAudioElement;
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.remove();
      }

      // 새 오디오 엘리먼트 생성
      const audio = document.createElement('audio');
      audio.setAttribute('data-flo-player', 'true');
      audio.src = streamUrl;
      audio.controls = true;
      audio.autoplay = true;
      
      // 재생 이벤트 처리
      audio.addEventListener('play', () => {
        setInternalIsPlaying(true);
        console.log('🎵 Audio started playing');
      });
      
      audio.addEventListener('pause', () => {
        setInternalIsPlaying(false);
        console.log('⏸️ Audio paused');
      });
      
      audio.addEventListener('ended', () => {
        setInternalIsPlaying(false);
        audio.remove();
        console.log('✅ Audio playback ended');
      });

      audio.addEventListener('error', (e) => {
        setInternalIsPlaying(false);
        console.error('❌ Audio playback error:', e);
        if (onError) {
          onError('Audio playback failed');
        }
      });

      // DOM에 추가 (숨겨짐)
      audio.style.display = 'none';
      document.body.appendChild(audio);
      
      console.log('🎵 Audio element created and started');
    } catch (error) {
      console.error('❌ Failed to create audio element:', error);
      setInternalIsPlaying(false);
    }
  };

  const stopAudio = () => {
    const audio = document.querySelector('audio[data-flo-player]') as HTMLAudioElement;
    if (audio) {
      audio.pause();
      audio.remove();
    }
    setInternalIsPlaying(false);
  };

  // Extract button icon rendering logic
  let buttonIcon: React.ReactNode;
  if (isLoading) {
    buttonIcon = (
      <div className={`${iconSize[size]} animate-spin`}>
        <svg viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="32"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0 32;16 16;0 32;0 32"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              values="0;-16;-32;-32"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    );
  } else if (isPlaying) {
    buttonIcon = (
      <svg className={iconSize[size]} viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    );
  } else {
    buttonIcon = (
      <svg className={iconSize[size]} viewBox="0 0 24 24" fill="currentColor">
        <polygon points="8,5 19,12 8,19" />
      </svg>
    );
  }

  // Extract button title logic
  let buttonTitle: string;
  if (isLoading) {
    buttonTitle = '로딩 중...';
  } else if (isPlaying) {
    buttonTitle = `정지: ${trackTitle || trackId}`;
  } else {
    buttonTitle = '재생: ' + (trackTitle || trackId) + (artist ? ' - ' + artist : '');
  }

  return (
    <button
      onClick={isPlaying ? stopAudio : handlePlay}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      title={buttonTitle}
    >
      {buttonIcon}
    </button>
  );
}

// Named and default exports
export const PlayButton = PlayButtonComponent;
export default PlayButtonComponent;