import { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PostType } from '@/types/post';

interface CardImageProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
  imageError: boolean;
  onImageError: () => void;
}

const DEFAULT_POST_IMAGE = "https://placehold.co/350x200.png";

// Get image height class based on device
const getImageHeightClass = (mobile: boolean, tablet: boolean): string => {
  if (mobile) return "h-[180px]";
  if (tablet) return "h-[200px]";
  return "h-[220px]";
};

// Get the main image with fallback
const getImageSrc = (images: string[] | Record<string, string> | string): string => {
  // Handle new array format
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  // Handle legacy object format
  if (images && typeof images === 'object' && !Array.isArray(images)) {
    if ('main' in images && images.main) return images.main;
    if ('thumbnail' in images && images.thumbnail) return images.thumbnail;
    if ('src' in images && images.src) return images.src;
    if ('url' in images && images.url) return images.url;
  }
  // Handle string format
  if (typeof images === 'string') return images;

  return DEFAULT_POST_IMAGE;
};

export const CardImage = memo(function CardImage({ 
  post, 
  mobile, 
  tablet, 
  imageError, 
  onImageError 
}: CardImageProps) {
  const mainImage = imageError ? DEFAULT_POST_IMAGE : getImageSrc(post.images);
  const imageHeight = getImageHeightClass(mobile, tablet);

  return (
    <div className={`${imageHeight} relative overflow-hidden bg-gray-100`}>
      {/* Gradient overlay for better text readability */}
      <div className={`absolute inset-0 bg-gradient-to-t to-transparent opacity-0 ${!mobile && 'group-hover:opacity-100'} transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-10`}></div>
      
      {/* Blur mask - desktop only */}
      {!mobile && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--blog-accent)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[5]"></div>
      )}
      
      <Image
        src={mainImage}
        alt={post.title}
        className={`bg-gray-200 object-cover w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${!mobile && 'group-hover:scale-110 group-hover:brightness-90'}`}
        width={500}
        height={300}
        onError={onImageError}
        priority={false}
      />

      {/* Category Badge */}
      {post.category && (
        <CategoryBadge 
          category={post.category} 
          mobile={mobile} 
        />
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <TagsList 
          tags={post.tags} 
          mobile={mobile} 
        />
      )}
    </div>
  );
});

interface CategoryBadgeProps {
  category: any;
  mobile: boolean;
}

const CategoryBadge = memo(function CategoryBadge({ category, mobile }: CategoryBadgeProps) {
  return (
    <motion.div 
      className={`absolute ${mobile ? 'top-2 left-2' : 'top-3 left-3'} z-20`}
      initial={!mobile ? { opacity: 0, x: -20 } : {}}
      animate={!mobile ? { opacity: 1, x: 0 } : {}}
      transition={!mobile ? { delay: 0.1, duration: 0.4 } : {}}
    >
      <span className={getCategoryBadgeClassName(mobile)}>
        {category.name}
      </span>
    </motion.div>
  );
});

function getCategoryBadgeClassName(mobile: boolean): string {
  const baseClasses = 'bg-[var(--blog-accent)]/90 backdrop-blur-md text-white rounded-full font-medium transition-all duration-300';
  const mobileClasses = mobile ? 'text-[11px] px-2.5 py-1 shadow-md' : '';
  const desktopClasses = !mobile ? 'text-xs px-3 py-1.5 shadow-lg group-hover:bg-[var(--blog-accent)] group-hover:shadow-xl' : '';
  
  return `${baseClasses} ${mobileClasses} ${desktopClasses}`.trim();
}

interface TagsListProps {
  tags: any[];
  mobile: boolean;
}

const TagsList = memo(function TagsList({ tags, mobile }: TagsListProps) {
  const maxTags = mobile ? 2 : 3;
  const visibleTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;

  return (
    <motion.div 
      className={(() => {
        const baseClasses = 'absolute z-20 flex flex-wrap';
        const positionClasses = mobile ? 'bottom-2 left-2 gap-1' : 'bottom-3 left-3 gap-1.5';
        return `${baseClasses} ${positionClasses}`;
      })()}
      initial={!mobile ? { opacity: 0, y: 20 } : {}}
      animate={!mobile ? { opacity: 1, y: 0 } : {}}
      transition={!mobile ? { delay: 0.2, duration: 0.4 } : {}}
    >
      {visibleTags.map((tag, index) => (
        <TagItem key={`tag-${tag.id || tag.name}-${index}`} tag={tag} mobile={mobile} index={index} />
      ))}
      {remainingCount > 0 && (
        <RemainingTagsCount count={remainingCount} mobile={mobile} />
      )}
    </motion.div>
  );
});

interface TagItemProps {
  tag: any;
  mobile: boolean;
  index: number;
}

const TagItem = memo(function TagItem({ tag, mobile, index }: TagItemProps) {
  return (
    <motion.span 
      className={getTagClassName(mobile)}
      initial={!mobile ? { opacity: 0, scale: 0.8 } : {}}
      animate={!mobile ? { opacity: 1, scale: 1 } : {}}
      transition={!mobile ? { delay: 0.3 + index * 0.1, duration: 0.3 } : {}}
    >
      <Icon name="Tag" size={mobile ? 10 : 11} className="opacity-70" />
      {tag.name}
    </motion.span>
  );
});

function getTagClassName(mobile: boolean): string {
  const baseClasses = 'bg-black/70 backdrop-blur-sm text-white rounded-md inline-flex items-center gap-1 shadow-md transition-all duration-300';
  const sizeClasses = mobile ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const hoverClasses = !mobile ? 'group-hover:bg-black/80' : '';
  
  return `${baseClasses} ${sizeClasses} ${hoverClasses}`.trim();
}

interface RemainingTagsCountProps {
  count: number;
  mobile: boolean;
}

const RemainingTagsCount = memo(function RemainingTagsCount({ count, mobile }: RemainingTagsCountProps) {
  return (
    <span className={`bg-black/70 backdrop-blur-sm text-white ${mobile ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-md shadow-md`}>
      +{count}
    </span>
  );
});

CardImage.displayName = 'CardImage';