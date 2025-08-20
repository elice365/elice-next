'use client';

import { useMemo } from 'react';

export interface SwiperConfig {
  slidesPerView: 'auto' | number;
  spaceBetween: number;
  centeredSlides: boolean;
  loop: boolean;
  autoplay: {
    delay: number;
    disableOnInteraction: boolean;
  };
  pagination: {
    el: string;
    clickable: boolean;
    dynamicBullets: boolean;
  };
  breakpoints: Record<number, any>;
}

export function useSwiper(customConfig?: Partial<SwiperConfig>) {
  const defaultConfig: SwiperConfig = useMemo(() => ({
    slidesPerView: 'auto',
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: {
      640: {
        slidesPerView: 'auto',
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 'auto',
        spaceBetween: 30,
      },
      1024: {
        slidesPerView: 'auto',
        spaceBetween: 30,
      },
    },
  }), []);

  const swiperConfig = useMemo(() => ({
    ...defaultConfig,
    ...customConfig,
    // 중첩된 객체들도 올바르게 병합
    autoplay: {
      ...defaultConfig.autoplay,
      ...customConfig?.autoplay,
    },
    pagination: {
      ...defaultConfig.pagination,
      ...customConfig?.pagination,
    },
    breakpoints: {
      ...defaultConfig.breakpoints,
      ...customConfig?.breakpoints,
    },
  }), [defaultConfig, customConfig]);

  // 반응형 설정 생성기
  const createResponsiveConfig = (mobile: number, tablet: number, desktop: number) => ({
    breakpoints: {
      640: { slidesPerView: mobile, spaceBetween: 15 },
      768: { slidesPerView: tablet, spaceBetween: 20 },
      1024: { slidesPerView: desktop, spaceBetween: 30 },
    },
  });

  // 미리 정의된 설정들
  const presetConfigs = {
    // 카드형 레이아웃 (현재 구현)
    cards: swiperConfig,
    
    // 그리드형 레이아웃
    grid: createResponsiveConfig(1, 2, 3),
    
    // 리스트형 레이아웃
    list: {
      ...swiperConfig,
      slidesPerView: 1,
      centeredSlides: false,
      loop: false,
    },
    
    // 미니 플레이어용
    mini: {
      ...swiperConfig,
      slidesPerView: 'auto',
      spaceBetween: 10,
      autoplay: { delay: 5000, disableOnInteraction: true },
    },
  };

  return {
    config: swiperConfig,
    presets: presetConfigs,
    createResponsiveConfig,
  };
}