'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post';
import { Icon } from '@/components/ui/Icon';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { togglePostLike } from '@/stores/slice/blog';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogListItemProps {
  post: Post;
  className?: string;
}

// Default images array for posts without images
const DEFAULT_POST_IMAGES = [
  "https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Blog+Post+1",
  "https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Blog+Post+2",
  "https://via.placeholder.com/400x300/d1d5db/4b5563?text=Blog+Post+3"
];

export const ListItem = memo(function ListItem({ post, className = '' }: BlogListItemProps) {
  const dispatch = useAppDispatch();
  const { mobile, tablet } = useAppSelector((state) => state.device);
  const isLiking = useAppSelector((state) => state.blog.isLiking);

  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLDivElement>(null);

  // Get images with fallback to defaults - updated for array-based images
  const getPostImages = useCallback((images: string[] | any): string[] => {
    // Handle new array format
    if (Array.isArray(images) && images.length > 0) {
      return images.filter(img => typeof img === 'string' && img.trim() !== '');
    }
    // Handle legacy object format
    if (images && typeof images === 'object') {
      const imageUrls: string[] = [];
      if (images.main) imageUrls.push(images.main);
      if (images.thumbnail && images.thumbnail !== images.main) imageUrls.push(images.thumbnail);
      if (imageUrls.length > 0) return imageUrls;
    }
    // Handle string format
    if (typeof images === 'string' && images.trim() !== '') {
      return [images];
    }

    return DEFAULT_POST_IMAGES;
  }, []);

  const postImages = getPostImages(post.images);

  const handleInteraction = useCallback(() => {
    if (mobile) {
      setIsVisible((prev) => !prev);
    }
  }, [mobile]);

  const handleMouseEnter = useCallback(() => {
    if (!mobile) {
      setIsVisible(true);
    }
  }, [mobile]);

  const handleMouseLeave = useCallback(() => {
    if (!mobile) {
      setIsVisible(false);
    }
  }, [mobile]);

  // Close slide on outside click (mobile)
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

  const mainImage = postImages[0];

  return (
    <motion.article 
      className={`bg-[var(--color-card)] border-b border-[var(--border-color)]/50 w-full ${mobile ? 'p-4' : tablet ? 'p-5' : 'p-6'} relative overflow-hidden group hover:border-[var(--blog-accent)]/40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
      whileHover={!mobile ? { x: 4 } : {}}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Shimmer overlay effect - desktop only */}
      {!mobile && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5c5049]/10 to-transparent transform -translate-x-full opacity-0 transition-all duration-1200 ease-out group-hover:opacity-100 group-hover:translate-x-full z-10 pointer-events-none"></span>
      )}
      
      {/* Left accent border - desktop only */}
      {!mobile && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--blog-accent)]/100 via-[var(--blog-accent)]/100 to-[var(--blog-accent)]/100 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      )}
      
      <div className={`${mobile ? 'flex flex-col-reverse gap-4' : 'grid grid-cols-10 gap-4 md:gap-6'} relative`}>
        <div className={`${mobile ? 'w-full' : 'col-span-7 sm:col-span-8'} space-y-2 relative`}>
          {/* Title */}
          <Link href={`/blog/${post.uid}`}>
            <h3 className={`${mobile ? 'text-base' : tablet ? 'text-lg' : 'text-xl'} font-bold text-[var(--title)] hover:text-[var(--hover-text)] transition-all duration-300 line-clamp-2 leading-snug tracking-tight group-hover:text-[var(--hover-text)]`}>
              {post.title}
            </h3>
          </Link>

          {/* Description */}
          <p className={`text-[var(--text-color)] opacity-70 ${mobile ? 'text-sm line-clamp-3' : 'text-sm sm:text-[15px] line-clamp-2'} leading-relaxed ${!mobile && 'pr-4'}`}>
            {post.description}
          </p>

          {/* Tags with enhanced styling */}
          <div className={`flex flex-wrap gap-1.5 ${mobile ? 'pt-2' : 'pt-1'}`}>
            {post.category && (
              <span className={`${mobile ? 'text-[11px]' : 'text-xs'} bg-[var(--blog-accent)]/90 text-white px-2.5 py-1 rounded-full font-medium border border-[#5c5049]/20`}>
                {post.category.name}
              </span>
            )}
            {post.tags.slice(0, mobile ? 1 : 2).map((tag, index) => (
              <motion.span 
                key={index} 
                className={`${mobile ? 'text-[11px]' : 'text-xs'} bg-[var(--selecter)] hover:bg-[#5c5049]/10 text-[var(--text-color)] px-2 py-1 rounded-full transition-all duration-300 flex items-center gap-1 border border-transparent hover:border-[#5c5049]/20`}
                whileHover={!mobile ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="Tag" size={mobile ? 10 : 11} className="opacity-60" />
                <span>{tag.name}</span>
              </motion.span>
            ))}
            {mobile && post.tags.length > 1 && (
              <span className="text-[11px] text-[var(--text-color)] opacity-60">+{post.tags.length - 1}</span>
            )}
          </div>

          {/* Meta info with better spacing */}
          <div className={`flex ${mobile ? 'gap-3 text-[11px]' : 'gap-4 text-xs'} text-[var(--text-color)] opacity-60 pt-2 ${mobile ? 'flex-wrap' : ''}`}>
            <span className="flex gap-1 items-center hover:text-[#5c5049] transition-colors duration-300">
              <Icon name="Eye" size={mobile ? 12 : 14} className="opacity-70" />
              <span className="font-medium">{post.views.toLocaleString()}</span>
            </span>
            <span className="flex gap-1 items-center hover:text-[#5c5049] transition-colors duration-300">
              <Icon name="Heart" size={mobile ? 12 : 14} className="opacity-70" fill={post.isLiked ? 'currentColor' : 'none'} />
              <span className="font-medium">{post.likeCount}</span>
            </span>
            {!mobile && (
              <span className="flex gap-1.5 items-center hover:text-[#5c5049] transition-colors duration-300">
                <Icon name="MessageSquare" size={14} className="opacity-70" />
                <span className="font-medium">{post.comments || 0}</span>
              </span>
            )}
            <span className="flex gap-1 items-center">
              <Icon name="Calendar" size={mobile ? 12 : 14} className="opacity-70" />
              <time className="font-medium">{formatDate(post.createdTime)}</time>
            </span>
          </div>

          {/* Quick action buttons - mobile shows always, desktop on hover */}
          {mobile ? (
            <div className="flex items-center gap-2 pt-3">
              <motion.button 
                onClick={handleLike}
                disabled={isLiking}
                className="bg-[#5c5049]/10 text-[#5c5049] p-2 rounded-full transition-all duration-300 active:bg-[#5c5049] active:text-white"
                whileTap={{ scale: 0.9 }}
                animate={isLikeAnimating ? { scale: [1, 1.2, 1] } : {}}
              >
                <Icon name="Heart" size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
              </motion.button>
              <Link href={`/blog/${post.uid}`} className="flex-1">
                <button className="bg-[var(--blog-accent)] text-white px-4 py-2 rounded-full transition-all duration-300 active:bg-[#5c5049] text-xs font-medium w-full flex items-center justify-center gap-1">
                  <span>읽기</span>
                  <Icon name="ArrowRight" size={12} />
                </button>
              </Link>
            </div>
          ) : (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <motion.button 
                onClick={handleLike}
                disabled={isLiking}
                className="bg-[#5c5049]/10 backdrop-blur-sm text-[#5c5049] p-2 rounded-full transition-all duration-300 hover:bg-[#5c5049] hover:text-white shadow-md"
                whileTap={{ scale: 0.9 }}
                animate={isLikeAnimating ? { scale: [1, 1.2, 1] } : {}}
              >
                <Icon name="Heart" size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
              </motion.button>
              <Link href={`/blog/${post.uid}`}>
                <motion.button 
                  className="bg-[var(--blog-accent)] text-white px-4 py-2 rounded-full transition-all duration-300 hover:bg-[#5c5049] text-sm font-medium shadow-md flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>읽기</span>
                  <Icon name="ArrowRight" size={14} />
                </motion.button>
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced image area */}
        <div className={`${mobile ? 'w-full' : 'col-span-3 sm:col-span-2 my-auto'} relative `}>
          <div className={`group/image relative ${mobile ? 'w-full h-48' : tablet ? 'w-28 h-28' : 'w-32 h-32'} ${!mobile && 'mx-auto'} `}>
            {!mobile && <div className="absolute -inset-1 bg-gradient-to-r from-[#5c5049]/20 to-[#5c5049]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>}
            <Image
              src={mainImage}
              alt={post.title}
              className={`relative bg-gray-100 border border-[var(--border-color)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${!mobile && 'group-hover:scale-105'} ${mobile ? 'rounded-lg' : 'rounded-xl'} object-cover shadow-md ${!mobile && 'group-hover:shadow-xl'}`}
              fill
              sizes={mobile ? "100vw" : "(max-width: 640px) 112px, 128px"}
              priority={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_POST_IMAGES[0];
              }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 ${!mobile && 'group-hover:opacity-100'} transition-opacity duration-700 ${mobile ? 'rounded-lg' : 'rounded-xl'}`}></div>
            
            {postImages.length > 1 && !mobile && (
              <div
                ref={toggleBtnRef}
                className={`z-30 absolute border rounded-full border-[var(--border-color)] bottom-1 right-1 w-8 h-8 bg-black/80 text-white flex items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:bg-white hover:text-black`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleInteraction}
              >
                <Icon name="Plus" size={12} />
              </div>
            )}
            
            {/* Mobile image indicator */}
            {mobile && postImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                <Icon name="Image" size={12} />
                <span>{postImages.length}</span>
              </div>
            )}
            
            {/* Mobile category overlay */}
            {mobile && post.category && (
              <div className="absolute top-2 left-2">
                <span className="bg-[var(--blog-accent)]/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {post.category.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Sequential images container */}
          <AnimatePresence>
            {isVisible && postImages.length > 1 && (
              <motion.div
                ref={slideContainerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex scale-x-[1] transition-all duration-500 ease-in-out absolute top-0 -left-27 gap-1 z-20 group -translate-x-[96px] sm:-translate-x-[125px] lg:-translate-x-[128px]"
              >
                {postImages.slice(1, 4).map((imageSrc, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative w-24 h-24 sm:w-28 sm:h-28"
                  >
                    <Image
                      src={imageSrc}
                      alt={`${post.title} ${index + 2}`}
                      className="bg-white border border-[var(--border-color)] transition duration-500 delay-100 rounded-lg object-cover"
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_POST_IMAGES[(index + 1) % DEFAULT_POST_IMAGES.length];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/5 to-transparent transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] z-5 rounded-lg"></div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5c5049]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </motion.article>
  );
});

interface BlogListProps {
  posts: Post[];
  className?: string;
}

export const List = memo(function List({ posts, className = '' }: BlogListProps) {
  const { mobile } = useAppSelector((state) => state.device);

  if (posts.length === 0) {
    return (
      <motion.div 
        className={`flex flex-col items-center justify-center ${mobile ? 'py-12' : 'py-16'} text-center px-4`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <Icon name="FileText" className={`${mobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto text-[#5c5049] opacity-20 mb-4`} />
          <motion.div
            className={`absolute inset-0 ${mobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto border-2 border-[#5c5049]/20 rounded-full`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <h3 className={`${mobile ? 'text-lg' : 'text-xl'} font-bold text-[var(--title)] mb-2`}>
          게시글이 없습니다
        </h3>
        <p className={`text-[var(--text-color)] opacity-70 ${mobile ? 'text-sm' : 'text-base'}`}>
          새로운 게시글이 곧 업데이트됩니다
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {posts.map((post, index) => (
        <motion.div
          key={post.uid}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <ListItem post={post} />
        </motion.div>
      ))}
    </div>
  );
});

ListItem.displayName = 'ListItem';
List.displayName = 'List';