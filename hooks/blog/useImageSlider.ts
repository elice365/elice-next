import { useState, useCallback, useRef, useEffect } from 'react';

export const useImageSlider = (mobile: boolean) => {
  const [isVisible, setIsVisible] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLDivElement>(null);

  const handleInteraction = useCallback(() => {
    if (mobile) {
      setIsVisible((prev) => !prev);
    }
  }, [mobile]);

  const handleMouseEnter = useCallback(() => {
    if (!mobile) setIsVisible(true);
  }, [mobile]);

  const handleMouseLeave = useCallback(() => {
    if (!mobile) setIsVisible(false);
  }, [mobile]);

  useEffect(() => {
    if (!mobile) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        slideContainerRef.current &&
        !slideContainerRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [mobile]);

  return {
    isVisible,
    slideContainerRef,
    toggleBtnRef,
    handleInteraction,
    handleMouseEnter,
    handleMouseLeave
  };
};