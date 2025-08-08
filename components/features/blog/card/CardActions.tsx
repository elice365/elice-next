import { memo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PostType } from '@/types/blog/post';

interface CardActionsProps {
  post: PostType;
  mobile: boolean;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

export const CardActions = memo(function CardActions({
  post,
  mobile,
  isLikeAnimating,
  isBookmarked,
  onLike,
  onBookmark
}: CardActionsProps) {
  if (mobile) {
    return (
      <MobileActions
        post={post}
        isLikeAnimating={isLikeAnimating}
        isBookmarked={isBookmarked}
        onLike={onLike}
        onBookmark={onBookmark}
      />
    );
  }

  return (
    <DesktopActions
      post={post}
      isLikeAnimating={isLikeAnimating}
      isBookmarked={isBookmarked}
      onLike={onLike}
      onBookmark={onBookmark}
    />
  );
});

interface MobileActionsProps {
  post: PostType;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

const MobileActions = memo(function MobileActions({
  post,
  isLikeAnimating,
  isBookmarked,
  onLike,
  onBookmark
}: MobileActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-3">
      <LikeButton
        isLiked={post.isLiked || false}
        isAnimating={isLikeAnimating}
        onClick={onLike}
        mobile={true}
      />
      <BookmarkButton
        isBookmarked={isBookmarked}
        onClick={onBookmark}
        mobile={true}
      />
      <ViewMoreButton postId={post.uid} mobile={true} />
    </div>
  );
});

interface DesktopActionsProps {
  post: PostType;
  isLikeAnimating: boolean;
  isBookmarked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBookmark: () => void;
}

const DesktopActions = memo(function DesktopActions({
  post,
  isLikeAnimating,
  isBookmarked,
  onLike,
  onBookmark
}: DesktopActionsProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-gradient-to-t from-[var(--blog-accent)]/100 via-[var(--blog-accent)]/100 to-[var(--blog-accent)]/100 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LikeButton
            isLiked={post.isLiked || false}
            isAnimating={isLikeAnimating}
            onClick={onLike}
            mobile={false}
          />
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={onBookmark}
            mobile={false}
          />
        </div>
        <ViewMoreButton postId={post.uid} mobile={false} />
      </div>
    </div>
  );
});

interface LikeButtonProps {
  isLiked: boolean;
  isAnimating: boolean;
  onClick: (e: React.MouseEvent) => void;
  mobile: boolean;
}

const LikeButton = memo(function LikeButton({
  isLiked,
  isAnimating,
  onClick,
  mobile
}: LikeButtonProps) {
  const buttonClassName = getLikeButtonClassName(mobile);
  const iconClassName = getIconClassName(isLiked, mobile);

  return (
    <motion.button
      onClick={onClick}
      className={buttonClassName}
      whileTap={{ scale: 0.9 }}
      animate={isAnimating ? { scale: [1, mobile ? 1.2 : 1.3, 1] } : {}}
    >
      <Icon
        name="Heart"
        size={mobile ? 14 : 18}
        fill={isLiked ? 'currentColor' : 'none'}
        className={iconClassName}
      />
      {!mobile && isLiked && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-400/30"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
});

function getLikeButtonClassName(mobile: boolean): string {
  if (mobile) {
    return 'bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] p-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)] active:text-white';
  }
  return 'relative text-white bg-white/20 backdrop-blur-xl p-2.5 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 shadow-lg group/btn';
}

function getIconClassName(isLiked: boolean, mobile: boolean): string {
  if (mobile) {
    return isLiked ? 'text-red-400' : 'text-white';
  }
  return `transition-colors duration-300 ${isLiked ? 'text-red-400' : 'group-hover/btn:text-red-300'}`;
}

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
  mobile: boolean;
}

const BookmarkButton = memo(function BookmarkButton({
  isBookmarked,
  onClick,
  mobile
}: BookmarkButtonProps) {
  const buttonClassName = getBookmarkButtonClassName(mobile);
  const iconClassName = getBookmarkIconClassName(isBookmarked, mobile);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={buttonClassName}
      whileTap={!mobile ? { scale: 0.9 } : {}}
    >
      <Icon
        name="Bookmark"
        size={mobile ? 14 : 18}
        fill={isBookmarked ? "currentColor" : "none"}
        className={iconClassName}
      />
    </motion.button>
  );
});

function getBookmarkButtonClassName(mobile: boolean): string {
  if (mobile) {
    return 'bg-[var(--blog-accent)]/10 text-[var(--blog-accent)] p-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)] active:text-white';
  }
  return 'text-white bg-white/20 backdrop-blur-xl p-2.5 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 shadow-lg group/btn';
}

function getBookmarkIconClassName(isBookmarked: boolean, mobile: boolean): string {
  if (mobile) {
    return 'text-white';
  }
  return `transition-colors duration-300 ${isBookmarked ? 'text-yellow-400' : 'group-hover/btn:text-yellow-300'}`;
}

interface ViewMoreButtonProps {
  postId: string;
  mobile: boolean;
}

const ViewMoreButton = memo(function ViewMoreButton({ postId, mobile }: ViewMoreButtonProps) {
  if (mobile) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `/blog/${postId}`;
        }}
        className="bg-[var(--blog-accent)] text-white px-4 py-2 rounded-full transition-all duration-300 active:bg-[var(--blog-accent)]/90 text-xs font-medium w-full flex items-center justify-center gap-1 flex-1"
      >
        <span>자세히 보기</span>
        <Icon name="ArrowRight" size={12} />
      </button>
    );
  }

  return (
    <motion.button
      className="text-white bg-white/25 backdrop-blur-xl px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-white/35 hover:scale-105 text-sm font-semibold shadow-lg flex items-center gap-2 group/btn"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.95 }}
    >
      <span>자세히 보기</span>
      <Icon name="ArrowRight" size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
    </motion.button>
  );
});

CardActions.displayName = 'CardActions';