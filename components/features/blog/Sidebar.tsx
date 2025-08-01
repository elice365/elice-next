'use client';

import { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Post } from '@/types/post';
import { BlogContent } from '@/utils/blog/contentParser';
import { SellerInfo } from './SellerInfo';
import { Actions } from './Actions';

interface BlogPostSidebarProps {
  post: Post;
  blogContent: BlogContent | null;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export const Sidebar = memo(function Sidebar({
  post,
  blogContent,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  onShare
}: BlogPostSidebarProps) {
  const getFormattedDate = () => {
    if (!post.createdTime) return '';
    try {
      return format(new Date(post.createdTime), 'yyyy년 MM월 dd일', { locale: ko });
    } catch {
      return '';
    }
  };

  const sidebarVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <aside className="lg:col-span-4">
      <motion.div 
        className="sticky top-8 space-y-6"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Author Info Card */}
        {blogContent?.author && (
          <motion.div variants={itemVariants}>
            <SellerInfo author={blogContent.author} variant="desktop" />
          </motion.div>
        )}

        {/* Engagement Actions */}
        <motion.div 
          className="bg-[var(--color-modal)] rounded-xl p-3 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex flex-row justify-center gap-3">
            <Actions
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              likeCount={post.likeCount || 0}
              onLike={onLike}
              onBookmark={onBookmark}
              onShare={onShare}
              variant="desktop"
            />
          </div>
        </motion.div>

        {/* Post Stats */}
        <motion.div 
          className="bg-[var(--color-modal)] rounded-xl p-6 shadow-sm"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-[var(--title)] mb-4">게시글 통계</h3>
          <div className="space-y-3">
            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
              whileHover={{ x: 2 }}
            >
              <span className="text-sm text-[var(--text-color)] opacity-70">조회수</span>
              <span className="flex items-center gap-1 font-medium">
                <Eye size={14} />
                {post.views?.toLocaleString() || 0}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
              whileHover={{ x: 2 }}
            >
              <span className="text-sm text-[var(--text-color)] opacity-70">좋아요</span>
              <span className="font-medium text-[var(--title)]">
                {post.likeCount?.toLocaleString() || 0}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
              whileHover={{ x: 2 }}
            >
              <span className="text-sm text-[var(--text-color)] opacity-70">작성일</span>
              <span className="flex items-center gap-1 text-sm">
                <Clock size={14} />
                {getFormattedDate()}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Purchase CTA */}
        {blogContent?.product && blogContent.product.length > 0 && (
          <motion.div 
            className="bg-gradient-to-br from-[var(--blog-accent)] to-[var(--blog-accent)]/80 rounded-xl p-6 text-white shadow-lg"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h3 className="text-lg font-semibold mb-2">관심있으신가요?</h3>
            <p className="text-sm opacity-90 mb-4">소개된 제품들을 지금 바로 만나보세요</p>
            <motion.button 
              className="w-full bg-white text-[var(--blog-accent)] px-4 py-3 rounded-lg font-medium hover-shimmer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              제품 구매하기
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';