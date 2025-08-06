'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Post } from '@/types/post';
import { Icon } from '@/components/ui/Icon';
import { Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ko, enUS, ja, ru } from 'date-fns/locale';

interface BlogPostHeaderProps {
  post: Post;
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
            className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] rounded-full text-sm font-medium hover-shimmer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="Tag" size={14} />
            {post.category.name}
          </motion.span>
        )}
        <div className="flex items-center gap-4 text-sm text-[var(--text-color)] opacity-60">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {getFormattedDate()}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {post.views?.toLocaleString() || 0}
          </span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1 
        className={`font-bold text-[var(--title)] leading-tight mb-4 ${
          mobile ? 'text-2xl' : tablet ? 'text-3xl' : 'lg:text-4xl'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {post.title}
      </motion.h1>

      {/* Description */}
      <motion.p 
        className={`text-[var(--text-color)] opacity-80 leading-relaxed ${
          mobile ? 'text-base' : tablet ? 'text-lg' : 'text-xl'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        {post.description}
      </motion.p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <motion.div 
          className="flex flex-wrap gap-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {post.tags.map((tag, index) => (
            <motion.span
              key={`${post.uid}-tag-${tag.uid || index}`}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-badge)] hover:bg-[var(--card-hover)] text-[var(--text-color)] rounded-full text-sm transition-all cursor-pointer hover-shimmer"
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
              #{tag.name}
            </motion.span>
          ))}
        </motion.div>
      )}
    </header>
  );
});

Header.displayName = 'Header';