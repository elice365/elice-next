// FLO 멀티 트랙 서치 컴포넌트 - 여러 곡을 한 번에 검색
'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { 
  FloMultiSearchRequest, 
  FloMultiSearchResponse, 
  FloMultiSearchStatusResponse, 
  FloMultiSearchResult,
  FloSearchTrackResult
} from '@/types/flo/flo';
import { FLO_SEARCH_CONFIG } from '@/constants/flo/api';
import TrackTable from '../TrackTable';
import apiUtils from '@/lib/api';
import { logger } from '@/utils/logger';
import { FLO_ERROR_MESSAGES } from '@/utils/flo';

interface MultiSearchState {
  loading: boolean;
  searchId: string | null;
  status: 'IDLE' | 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  results: FloSearchTrackResult[];
  error: string | null;
}

interface MultiSearchProps {
  onClose?: () => void;
  className?: string;
}

const MultiSearch: React.FC<MultiSearchProps> = ({ onClose, className = "" }) => {
  const [trackText, setTrackText] = useState('');
  const [searchState, setSearchState] = useState<MultiSearchState>({
    loading: false,
    searchId: null,
    status: 'IDLE',
    progress: 0,
    results: [],
    error: null
  });
  
  const pollingRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 멀티 서치 시작
  const handleStartSearch = useCallback(async () => {
    if (!trackText.trim()) return;

    // 입력값 검증
    const tracks = trackText.trim().split('\n').filter(line => line.trim());
    if (tracks.length === 0) {
      setSearchState(prev => ({ ...prev, error: '검색할 곡 정보를 입력해주세요' }));
      return;
    }

    setSearchState({
      loading: true,
      searchId: null,
      status: 'STARTED',
      progress: 0,
      results: [],
      error: null
    });

    try {
      logger.flo.info('Multi search started', { trackCount: tracks.length });

      // 멀티 서치 API 호출
      const request: FloMultiSearchRequest = { trackText: trackText.trim() };
      const response = await apiUtils.post<FloMultiSearchResponse>('/api/flo/search/multi', request);

      if (response.success && response.data?.data?.searchId) {
        setSearchState(prev => ({
          ...prev,
          searchId: response.data!.data.searchId,
          status: response.data!.data.status as any
        }));

        // 상태 폴링 시작
        startPolling(response.data.data.searchId);
      } else {
        setSearchState(prev => ({
          ...prev,
          loading: false,
          status: 'FAILED',
          error: response.message || FLO_ERROR_MESSAGES.SEARCH_FAILED
        }));
      }
    } catch (error) {
      logger.flo.error('Multi search start error', error);
      setSearchState(prev => ({
        ...prev,
        loading: false,
        status: 'FAILED',
        error: FLO_ERROR_MESSAGES.SEARCH_FAILED
      }));
    }
  }, [trackText]);

  // 상태 폴링 시작
  const startPolling = useCallback((searchId: string) => {
    let attempts = 0;
    const maxAttempts = FLO_SEARCH_CONFIG.MULTI_SEARCH_MAX_WAIT_TIME / FLO_SEARCH_CONFIG.MULTI_SEARCH_POLLING_INTERVAL;

    const poll = async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        setSearchState(prev => ({
          ...prev,
          loading: false,
          status: 'FAILED',
          error: FLO_ERROR_MESSAGES.SEARCH_TIMEOUT
        }));
        return;
      }

      try {
        const response = await apiUtils.get<FloMultiSearchStatusResponse>(
          `/api/flo/search/multi/${searchId}/status`
        );

        if (response.success && response.data?.data) {
          const statusData = response.data.data;
          
          setSearchState(prev => ({
            ...prev,
            status: statusData.status as any,
            progress: statusData.progress || prev.progress
          }));

          if (statusData.status === 'COMPLETED') {
            // 결과 조회
            await fetchResults(searchId);
          } else if (statusData.status === 'FAILED') {
            setSearchState(prev => ({
              ...prev,
              loading: false,
              error: statusData.message || FLO_ERROR_MESSAGES.SEARCH_FAILED
            }));
          } else {
            // 계속 폴링
            pollingRef.current = setTimeout(poll, FLO_SEARCH_CONFIG.MULTI_SEARCH_POLLING_INTERVAL);
          }
        } else {
          // 상태 확인 실패
          pollingRef.current = setTimeout(poll, FLO_SEARCH_CONFIG.MULTI_SEARCH_POLLING_INTERVAL);
        }
      } catch (error) {
        logger.flo.error('Multi search polling error', error);
        pollingRef.current = setTimeout(poll, FLO_SEARCH_CONFIG.MULTI_SEARCH_POLLING_INTERVAL);
      }
    };

    // 첫 번째 폴링 시작
    pollingRef.current = setTimeout(poll, FLO_SEARCH_CONFIG.MULTI_SEARCH_POLLING_INTERVAL);
  }, []);

  // 결과 조회
  const fetchResults = useCallback(async (searchId: string) => {
    try {
      const response = await apiUtils.get<FloMultiSearchResult>(
        `/api/flo/search/multi/${searchId}/result`
      );

      if (response.success && response.data?.data) {
        setSearchState(prev => ({
          ...prev,
          loading: false,
          status: 'COMPLETED',
          results: response.data!.data.results,
          progress: 100
        }));

        logger.flo.info('Multi search completed', {
          searchId,
          totalCount: response.data.data.totalCount,
          processedCount: response.data.data.processedCount,
          failedCount: response.data.data.failedCount
        });
      } else {
        setSearchState(prev => ({
          ...prev,
          loading: false,
          status: 'FAILED',
          error: FLO_ERROR_MESSAGES.SEARCH_FAILED
        }));
      }
    } catch (error) {
      logger.flo.error('Multi search result fetch error', error);
      setSearchState(prev => ({
        ...prev,
        loading: false,
        status: 'FAILED',
        error: FLO_ERROR_MESSAGES.SEARCH_FAILED
      }));
    }
  }, []);

  // 검색 취소
  const handleCancel = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }
    
    setSearchState({
      loading: false,
      searchId: null,
      status: 'IDLE',
      progress: 0,
      results: [],
      error: null
    });
  }, []);

  // 검색 결과를 TrackTable용 포맷으로 변환
  const convertedTracks = useMemo(() => {
    return searchState.results
      .filter(result => result.found && result.track)
      .map(result => ({
        ...result.track!,
        playTime: result.track!.playTime || '0:00',
        _originalQuery: result.originalQuery,
        _confidence: result.track!.confidence
      }));
  }, [searchState.results]);

  // 가상의 앨범 객체 생성 (TrackTable에 필요)
  const virtualAlbum = useMemo(() => ({
    id: 0,
    title: '멀티 검색 결과',
    imgList: [],
    releaseYmd: '',
    genreStyle: '',
    albumTypeStr: '',
    albumType: '',
    representationArtist: { id: 0, name: '다양한 아티스트' },
    artistList: []
  }), []);

  // 예제 텍스트 설정
  const handleSetExample = useCallback(() => {
    const exampleText = `태연 - 사계
방탄소년단 - 소우주
아이유 - 밤편지
뉴진스 - Hype Boy
임영웅 - 무지개`;
    
    setTrackText(exampleText);
    textareaRef.current?.focus();
  }, []);

  // 컴포넌트 언마운트 시 폴링 정리
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
      {/* 헤더 */}
      <div className="border-b border-border/50 bg-card">
        <div className="flex justify-between items-start sm:items-center p-3 sm:p-4 gap-2">
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              멀티 트랙 검색
            </h2>
            <p className="text-[10px] sm:text-xs text-foreground/60">
              여러 곡을 한 번에 검색 (한 줄에 하나씩)
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
              aria-label="멀티 검색 창 닫기"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-foreground">
              검색할 곡 목록
            </label>
            <button
              onClick={handleSetExample}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md border border-border hover:bg-hover transition-colors text-foreground self-start xs:self-auto"
            >
              예제 보기
            </button>
          </div>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={trackText}
              onChange={(e) => setTrackText(e.target.value)}
              placeholder={`아티스트 - 곡명 형식으로 입력\n\n예시:\n태연 - 사계\n방탄소년단 - 소우주\n아이유 - 밤편지`}
              rows={6}
              disabled={searchState.loading}
              className="w-full p-2 sm:p-3 border border-border rounded-lg bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none text-xs sm:text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              style={{
                minHeight: '100px',
                lineHeight: '1.5'
              }}
            />
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-card rounded px-1.5 sm:px-2 py-0.5">
              <span className="text-[10px] sm:text-xs text-foreground/60">
                {trackText.trim().split('\n').filter(line => line.trim()).length}곡
              </span>
            </div>
          </div>
        </div>

        {/* 진행 상태 */}
        {searchState.loading && (
          <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs sm:text-sm text-foreground">
                  {searchState.status === 'STARTED' && '검색 시작 중...'}
                  {searchState.status === 'PROCESSING' && '검색 진행 중...'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-primary">
                {searchState.progress}%
              </span>
            </div>
            
            <div className="relative w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${searchState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {searchState.error && (
          <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
              {searchState.error}
            </p>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          {!searchState.loading ? (
            <button
              onClick={handleStartSearch}
              disabled={!trackText.trim()}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-primary text-white rounded-lg transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm"
            >
              검색 시작
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm"
            >
              검색 취소
            </button>
          )}
        </div>
      </div>

      {/* 결과 영역 */}
      {searchState.status === 'COMPLETED' && searchState.results.length > 0 && (
        <div className="border-t border-border/50 bg-gradient-to-b from-background to-card/50">
          <div className="p-3 sm:p-6">
            <div className="mb-3 sm:mb-6">
              <h3 className="text-sm sm:text-xl font-bold text-foreground flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span>🎵</span>
                  <span>검색 결과</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-sm bg-blue-50 text-blue-600 border border-blue-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium">
                    찾은 곡: {convertedTracks.length}
                  </span>
                  {searchState.results.some(r => !r.found) && (
                    <span className="text-[10px] sm:text-sm bg-red-50 text-red-600 border border-red-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium">
                      실패: {searchState.results.filter(r => !r.found).length}
                    </span>
                  )}
                </div>
              </h3>
            </div>
            
            {/* 찾은 트랙이 있으면 TrackTable 사용 */}
            {convertedTracks.length > 0 ? (
              <TrackTable
                album={virtualAlbum}
                tracks={convertedTracks}
                onAddToPlaylist={(track) => {
                  logger.flo.info('Add to playlist', { track });
                }}
                onAddToMyList={(track) => {
                  logger.flo.info('Add to my list', { track });
                }}
              />
            ) : null}

            {/* 찾지 못한 트랙 목록 */}
            {searchState.results.some(r => !r.found) && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <h4 className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 mb-2 sm:mb-3">검색 실패 목록</h4>
                <div className="space-y-1 sm:space-y-2">
                  {searchState.results
                    .filter(r => !r.found)
                    .map((result, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-red-600 dark:text-red-400 font-medium truncate">
                          {result.originalQuery}
                        </span>
                        <span className="text-red-500 dark:text-red-300 text-[10px] sm:text-xs flex-shrink-0">
                          {result.error || '검색 결과 없음'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSearch;
