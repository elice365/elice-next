'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { PostType } from '@/types/post';
import { Icon } from '@/components/ui/Icon';
import { format } from 'date-fns';
import { ko, enUS, ja, ru } from 'date-fns/locale';

interface BlogPostHeaderProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
}

const localeMap = {
  ko: ko,
  en: enUS,
  ja: ja,
  ru: ru
};

export const Header = memo(function Header({
  post,
  mobile,
  tablet
}: BlogPostHeaderProps) {
  const locale = 'ko'; // Get from context or props

  const getFormattedDate = () => {
    if (!post.createdTime) return '';
    try {
      const currentLocale = localeMap[locale as keyof typeof localeMap] || ko;
      return format(new Date(post.createdTime), 'yyyy년 MM월 dd일', { locale: currentLocale });
    } catch {
      return '';
    }
  };

  return (
    <header>
      {/* Category and metadata */}
      <motion.div
        className="flex items-center gap-4 mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {post.category && (
          <motion.span
            className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-[var(--blog-accent)] to-[var(--blog-secondary)] text-white text-sm font-medium transition-all duration-300"
            style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: 'var(--blog-shadow-md)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="Tag" size={14} />
            {post.category.name}
          </motion.span>
        )}

      </motion.div>

      {/* Title */}
      <motion.h1
        className={`font-bold text-[var(--blog-text-primary)] leading-tight ${mobile ? 'text-2xl' : tablet ? 'text-3xl' : 'lg:text-4xl'
          }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {post.title}
      </motion.h1>
      <motion.div 
        className="flex items-center gap-4 text-sm text-[var(--blog-text-secondary)] opacity-80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--blog-surface)] border border-[var(--blog-border)] transition-all duration-200 hover:border-[var(--blog-accent)]/30" style={{ borderRadius: 'var(--blog-radius-sm)' }}>
          <Icon name='Clock' size={14} className="text-[var(--blog-accent)]" />
          {getFormattedDate()}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--blog-surface)] border border-[var(--blog-border)] transition-all duration-200 hover:border-[var(--blog-accent)]/30" style={{ borderRadius: 'var(--blog-radius-sm)' }}>
          <Icon name='Eye' size={14} className="text-[var(--blog-accent)]" />
          {post.views?.toLocaleString() || 0}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--blog-surface)] border border-[var(--blog-border)] transition-all duration-200 hover:border-[var(--blog-accent)]/30" style={{ borderRadius: 'var(--blog-radius-sm)' }}>
          <Icon name='Heart' size={14} className="text-[var(--blog-accent)]" />
          {post.likeCount?.toLocaleString() || 0}
        </span>
      </motion.div>
      {/* Description */}

      {/* Tags */}
      {post.tags.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-2 my-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {post.tags.map((tag, index) => (
            <motion.span
              key={`${post.uid}-tag-${tag.uid || index}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--blog-surface)] border border-[var(--blog-border)] hover:bg-[var(--blog-surface-hover)] hover:border-[var(--blog-accent)]/30 text-[var(--blog-text-primary)] text-sm transition-all cursor-pointer"
              style={{ borderRadius: 'var(--blog-radius-sm)', boxShadow: 'var(--blog-shadow-sm)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.05 * index,
                ease: "easeOut"
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Hash" size={12} className="text-[var(--blog-accent)]" />
              {tag.name}
            </motion.span>
          ))}
        </motion.div>
      )}
      <motion.div
        className="p-4 bg-[var(--blog-surface)] border border-[var(--blog-border)] mt-4"
        style={{ borderRadius: 'var(--blog-radius-md)', boxShadow: 'var(--blog-shadow-sm)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <motion.p
          className={`text-[var(--blog-text-primary)] leading-relaxed ${mobile ? 'text-base' : tablet ? 'text-lg' : 'text-xl'
            }`}
        >
          {post.description}
        </motion.p>
      </motion.div>

    </header>
  );
});

Header.displayName = 'Header';