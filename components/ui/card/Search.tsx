'use client';

import Image from "next/image";
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchItem } from '@/types/common/search';
import { Icon } from "../Icon";
import { Badge } from "../Badge";

interface SearchCardProps extends SearchItem {
  onNavigate?: () => void;
}

export const SearchCard = memo<SearchCardProps>(({ onNavigate, ...post }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(post.url);
    onNavigate?.();
  };
  
  return (
    <div
      className="flex flex-col gap-1 p-5 hover:bg-[var(--hover)] rounded cursor-pointer border border-[var(--border-color)] transition-colors"
      onClick={handleClick}
    >

    <div className="flex gap-3 flex-1 min-w-0">
      <div className="w-16 h-16 bg-background rounded flex-shrink-0 overflow-hidden border border-[var(--border-color)] ">
        <Image
          src={post.image}
          alt={post.title}
          width={64}
          height={64}
          className="w-full h-full object-cover sr-only"
        />
      </div>
      <div>
        <h3 className="font-medium text-[var(--text-color)] line-clamp-1 mb-0.5">{post.title}</h3>
        {post.description && (
          <p className="text-sm text-[var(--text-color)] opacity-70 line-clamp-1">{post.description}</p>
        )}
        <div className="flex gap-3">
          <span className="flex gap-1 items-center text-sm text-[var(--text-color)] opacity-70">
            <Icon name="Eye" size={12} />
            <span>{post.views || 0}</span>
          </span>
          <span className="flex gap-1 items-center text-sm text-[var(--text-color)] opacity-70">
            <Icon name="Heart" size={12} />
            <span>{post.likeCount || 0}</span>
          </span>
        </div>
      </div>

    </div>
    {post.category && (
      <div className="mt-1">
        <Badge className="bg-badge rounded border border-[var(--border-color)] ">
          {post.category}
        </Badge>
      </div>
    )}
  </div>
  );
});

SearchCard.displayName = 'SearchCard';