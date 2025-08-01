'use client';

import { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { togglePostLike } from '@/stores/slice/blog';
import { motion } from 'framer-motion';

interface BlogCardProps {
  post: Post;
  className?: string;
}

// Default image for posts without images
const DEFAULT_POST_IMAGE = "https://placehold.co/350x200.png";

export const Card = memo(function Card({ post, className = '' }: BlogCardProps) {
  const dispatch = useAppDispatch();
  const isLiking = useAppSelector((state) => state.blog.isLiking);
  const { mobile, tablet } = useAppSelector((state) => state.device);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked((prev) => !prev);
  }, []);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    setIsLikeAnimating(true);

    try {
      await dispatch(togglePostLike({
        postId: post.uid,
        action: post.isLiked ? 'unlike' : 'like'
      })).unwrap();
    } catch (error) {
      // Failed to toggle like
    } finally {
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  }, [dispatch, post.uid, post.isLiked, isLiking]);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }, []);

  // Get the main image with fallback - updated for array-based images
  const getImageSrc = (images: string[] | any): string => {
    // Handle new array format
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    // Handle legacy object format
    if (images && typeof images === 'object') {
      if (images.main) return images.main;
      if (images.thumbnail) return images.thumbnail;
      if (images.src) return images.src;
      if (images.url) return images.url;
    }
    // Handle string format
    if (typeof images === 'string') return images;

    return DEFAULT_POST_IMAGE;
  };

  const mainImage = imageError ? DEFAULT_POST_IMAGE : getImageSrc(post.images);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Responsive card dimensions
  const cardClasses = mobile
    ? "w-full max-w-full"
    : tablet
      ? "w-full"
      : "w-full";

  const imageHeight = mobile ? "h-[180px]" : tablet ? "h-[200px]" : "h-[220px]";

  return (
    <motion.div
      className={`${cardClasses} flex-none relative overflow-hidden ${mobile ? 'rounded-xl' : 'rounded-2xl'} ${mobile ? 'shadow-sm' : 'shadow-md'} transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${!mobile && 'hover:shadow-2xl'} group bg-[var(--color-card)] border border-[var(--border-color)] ${!mobile && 'hover:border-[var(--blog-accent)]/40'} ${className}`}
      whileHover={!mobile ? { y: -8, scale: 1.03 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Shimmer effect - desktop only */}
      {!mobile && (
        <span className="z-10 absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[var(--blog-accent)]/20 to-transparent transform -translate-x-full opacity-0 transition-all duration-1000 ease-in-out group-hover:opacity-100 group-hover:translate-x-full"></span>
      )}
      
      {/* Glow effect - desktop only */}
      {!mobile && (
        <div className="absolute -inset-px bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10"></div>
      )}

      <Link href={`/blog/${post.uid}`}>
        {/* Card top image area */}
        <div className={`${imageHeight} relative overflow-hidden bg-gray-100`}>
          {/* Gradient overlay for better text readability */}
          <div className={`absolute inset-0 bg-gradient-to-t  to-transparent opacity-0 ${!mobile && 'group-hover:opacity-100'} transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-10`}></div>
          
          {/* Blur mask similar to test file - desktop only */}
          {!mobile && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--blog-accent)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[5]"></div>
          )}
          
          <Image
            src={mainImage}
            alt={post.title}
            className={`bg-gray-200 object-cover w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${!mobile && 'group-hover:scale-110 group-hover:brightness-90'}`}
            width={500}
            height={300}
            onError={handleImageError}
            priority={false}
          />
          {/* Category Badge with animation */}
          {post.category && (
            <motion.div 
              className={`absolute ${mobile ? 'top-2 left-2' : 'top-3 left-3'} z-20`}
              initial={!mobile ? { opacity: 0, x: -20 } : {}}
              animate={!mobile ? { opacity: 1, x: 0 } : {}}
              transition={!mobile ? { delay: 0.1, duration: 0.4 } : {}}
            >
              <span className={`bg-[var(--blog-accent)]/90 backdrop-blur-md text-white ${mobile ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5'} rounded-full ${mobile ? 'shadow-md' : 'shadow-lg'} transition-all duration-300 ${!mobile && 'group-hover:bg-[var(--blog-accent)] group-hover:shadow-xl'} font-medium`}>
                {post.category.name}
              </span>
            </motion.div>
          )}
          {/* Tags with icon - animated */}
          {post.tags.length > 0 && (
            <motion.div 
              className={`absolute ${mobile ? 'bottom-2 left-2' : 'bottom-3 left-3'} z-20 flex flex-wrap ${mobile ? 'gap-1' : 'gap-1.5'}`}
              initial={!mobile ? { opacity: 0, y: 20 } : {}}
              animate={!mobile ? { opacity: 1, y: 0 } : {}}
              transition={!mobile ? { delay: 0.2, duration: 0.4 } : {}}
            >
              {post.tags.slice(0, mobile ? 2 : 3).map((tag, index) => (
                <motion.span 
                  key={index} 
                  className={`bg-black/70 backdrop-blur-sm text-white ${mobile ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-md inline-flex items-center gap-1 shadow-md transition-all duration-300 ${!mobile && 'group-hover:bg-black/80'}`}
                  initial={!mobile ? { opacity: 0, scale: 0.8 } : {}}
                  animate={!mobile ? { opacity: 1, scale: 1 } : {}}
                  transition={!mobile ? { delay: 0.3 + index * 0.1, duration: 0.3 } : {}}
                >
                  <Icon name="Tag" size={mobile ? 10 : 11} className="opacity-70" />
                  {tag.name}
                </motion.span>
              ))}
              {((mobile && post.tags.length > 2) || (!mobile && post.tags.length > 3)) && (
                <span className={`bg-black/70 backdrop-blur-sm text-white ${mobile ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-md shadow-md`}>
                  +{post.tags.length - (mobile ? 2 : 3)}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Card content area */}
        <div className={`${mobile ? 'p-4' : tablet ? 'p-5' : 'p-6'} space-y-3`}>
          {/* Title with better typography */}
          <h3 className={`text-[var(--title)] ${mobile ? 'text-base' : tablet ? 'text-lg' : 'text-xl'} font-bold leading-snug  transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${!mobile && 'group-hover:text-[var(--hover-text)]'} tracking-tight whitespace-nowrap overflow-hidden text-ellipsis `}>
            {post.title}
          </h3>

          {/* Description with better spacing */}
          <p className={`${mobile ? 'text-sm' : 'text-sm md:text-[15px]'} text-[var(--text-color)] opacity-75 line-clamp-2 leading-relaxed ${!mobile && 'tracking-wide'} h-12`}>
            {post.description}
          </p>

          {/* Stats with enhanced styling */}
          <div className={`flex items-center justify-between ${mobile ? 'pt-3' : 'pt-4'} border-t border-[var(--border-color)]/50`}>
            <div className={`flex items-center ${mobile ? 'gap-2' : 'gap-3 md:gap-4'} ${mobile ? 'text-[11px]' : 'text-xs'} text-[var(--text-color)] opacity-70`}>
              <motion.span 
                className={`flex items-center ${mobile ? 'gap-1' : 'gap-1.5'} transition-all duration-300 hover:text-[var(--blog-accent)] hover:opacity-100 ${!mobile && 'cursor-pointer'}`}
                whileHover={!mobile ? { scale: 1.05 } : {}}
              >
                <Icon name="Eye" size={mobile ? 12 : 15} className="opacity-80" />
                <span className="font-medium">{post.views.toLocaleString()}</span>
              </motion.span>
              <motion.span 
                className={`flex items-center ${mobile ? 'gap-1' : 'gap-1.5'} transition-all duration-300 hover:text-[var(--blog-accent)] hover:opacity-100 ${!mobile && 'cursor-pointer'}`}
                whileHover={!mobile ? { scale: 1.05 } : {}}
              >
                <Icon name="Heart" size={mobile ? 12 : 15} className="opacity-80" fill={post.isLiked ? 'currentColor' : 'none'} />
                <span className="font-medium">{post.likeCount}</span>
              </motion.span>
              {!mobile && (
                <motion.span 
                  className="flex items-center gap-1.5 transition-all duration-300 hover:text-[var(--blog-accent)] hover:opacity-100 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon name="MessageSquare" size={15} className="opacity-80" />
                  <span className="font-medium">{post.comments || 0}</span>
                </motion.span>
              )}
            </div>
            
            {/* Date with better formatting */}
            <time className={`${mobile ? 'text-[11px]' : 'text-xs'} text-[var(--text-color)] opacity-60 font-medium`}>
              {formatDate(post.createdTime)}
            </time>
          </div>

          {/* Enhanced Hover Actions - mobile shows always at bottom of content */}
          {mobile ? (
            <div className="flex items-center gap-2 pt-3">
              <motion.button
                onClick={handleLike}
                className="bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] p-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)] active:text-white"
                whileTap={{ scale: 0.9 }}
                animate={isLikeAnimating ? { scale: [1, 1.2, 1] } : {}}
              >
                <Icon
                  name="Heart"
                  size={14}
                  fill={post.isLiked ? 'currentColor' : 'none'}
                  className={post.isLiked ? 'text-red-400' : 'text-white'}
                />
              </motion.button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleBookmarkToggle();
                }}
                className="bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] p-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)] active:text-white"
              >
                <Icon name="Bookmark" size={14} fill={isBookmarked ? "currentColor" : "none"} className='text-white'/>
              </button>
              <Link href={`/blog/${post.uid}`} className="flex-1">
                <button className="bg-[var(--blog-accent)] text-white px-4 py-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)]/90 text-xs font-medium w-full flex items-center justify-center gap-1">
                  <span>자세히 보기</span>
                  <Icon name="ArrowRight" size={12} />
                </button>
              </Link>
            </div>
          ) : (
            <div 
              className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-gradient-to-t from-[var(--blog-accent)]/100 via-[var(--blog-accent)]/100 to-[var(--blog-accent)]/100 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-xl"
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.button
                  onClick={handleLike}
                  className="relative text-white bg-white/20 backdrop-blur-xl p-2.5 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 shadow-lg group/btn"
                  whileTap={{ scale: 0.9 }}
                  animate={isLikeAnimating ? { scale: [1, 1.3, 1] } : {}}
                >
                  <Icon
                    name="Heart"
                    size={18}
                    fill={post.isLiked ? 'currentColor' : 'none'}
                    className={`transition-colors duration-300 ${post.isLiked ? 'text-red-400' : 'group-hover/btn:text-red-300'}`}
                  />
                  {post.isLiked && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-400/30"
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    handleBookmarkToggle();
                  }}
                  className="text-white bg-white/20 backdrop-blur-xl p-2.5 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 shadow-lg group/btn"
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon 
                    name="Bookmark" 
                    size={18} 
                    fill={isBookmarked ? "currentColor" : "none"} 
                    className={`transition-colors duration-300 ${isBookmarked ? 'text-yellow-400' : 'group-hover/btn:text-yellow-300'}`}
                  />
                </motion.button>
              </div>
              <motion.button 
                className="text-white bg-white/25 backdrop-blur-xl px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-white/35 hover:scale-105 text-sm font-semibold shadow-lg flex items-center gap-2 group/btn"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>자세히 보기</span>
                <Icon name="ArrowRight" size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </motion.button>
            </div>
          </div>
          )}
        </div>
      </Link>

      {/* Enhanced gradient overlay - desktop only */}
      {!mobile && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--blog-accent)]/5 via-transparent to-[var(--blog-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none rounded-2xl"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--blog-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
        </>
      )}
    </motion.div>
  );
});

Card.displayName = 'Card';