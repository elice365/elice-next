// FLO 검색 입력 컴포넌트 - 실시간 자동완성 기능 포함 (최적화)
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { FloAutocompleteResponse, FloAutocompleteSection } from '@/types/flo/flo';
import { FLO_SEARCH_CONFIG } from '@/constants/flo/api';
import apiUtils from '@/lib/api';
import { logger } from '@/utils/logger';
import { getSearchInputClass, getIconSizeClass } from '@/utils/flo/responsive';

interface SearchInputProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (keyword: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = memo(({
  placeholder = "아티스트, 곡, 앨범, 가사 검색...",
  initialValue = "",
  onSearch,
  onClear,
  disabled = false,
  autoFocus = false,
  className = ""
}) => {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<FloAutocompleteSection[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>();
  const fetchControllerRef = useRef<AbortController | null>(null);

  // 모바일 체크 및 input 위치 업데이트
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const updateInputPosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setInputPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    checkMobile();
    updateInputPosition();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', updateInputPosition);
    window.addEventListener('scroll', updateInputPosition);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', updateInputPosition);
      window.removeEventListener('scroll', updateInputPosition);
    };
  }, []);

  // 자동완성 요청 함수 (최적화: AbortController 추가)
  const fetchSuggestions = useCallback(async (keyword: string) => {
    if (keyword.length < FLO_SEARCH_CONFIG.AUTOCOMPLETE_MIN_LENGTH) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 이전 요청 취소
    fetchControllerRef.current?.abort();
    fetchControllerRef.current = new AbortController();
    
    setLoading(true);
    
    // 모바일에서 input 위치 업데이트
    if (inputRef.current && isMobile) {
      const rect = inputRef.current.getBoundingClientRect();
      setInputPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left,
        width: rect.width
      });
    }

    try {
      logger.flo.debug('Fetching autocomplete suggestions', { keyword });

      const response = await apiUtils.get<FloAutocompleteResponse>(`/api/flo/search/autocomplete?keyword=${encodeURIComponent(keyword)}`);


      if (response.success && response.data?.data?.list) {
        const suggestionsList = response.data.data.list;
        setSuggestions(suggestionsList);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else if (response.success && response.data?.code === '2000000' && response.data?.data) {
        const dataContent = response.data.data as any;
        if (dataContent.list) {
          setSuggestions(dataContent.list);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      logger.flo.error('Autocomplete fetch error', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  // 디바운스된 자동완성 요청
  const debouncedFetchSuggestions = useCallback((keyword: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(keyword);
    }, FLO_SEARCH_CONFIG.AUTOCOMPLETE_DEBOUNCE_TIME);
  }, [fetchSuggestions]);

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.trim()) {
      // 자동완성 요청 (300ms 디바운스)
      debouncedFetchSuggestions(newValue.trim());
      
      // 실시간 검색은 따로 처리하지 않음 (자동완성만 표시)
      // 사용자가 엔터를 누르거나 제안 항목을 클릭할 때만 검색 실행
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      // onClear는 지우기 버튼을 누를 때만 호출하도록 변경
      // 타이핑 중에 값이 비었을 때는 호출하지 않음
    }
  };

  // 검색 실행
  const handleSearch = (searchKeyword?: string) => {
    const keyword = searchKeyword || value.trim();
    if (keyword) {
      onSearch(keyword);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // 지우기
  const handleClear = () => {
    setValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    // 모든 제안 항목을 평면화
    const allSuggestions = suggestions.flatMap(section =>
      section.list.map(item => ({ ...item, sectionType: section.type }))
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          const selected = allSuggestions[selectedIndex];
          setValue(selected.text);
          handleSearch(selected.text);
        } else {
          handleSearch();
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 제안 항목 클릭 처리
  const handleSuggestionClick = (suggestion: { text: string; url?: string }) => {
    if (suggestion.url) {
      // 바로가기 URL이 있는 경우 (향후 구현)
      logger.flo.info('Shortcut clicked', { url: suggestion.url });
    }

    setValue(suggestion.text);
    handleSearch(suggestion.text);
  };

  // 외부 클릭 시 제안 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 컴포넌트 언마운트 시 cleanup (최적화)
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      fetchControllerRef.current?.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ overflow: 'visible' }}>
      {/* 검색 입력 필드 */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
          <svg
            className={`${getIconSizeClass('md')} text-foreground/50`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim()) {
              fetchSuggestions(value.trim());  // 즉시 자동완성 표시
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`${getSearchInputClass()} pl-8 sm:pl-10 pr-8 sm:pr-12 w-full`}
        />

        {/* 지우기 버튼 또는 로딩 스피너 */}
        <div className="absolute inset-y-0 right-2.5 sm:right-3 flex items-center">
          {loading ? (
            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground/60 rounded-full animate-spin" />
          ) : value ? (
            <button
              onClick={handleClear}
              className="text-foreground/50 hover:text-foreground transition-colors p-1"
              disabled={disabled}
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* 자동완성 드롭다운 - 모바일에서는 fixed 포지셔닝 사용 */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="rounded-lg shadow-2xl animate-fade-in"
          style={{ 
            position: isMobile ? 'fixed' : 'absolute',
            zIndex: 2147483647, // 최대 z-index 값
            left: isMobile ? `${inputPosition.left}px` : '0',
            width: isMobile ? `${inputPosition.width}px` : 'auto',
            right: isMobile ? 'auto' : '0',
            top: isMobile ? `${inputPosition.top + 4}px` : 'calc(100% + 4px)',
            maxHeight: isMobile ? 'min(280px, 50vh)' : 'min(400px, calc(100vh - 200px))',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(10px)'
          }}>
            
            <div>
          {suggestions.map((section, sectionIndex) => (
            <div key={`${section.type}-${sectionIndex}`}>
              {/* 섹션 헤더 */}
              {sectionIndex > 0 && <div className="h-px bg-white/5 mx-4" />}
              <div className="px-4 py-2 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">
                {section.type === 'KEYWORD' ? '추천 검색어' : '바로가기'}
              </div>

              {/* 섹션 항목들 - 네이티브 앱 스타일 */}
              {section.list && section.list.length > 0 && section.list.map((item, itemIndex) => {
                const globalIndex = suggestions.slice(0, sectionIndex).reduce((acc, s) => acc + s.list.length, 0) + itemIndex;
                const isSelected = globalIndex === selectedIndex;

                return (
                  <button
                    key={`${item.text}-${itemIndex}`}
                    onClick={() => handleSuggestionClick(item)}
                    className={`
                      w-full px-4 py-3 text-left 
                      active:bg-white/10
                      transition-all duration-100
                      flex items-center gap-3
                      ${isSelected ? 'bg-white/5' : ''}
                    `}
                    style={{
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {/* 아이콘 */}
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/5">
                      <svg 
                        className="w-3.5 h-3.5 text-foreground/40" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                      </svg>
                    </div>

                    {/* 텍스트 */}
                    <span className="text-[14px] text-foreground font-normal flex-1 leading-normal">
                      {item.text}
                    </span>

                    {/* 바로가기 화살표 */}
                    {item.url && (
                      <svg 
                        className="w-4 h-4 text-foreground/20 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
