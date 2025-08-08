'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';
import { PostType } from '@/types/blog/post';

interface ListItemContentProps {
  readonly post: PostType;
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly getTitleTextSize: (mobile: boolean, tablet: boolean) => string;
}

export function ListItemContent({ 
  post, 
  mobile, 
  tablet, 
  getTitleTextSize 
}: ListItemContentProps) {
  return (
    <div className={`${mobile ? 'w-full' : 'col-span-7 sm:col-span-8'} space-y-2 relative`}>
      {/* Title */}
      <Link href={`/blog/${post.uid}`}>
        <h3 className={`${getTitleTextSize(mobile, tablet)} font-bold text-[var(--title)] hover:text-[var(--hover-text)] transition-all duration-300 line-clamp-2 leading-snug tracking-tight group-hover:text-[var(--hover-text)]`}>
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
            key={`tag-${tag.uid || tag.name}-${index}`} 
            className={`${mobile ? 'text-[11px]' : 'text-xs'} bg-[var(--selecter)] hover:bg-[#5c5049]/10 text-[var(--text-color)] px-2 py-1 rounded-full transition-all duration-300 flex items-center gap-1 border border-transparent hover:border-[#5c5049]/20`}
            whileHover={!mobile ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="Tag" size={mobile ? 10 : 11} className="opacity-60" />
            <span>{tag.name}</span>
          </motion.span>
        ))}
        {mobile && post.tags.length > 1 && (
          <span className="text-[11px] text-[var(--text-color)] opacity-50">
            +{post.tags.length - 1}
          </span>
        )}
      </div>
    </div>
  );
}