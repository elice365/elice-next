'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // 초기 렌더링 시 디바이스 체크
  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // timeoutId를 외부에서 관리
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    setIsNavigating(true);
    
    // 최대 1.5초 후 자동으로 로딩 종료
    const id = setTimeout(() => {
      setIsNavigating(false);
      setTimeoutId(null);
    }, 1500);
    setTimeoutId(id);
  };

  const handleComplete = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsNavigating(false);
  };

  useEffect(() => {
    // 데스크톱이 아니면 아무것도 하지 않음
    if (!isDesktop) return;

    // Link 클릭 감지
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link?.href && !link.target) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          handleStart();
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [pathname, isDesktop]);

  // 경로 변경 시 로딩 종료
  useEffect(() => {
    if (isNavigating) {
      handleComplete();
    }
  }, [pathname, searchParams]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // 데스크톱이 아니거나 네비게이션 중이 아니면 null 반환
  if (!isDesktop || !isNavigating) {
    return null;
  }

  return (
    <div className="navigation-progress-desktop">
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20">
        <div className="h-full bg-primary animate-pulse" />
      </div>
    </div>
  );
}