import Image from "next/image";
import { memo } from 'react';
import { SearchItem } from '@/types/search';
import { Icon } from "../Icon";
import { Badge } from "../Badge";

export const SearchCard = memo((post: SearchItem) => (
  <div
    className="flex flex-col gap-1 p-5 hover:bg-[var(--hover)] rounded cursor-pointer border border-[var(--border-color)] "
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
        <div className="flex gap-2">
          <span className="flex gap-1 items-center text-sm text-[var(--text-color)] opacity-70 line-clamp-1">
            <Icon name="Eye" size={12} /> : 10
          </span>
          <span className="flex gap-1 items-center text-sm text-[var(--text-color)] opacity-70 line-clamp-1">
            <Icon name="Heart" size={12} color="red" fill="red" /> : 10
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
));

SearchCard.displayName = 'SearchCard';