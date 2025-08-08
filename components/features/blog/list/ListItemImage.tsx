'use client';

import { useState, memo, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface ListItemImageProps {
  images: string[];
  title: string;
  mobile: boolean;
  tablet: boolean;
  isVisible: boolean;
  onInteraction: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  slideContainerRef: React.RefObject<HTMLDivElement>;
  toggleBtnRef: React.RefObject<HTMLDivElement>;
  getImageDimensions: (mobile: boolean, tablet: boolean) => string;
}

export const ListItemImage = memo(function ListItemImage({
  images,
  title,
  mobile,
  tablet,
  isVisible,
  onInteraction,
  onMouseEnter,
  onMouseLeave,
  slideContainerRef,
  toggleBtnRef,
  getImageDimensions
}: ListItemImageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mainImage = images[0];
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onInteraction();
    }
  };

  return (
    <section 
      className={(() => {
        const baseClasses = 'relative overflow-hidden';
        const layoutClasses = mobile ? 'w-full h-48' : 'col-span-3 sm:col-span-2';
        return `${baseClasses} ${layoutClasses}`;
      })()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`Image gallery for ${title}`}
    >
      {/* Main Image Container */}
      <div className={`relative ${getImageDimensions(mobile, tablet)} rounded-lg overflow-hidden bg-[var(--color-gray-50)] dark:bg-[var(--color-gray-800)]`}>
        <Image
          src={mainImage}
          alt={title}
          fill
          sizes={mobile ? "(max-width: 768px) 100vw" : "(max-width: 768px) 150px, 150px"}
          className="object-cover hover:scale-110 transition-transform duration-700"
        />
        
        {/* Gradient overlay for better text visibility - mobile only */}
        {mobile && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        )}
        
        {/* Show carousel button only when multiple images exist */}
        {images.length > 1 && (
          <button 
            ref={buttonRef}
            onClick={onInteraction}
            onKeyDown={handleKeyDown}
            className={`absolute ${mobile ? 'bottom-2 right-2' : 'top-2 right-2'} bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 cursor-pointer transition-all duration-300 hover:bg-white dark:hover:bg-black z-20 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label={`View image gallery (${images.length} images)`}
            type="button"
          >
            <Icon name="Images" size={12} />
            <span className="text-xs font-medium">{images.length}</span>
          </button>
        )}
      </div>

      {/* Image Slide Panel */}
      <AnimatePresence>
        {isVisible && images.length > 1 && (
          <motion.div 
            ref={slideContainerRef}
            className={(() => {
              const baseClasses = 'absolute h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg z-30';
              const positionClasses = mobile ? 'inset-0 w-full' : 'top-0 -right-full w-52 shadow-xl';
              return `${baseClasses} ${positionClasses}`;
            })()}
            initial={mobile ? { x: '100%', opacity: 1 } : { x: 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={mobile ? { x: '100%', opacity: 1 } : { x: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="relative w-full h-full flex flex-col">
              {/* Close button */}
              <button
                onClick={onInteraction}
                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/90 rounded-full z-40 hover:scale-110 transition-transform"
              >
                <Icon name="X" size={16} />
              </button>

              {/* Current image display */}
              <div className="flex-1 relative">
                <Image
                  src={images[currentImageIndex]}
                  alt={`${title} - Image ${currentImageIndex + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                
                {/* Image counter */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {images.length}
                </div>

                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 dark:bg-black/90 rounded-full hover:scale-110 transition-transform"
                    >
                      <Icon name="ChevronLeft" size={16} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 dark:bg-black/90 rounded-full hover:scale-110 transition-transform"
                    >
                      <Icon name="ChevronRight" size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip - desktop only */}
              {!mobile && (
                <div className="p-2 flex gap-1 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={`thumb-${img}-${idx}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`relative w-12 h-12 rounded overflow-hidden flex-shrink-0 ${idx === currentImageIndex ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

ListItemImage.displayName = 'ListItemImage';