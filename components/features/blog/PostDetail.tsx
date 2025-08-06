'use client';

import { memo, useRef } from 'react';
import { Post, PostContent } from '@/types/post';
import { useAppSelector } from '@/stores/hook';
import { Header } from './Header';
import { Gallery } from './Gallery';
import { Content } from './Content';
import { Sidebar } from './Sidebar';
import { MobileActions } from './MobileActions';
import { SellerInfo } from './SellerInfo';
import { ReadingProgressIndicator as ReadingProgress } from '@/components/ui/ReadingProgress';
import { PostSkeleton } from '@/components/ui/skeleton/Post';
import { Related } from './Related';
import { Comment } from './Comment';
import { useBlogActions } from '@/hooks/blog';
import { parseContent } from '@/utils/blog/contentParser';

interface BlogPostDetailProps {
  post: Post;
  content?: PostContent | null;
  isLoading?: boolean;
}

export const PostDetail = memo(function PostDetail({
  post,
  content,
  isLoading = false
}: BlogPostDetailProps) {
  const { mobile, tablet, desktop } = useAppSelector((state) => state.device);
  const articleRef = useRef<HTMLElement>(null!);
  const blogContent = parseContent(content);
  
  const {
    isLiked,
    isBookmarked,
    likeCount,
    handleLike,
    handleBookmark,
    handleShare
  } = useBlogActions(post);

  if (isLoading) {
    return <PostSkeleton />;
  }

  return (
    <>
      <ReadingProgress targetRef={articleRef} />
      
      <div className="bg-[var(--color-card)] w-full min-h-screen">
        <div className={`${
          mobile && !tablet ? 'px-4' :
          tablet ? 'max-w-4xl mx-auto px-6' :
          'max-w-7xl mx-auto px-6 lg:px-8'
        } py-4 m-3`}>
          <div className={`${desktop ? 'lg:grid lg:grid-cols-12 lg:gap-8' : ''}`}>
            {/* Main content area */}
            <article 
              ref={articleRef}
              className={`${desktop ? 'lg:col-span-8' : 'w-full'}`}
            >
              <Header 
                post={post}
                mobile={mobile}
                tablet={tablet}
              />

              {/* Product Gallery */}
              {blogContent?.product && blogContent.product.length > 0 && (
                <Gallery 
                  products={blogContent.product}
                  author={blogContent.author}
                  mobile={mobile}
                  tablet={tablet}
                />
              )}

              {/* Content Sections */}
              {blogContent?.content && (
                <Content 
                  sections={blogContent.content}
                  mobile={mobile}
                  tablet={tablet}
                />
              )}

              {/* Related Posts */}
              <div className={`${
                mobile && !tablet ? 'mt-8' :
                tablet ? 'mt-10' :
                'mt-12 lg:mt-16'
              }`}>
                <Related
                  currentPostId={post.uid}
                  category={post.category?.slug}
                  tags={post.tags.map(tag => tag.name)}
                />
              </div>

              {/* Comment Section */}
              <div className={`${
                mobile && !tablet ? 'mt-8' :
                tablet ? 'mt-10' :
                'mt-12 lg:mt-16'
              }`}>
                <Comment 
                  postId={post.uid} 
                  className="border border-[var(--border-color)] rounded-xl"
                />
              </div>
            </article>

            {/* Desktop Sidebar */}
            {desktop && (
              <Sidebar
                post={post}
                blogContent={blogContent}
                isLiked={isLiked}
                isBookmarked={isBookmarked}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
              />
            )}
          </div>

          {/* Mobile/Tablet Author Info */}
          {!desktop && blogContent?.author && (
            <section className={`${mobile && !tablet ? 'mt-8' : 'mt-10'}`}>
              <SellerInfo 
                author={blogContent.author}
                variant="mobile"
              />
            </section>
          )}

          {/* Mobile/Tablet Actions */}
          {!desktop && (
            <MobileActions
              post={post}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              likeCount={likeCount}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          )}
        </div>
      </div>
    </>
  );
});

PostDetail.displayName = 'PostDetail';