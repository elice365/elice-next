'use client';

import React, { useRef, memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

// Swiper CSS 임포트
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import { FloLayoutProps } from '@/types/flo';

const FloLayout: React.FC<FloLayoutProps> = ({
  albums,
  title = 'FLO 신보 랭킹',
  subtitle = '최신 인기 앨범을 확인해보세요',
  onAlbumClick,
  swiperConfig,
  className = '',
  loading = false,
}) => {
  const swiperRef = useRef<any>(null);

  const handleAlbumClick = (album: any) => {
    onAlbumClick?.(album);
  };

  if (loading) {
    return (
      <div className={`container mx-auto py-12 px-4 ${className}`}>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className={`container mx-auto py-12 px-4 text-center ${className}`}>
        <div className="text-slate-500 text-lg">
          앨범 정보가 없습니다
        </div>
      </div>
    );
  }

  // 기본 Swiper 설정
  const defaultSwiperConfig = {
    spaceBetween: 20,
    slidesPerView: 'auto' as const,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      clickable: true,
      el: '.swiper-pagination',
    },
    breakpoints: {
      // 모바일에서는 한 장씩 자연스럽게 보이도록 설정
      0: {
        slidesPerView: 1,
        spaceBetween: 12,
      },
      640: {
        slidesPerView: 2,
      },
      768: {
        slidesPerView: 3,
      },
      1024: {
        slidesPerView: 4,
      },
      1280: {
        slidesPerView: 5,
      },
    },
    ...swiperConfig
  };

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden w-full ${className}`}>
      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <header className="text-center mb-16">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg" 
            style={{ background: 'var(--blog-accent)' }}
          >
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="drop-shadow-sm text-white"
              aria-hidden="true"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h1 className="font-black mb-4 tracking-tight text-foreground text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="font-medium tracking-wide text-foreground/70 text-lg">
            {subtitle}
          </p>
          <div 
            className="w-24 h-1 rounded-full mx-auto mt-6" 
            style={{ background: 'var(--blog-accent)' }}
          ></div>
        </header>

        {/* Swiper 슬라이더 */}
        <div className="relative">
          <Swiper
            ref={swiperRef}
            modules={[Autoplay, Pagination]}
            {...defaultSwiperConfig}
            className="overflow-hidden md:overflow-visible"
            style={{
              width: '100%',
              padding: '16px 8px',
              overflow: 'hidden',
            }}
          >
            {albums.map((album, index) => (
              <SwiperSlide
                key={album.id}
                style={{
                  // 작은 화면에서 더 작은 카드를 허용하여 잘림 방지
                  // 180px ~ 260px 사이에서 뷰포트에 맞춰 자동 조정
                  width: 'clamp(180px, 70vw, 260px)',
                  height: 'auto',
                }}
              >
                <div
                  className="bg-card rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1"
                  onClick={() => handleAlbumClick(album)}
                >
                  <div className="aspect-square bg-background rounded-lg mb-4 overflow-hidden">
                    {album.imgList && album.imgList.length > 0 ? (
                      <img
                        src={album.imgList[0].url}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/50">
                        🎵
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2 truncate">
                    {album.title}
                  </h3>
                  <p className="text-foreground/70 text-sm truncate">
                    {album.representationArtist?.name || 'Unknown Artist'}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination mt-8 !relative flex justify-center gap-2">
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FloLayout);
