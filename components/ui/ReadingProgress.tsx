'use client';

import { useEffect, useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingProgressIndicatorProps {
  targetRef: RefObject<HTMLElement>;
}

export function ReadingProgressIndicator({ targetRef }: ReadingProgressIndicatorProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = targetRef.current;
      if (!element) return;

      const { top, height } = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the article has been scrolled
      const scrolled = Math.max(0, -top);
      const totalScrollable = height - windowHeight;
      
      if (totalScrollable > 0) {
        const percentage = Math.min(100, (scrolled / totalScrollable) * 100);
        setProgress(percentage);
      }
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial calculation
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [targetRef]);

  return (
    <>
      {/* Main Progress Bar Container */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        {/* Progress Fill with Wave Animation */}
        <motion.div
          className="relative h-full overflow-hidden"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.1, 0.25, 1.0] // Custom cubic-bezier for smooth fill
          }}
        >
          {/* Primary gradient fill */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--blog-accent)] via-[var(--blog-accent)]/90 to-[var(--blog-accent)]/80" />
          
          {/* Animated wave effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1
            }}
          />
          
          {/* Pulse glow at the leading edge */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-white/40 to-transparent"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>

      {/* Subtle milestone dots */}
      <div className="fixed top-0 left-0 right-0 h-1 z-40 pointer-events-none flex items-center">
        {[25, 50, 75].map((milestone) => (
          <motion.div
            key={milestone}
            className="absolute w-1 h-1 bg-[var(--border-color)] rounded-full"
            style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: progress >= milestone ? 1 : 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: progress >= milestone ? 0.1 : 0
            }}  
          />
        ))}
      </div>

      {/* Completion Notification */}
      <AnimatePresence>
        {progress >= 95 && (
          <motion.div
            className="fixed bottom-8 right-8 z-50"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <motion.svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              <span className="font-medium">읽기 완료!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced progress bar shadow for depth */}
      <motion.div 
        className="fixed top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--blog-accent)]/20 to-transparent pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </>
  );
}