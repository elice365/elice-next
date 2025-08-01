'use client';

import { motion } from 'framer-motion';

export function PostSkeleton() {
  const shimmer = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear" as const
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        {/* Category */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-7 w-24 bg-[var(--hover)] rounded-full overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          </div>
          <div className="h-4 w-32 bg-[var(--hover)] rounded overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          </div>
        </div>

        {/* Title */}
        <div className="h-10 w-3/4 bg-[var(--hover)] rounded-lg mb-4 overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-[var(--hover)] rounded overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          </div>
          <div className="h-5 w-2/3 bg-[var(--hover)] rounded overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmer}
              initial="initial"
              animate="animate"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-[var(--hover)] rounded-full overflow-hidden relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmer}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.1 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Skeleton */}
      <div className="h-96 bg-[var(--hover)] rounded-xl mb-8 overflow-hidden relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          variants={shimmer}
          initial="initial"
          animate="animate"
        />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full bg-[var(--hover)] rounded overflow-hidden relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmer}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.05 }}
              />
            </div>
            {i % 2 === 0 && (
              <div className="h-4 w-5/6 bg-[var(--hover)] rounded overflow-hidden relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  variants={shimmer}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: i * 0.05 + 0.1 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading Message */}
      <motion.div
        className="text-center text-[var(--text-color)] opacity-60 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        좋은 글은 천천히 끓입니다 ☕️
      </motion.div>
    </div>
  );
}