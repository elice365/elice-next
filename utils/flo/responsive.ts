// FLO 컴포넌트 반응형 디자인 유틸리티
// 공통 반응형 클래스와 헬퍼 함수들

/**
 * 반응형 그리드 클래스 생성
 * 모바일 최적화: 작은 화면에서도 2열 유지
 */
export const getResponsiveGridClass = (type: 'album' | 'artist' | 'video' | 'playlist' | 'general' = 'general') => {
  const baseClasses = {
    // 앨범: 모바일 2열, 태블릿부터 점진적 확장 - 여백 추가
    album: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 md:gap-5 lg:gap-6',
    // 아티스트: 원형 이미지로 3열 시작
    artist: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 sm:gap-3 md:gap-4',
    // 비디오: 가로 비율 고려, 모바일 2열
    video: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5',
    // 플레이리스트: 모바일 2열
    playlist: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4',
    // 일반: 모바일 2열에서 시작
    general: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4'
  };
  
  return baseClasses[type];
};

/**
 * 반응형 갭 클래스
 * 모바일에서 적절한 간격 유지
 */
export const getResponsiveGapClass = () => {
  return 'gap-2 sm:gap-3 md:gap-4 lg:gap-5';
};

/**
 * 카드 컨테이너 반응형 클래스
 */
export const getCardContainerClass = () => {
  return 'bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full';
};

/**
 * 텍스트 크기 반응형 클래스
 * 모바일에서 적절한 크기 유지
 */
export const getResponsiveTextClass = (type: 'title' | 'subtitle' | 'caption' | 'body' = 'body') => {
  const textClasses = {
    title: 'text-sm sm:text-base md:text-lg font-semibold',
    subtitle: 'text-xs sm:text-sm md:text-base',
    caption: 'text-[10px] sm:text-xs md:text-sm',
    body: 'text-xs sm:text-sm md:text-base'
  };
  
  return textClasses[type];
};

/**
 * 패딩 반응형 클래스
 * 모바일에서 컴팩트한 패딩
 */
export const getResponsivePaddingClass = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const paddingClasses = {
    sm: 'p-2.5 sm:p-3 md:p-3.5',  // 앨범 카드용 - 여백 증가
    md: 'p-3 sm:p-3.5 md:p-4',
    lg: 'p-3.5 sm:p-4 md:p-6'
  };
  
  return paddingClasses[size];
};

/**
 * 버튼 반응형 클래스
 * 모바일 최소 44x44px 터치 타겟 보장
 */
export const getResponsiveButtonClass = (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
  const base = 'transition-all duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px]';
  const sizes = 'px-4 py-3 text-sm sm:px-4 sm:py-2.5 sm:text-sm md:text-base';
  
  const variants = {
    primary: 'bg-[var(--blog-accent)] text-white hover:opacity-90',
    secondary: 'bg-background border-2 border-[var(--border-color)] text-foreground hover:bg-[var(--hover)]',
    ghost: 'text-foreground/70 hover:text-foreground hover:bg-[var(--hover)]'
  };
  
  return `${base} ${sizes} ${variants[variant]}`;
};

/**
 * 스크롤 컨테이너 클래스
 * 모바일에서 가로 스크롤 허용
 */
export const getScrollContainerClass = () => {
  return 'overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0';
};

/**
 * 모달/다이얼로그 반응형 클래스
 */
export const getModalClass = () => {
  return 'w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto p-4';
};

/**
 * 검색 입력 반응형 클래스
 * 모바일에서 충분한 높이 보장
 */
export const getSearchInputClass = () => {
  return 'w-full min-h-[44px] px-4 py-3 text-sm sm:px-4 sm:py-2.5 sm:text-base border border-border rounded-lg bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
};

/**
 * 테이블을 모바일 카드로 변환하는 헬퍼
 */
export const isMobileView = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};

/**
 * 반응형 이미지 사이즈 계산
 */
export const getResponsiveImageSize = (type: 'thumbnail' | 'card' | 'hero' = 'card') => {
  const sizes = {
    thumbnail: '(max-width: 640px) 48px, (max-width: 768px) 56px, 64px',
    card: '(max-width: 640px) 140px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px',
    hero: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  };
  
  return sizes[type];
};

/**
 * 반응형 line-clamp 클래스
 */
export const getLineClampClass = (lines: number, responsive: boolean = true) => {
  if (!responsive) {
    return `line-clamp-${lines}`;
  }
  
  // 모바일에서는 1줄, 태블릿부터는 지정된 줄 수
  return lines === 1 
    ? 'line-clamp-1' 
    : `line-clamp-1 sm:line-clamp-${lines}`;
};

/**
 * 컨테이너 최대 너비 클래스
 */
export const getContainerMaxWidth = () => {
  return 'max-w-full sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto';
};

/**
 * 탭 네비게이션 반응형 클래스
 */
export const getTabNavigationClass = () => {
  return 'flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2';
};

/**
 * 탭 버튼 반응형 클래스
 */
export const getTabButtonClass = (isActive: boolean) => {
  const base = 'flex-shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 relative min-w-fit';
  
  const state = isActive
    ? 'bg-background border-2 text-foreground'
    : 'bg-transparent border-2 border-transparent text-foreground/70 hover:bg-background/50 hover:text-foreground';
  
  return `${base} ${state}`;
};

/**
 * 필터 버튼 반응형 클래스
 */
export const getFilterButtonClass = (isActive: boolean) => {
  const base = 'px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 whitespace-nowrap';
  
  const state = isActive
    ? 'border-[var(--blog-accent)] text-white bg-[var(--blog-accent)]'
    : 'border-[var(--border-color)] text-foreground bg-background hover:border-[var(--blog-accent)] hover:bg-[var(--hover)]';
  
  return `${base} ${state}`;
};

/**
 * 헤더 반응형 클래스
 */
export const getHeaderClass = () => {
  return 'w-full px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6';
};

/**
 * 섹션 간격 반응형 클래스
 */
export const getSectionSpacingClass = () => {
  return 'space-y-4 sm:space-y-6 md:space-y-8';
};

/**
 * 플렉스 갭 반응형 클래스
 */
export const getFlexGapClass = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const gapClasses = {
    sm: 'gap-1 sm:gap-2',
    md: 'gap-2 sm:gap-3 md:gap-4',
    lg: 'gap-3 sm:gap-4 md:gap-6'
  };
  
  return gapClasses[size];
};

/**
 * 아이콘 크기 반응형 클래스
 * 모바일에서도 충분히 큰 아이콘
 */
export const getIconSizeClass = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'w-5 h-5 sm:w-4 sm:h-4',
    md: 'w-6 h-6 sm:w-5 sm:h-5',
    lg: 'w-7 h-7 sm:w-6 sm:h-6'
  };
  
  return sizeClasses[size];
};

/**
 * 모바일 터치 버튼 클래스 (원형 버튼용)
 * Apple HIG 최소 44x44px 준수
 */
export const getMobileTouchButtonClass = (variant: 'primary' | 'secondary' = 'primary') => {
  if (variant === 'primary') {
    return 'w-11 h-11 sm:w-10 sm:h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full';
  }
  return 'w-10 h-10 sm:w-9 sm:h-9 md:w-8 md:h-8 flex items-center justify-center rounded-full';
};

/**
 * 터치 타겟 최소 크기 보장 클래스
 */
export const getTouchTargetClass = () => {
  return 'min-w-[44px] min-h-[44px] flex items-center justify-center';
};