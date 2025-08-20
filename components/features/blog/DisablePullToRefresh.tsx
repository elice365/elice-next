'use client';

import { useEffect } from 'react';

export function DisablePullToRefresh() {
  useEffect(() => {
    // 모바일 브라우저에서 pull-to-refresh 비활성화
    let lastY = 0;
    
    const preventPullToRefresh = (e: TouchEvent) => {
      const scrollY = window.scrollY;
      const direction = e.touches[0].clientY > lastY ? 'down' : 'up';
      lastY = e.touches[0].clientY;
      
      // 스크롤이 최상단에 있고 아래로 당기는 경우 방지
      if (scrollY === 0 && direction === 'down') {
        e.preventDefault();
      }
    };
    
    const updateLastY = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    
    // 모바일 디바이스에서만 적용
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', updateLastY, { passive: false });
      document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    }
    
    return () => {
      if ('ontouchstart' in window) {
        document.removeEventListener('touchstart', updateLastY);
        document.removeEventListener('touchmove', preventPullToRefresh);
      }
    };
  }, []);
  
  return null;
}