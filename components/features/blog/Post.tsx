'use client';

import { memo, useRef } from 'react';
import { PostType, PostContent } from '@/types/blog/post';
import { useAppSelector } from '@/stores/hook';
import { Header } from './Header';
import { Gallery } from './Gallery';
import { Content } from './Content';
import { SellerInfo } from './SellerInfo';
import { ReadingProgressIndicator as ReadingProgress } from '@/components/ui/ReadingProgress';
import { PostSkeleton } from '@/components/ui/skeleton/Post';
import { Comment } from './Comment';
import { useBlogActions } from '@/hooks/blog';
import { parseContent } from '@/utils/blog/contentParser';
import { Actions } from './Actions';

interface BlogPostProps {
  post: PostType;
  content?: PostContent | null;
  isLoading?: boolean;
}

export const Post = memo(function Post({
  post,
  content,
  isLoading = false
}: BlogPostProps) {
  const { mobile, tablet } = useAppSelector((state) => state.device);
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

      <div className="bg-[var(--color-panel)] w-full min-h-screen">
        <div>
          <div className="w-full">
            {/* Main content area - 통합된 카드 디자인 */}
            <article
              ref={articleRef}
              className={`bg-[var(--background)] border border-[var(--border-color)] shadow-sm `}
            >

              {/* Product Gallery with Card Style */}
              {blogContent?.product && blogContent.product.length > 0 && (
                <Gallery
                  products={blogContent.product}
                  author={blogContent.author}
                  mobile={mobile}
                  tablet={tablet}
                />
              )}
              <div className='p-4 m-2 md:m-12'>
                {(!mobile || tablet) && (
                  <Header
                    post={post}
                    mobile={mobile}
                    tablet={tablet}
                  />
                )}


                {/* Content Sections - 자연스럽게 이어지도록 */}
                {blogContent?.content && (
                  <Content
                    sections={blogContent.content}
                    mobile={mobile}
                    tablet={tablet}
                  />
                )}
                <Actions
                  isLiked={isLiked}
                  isBookmarked={isBookmarked}
                  likeCount={likeCount}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                />


                {/* Comment Section - border와 shadow 제거, 자연스럽게 이어짐 */}
                <div className={`border-t border-[var(--border-color)] pt-3`}>
                  <Comment
                    postId={post.uid}
                    className=""
                  />
                </div>


              </div>
              {/* Mobile/Tablet Author Info */}
              {blogContent?.author && (
                <section>
                  <SellerInfo
                    author={blogContent.author}
                    variant="mobile"
                  />
                </section>
              )}
            </article>
          </div>
        </div>
      </div>
    </>
  );
});

Post.displayName = 'Post';