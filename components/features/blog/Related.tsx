'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post';
import { usePost } from '@/hooks/blog';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useAppSelector } from '@/stores/hook';
import { motion } from 'framer-motion';

interface RelatedPostsProps {
  currentPostId: string;
  category?: string;
  tags?: string[];
  className?: string;
}

// Helper functions to avoid nested ternary operators
function getMaxPosts(mobile: boolean, tablet: boolean): number {
  if (mobile) return 3;
  if (tablet) return 4;
  return 6;
}

function getGridCols(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'grid-cols-1';
  if (tablet) return 'grid-cols-2';
  return 'grid-cols-3';
}

function getImageSizes(mobile: boolean, tablet: boolean): string {
  if (mobile) return '100vw';
  if (tablet) return '50vw';
  return '33vw';
}

function filterUniquePostsExcludingCurrent(posts: any[], currentPostId: string, existingPosts: Post[] = []): Post[] {
  return posts
    .filter((post: Post) => post.uid !== currentPostId)
    .filter((post: Post) => !existingPosts.some((p: Post) => p.uid === post.uid));
}

function processTagResults(tagResults: any[], currentPostId: string, existingPosts: Post[]): Post[] {
  const tagPosts = tagResults.flatMap((result: any) => result.posts);
  return filterUniquePostsExcludingCurrent(tagPosts, currentPostId, existingPosts);
}

function processLatestPosts(latestResult: any, currentPostId: string, existingPosts: Post[]): Post[] {
  return filterUniquePostsExcludingCurrent(latestResult.posts, currentPostId, existingPosts);
}

export const Related = memo(function Related({
  currentPostId,
  category,
  tags = [],
  className = ''
}: RelatedPostsProps) {
  const { mobile, tablet } = useAppSelector((state) => state.device);
  const { fetchPostList, loading } = usePost();
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        // First try to get posts from the same category
        let posts: Post[] = [];
        
        if (category) {
          const categoryResult = await fetchPostList({
            category,
            limit: 6,
            sortBy: 'popular'
          });
          posts = categoryResult.posts.filter((post: Post) => post.uid !== currentPostId);
        }

        // If we don't have enough posts from category, try by tags
        if (posts.length < 3 && tags.length > 0) {
          const tagResults = await Promise.all(
            tags.slice(0, 2).map(tag => 
              fetchPostList({
                tag,
                limit: 4,
                sortBy: 'popular'
              })
            )
          );
          
          const tagPosts = processTagResults(tagResults, currentPostId, posts);
          
          posts = [...posts, ...tagPosts];
        }

        // If still not enough, get latest posts
        if (posts.length < 3) {
          const latestResult = await fetchPostList({
            limit: 6,
            sortBy: 'latest'
          });
          
          const latestPosts = processLatestPosts(latestResult, currentPostId, posts);
          
          posts = [...posts, ...latestPosts];
        }

        // Limit to 3-6 posts depending on screen size
        const maxPosts = getMaxPosts(mobile, tablet);
        setRelatedPosts(posts.slice(0, maxPosts));
      } catch (error) {
        logger.error('Failed to load related posts', 'UI', error);
      }
    };

    loadRelatedPosts();
  }, [currentPostId, category, tags, fetchPostList, mobile, tablet]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading && relatedPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          관련 글
        </h2>
        <div className={`grid gap-6 ${getGridCols(mobile, tablet)}`}>
          {[...Array(getMaxPosts(mobile, tablet))].map((_, index) => (
            <div key={`skeleton-${index}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        관련 글
      </h2>
      <div className={`grid gap-6 ${getGridCols(mobile, tablet)}`}>
        {relatedPosts.map((post, index) => {
          // Get main image with fallback - updated for array-based images
          const getMainImage = (images: string[] | any): string => {
            // Handle new array format
            if (Array.isArray(images) && images.length > 0) {
              return images[0];
            }
            // Handle legacy object format
            if (images && typeof images === 'object') {
              if (images.main) return images.main;
              if (images.thumbnail) return images.thumbnail;
            }
            // Handle string format
            if (typeof images === 'string') return images;
            
            return "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Blog+Post";
          };
          
          const mainImage = getMainImage(post.images);
          
          return (
            <motion.article
              key={post.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <Link href={`/blog/${post.uid}`} className="block">
                {/* Image */}
                {mainImage && (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={mainImage}
                      alt={post.title}
                      fill
                      sizes={getImageSizes(mobile, tablet)}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {post.category && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 text-white backdrop-blur-sm text-xs">
                          {post.category.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <time dateTime={post.createdTime.toString()}>
                      {formatDate(post.createdTime)}
                    </time>
                    {!mainImage && post.category && (
                      <Badge className="text-primary border-primary/20 text-xs">
                        {post.category.name}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 text-sm leading-tight">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Icon name="Eye" size={14} />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Heart" size={14} />
                        <span>{post.likeCount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Tags - show just one */}
                    {post.tags.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        #{post.tags[0].name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>

      {/* View More Button */}
      <div className="text-center mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <span>더 많은 글 보기</span>
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
    </div>
  );
});

Related.displayName = 'Related';