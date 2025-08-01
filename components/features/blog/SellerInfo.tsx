'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AuthorInfo {
  name: string;
  description: string;
  profileImage: string;
}

interface AuthorInfoCardProps {
  author: AuthorInfo;
  variant?: 'desktop' | 'mobile';
}

export const SellerInfo = memo(function SellerInfo({
  author,
  variant = 'desktop'
}: AuthorInfoCardProps) {
  const isDesktop = variant === 'desktop';

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl shadow-sm
        bg-[var(--color-modal)]/80 backdrop-blur-lg
        border border-[var(--border-color)]/30
        ${isDesktop ? 'p-6' : 'p-4'}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={isDesktop ? { y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } : undefined}
    >
      {/* Glassmorphism background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--blog-accent)]/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {isDesktop && (
          <h3 className="text-lg font-semibold text-[var(--title)] mb-4">작성자</h3>
        )}
        
        <div className="flex items-center space-x-4">
          {/* Profile Image with online indicator */}
          <div className="relative">
            <motion.div
              className={`${
                isDesktop ? 'h-16 w-16' : 'h-14 w-14'
              } rounded-full overflow-hidden bg-[var(--hover)] ring-2 ring-[var(--blog-accent)]/20`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Image
                src={author.profileImage}
                alt={`${author.name} 프로필`}
                width={isDesktop ? 64 : 56}
                height={isDesktop ? 64 : 56}
                className="object-cover w-full h-full"
                priority
              />
            </motion.div>
            {/* Online status indicator */}
            <motion.div
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--color-modal)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          <div className="flex-1">
            <motion.h4 
              className="font-medium text-[var(--title)]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {author.name}
            </motion.h4>
            <motion.p 
              className={`text-sm text-[var(--text-color)] opacity-80 ${
                isDesktop ? 'line-clamp-2' : 'line-clamp-1'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {author.description}
            </motion.p>
          </div>

          {!isDesktop && (
            <motion.button 
              className="bg-[var(--blog-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover-shimmer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              연락하기
            </motion.button>
          )}
        </div>

        {isDesktop && (
          <motion.button 
            className="w-full mt-4 bg-[var(--blog-accent)] text-white px-4 py-2 rounded-lg font-medium hover-shimmer relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            연락하기
          </motion.button>
        )}
      </div>

      {/* Easter egg: signature watermark after 5 seconds */}
      <motion.div
        className="absolute bottom-2 right-2 text-[var(--text-color)] opacity-5 text-4xl font-signature select-none pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 5, duration: 2 }}
        style={{ fontFamily: 'cursive' }}
      >
        {author.name}
      </motion.div>
    </motion.div>
  );
});

SellerInfo.displayName = 'SellerInfo';