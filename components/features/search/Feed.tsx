import { memo } from "react";
import { SearchCard } from '@/components/ui/card/Search';
import type { FeedProps } from '@/types/ui/search';

export const Feed = memo<FeedProps>(({ recent, popular, staticLoading, onNavigate }) => {
  // Ensure arrays are always arrays
  const safeRecent = Array.isArray(recent) ? recent : [];
  const safePopular = Array.isArray(popular) ? popular : [];
  
  return (
  <div className="p-4 space-y-6 lg:flex lg:gap-6 lg:space-y-0">
    {staticLoading ? (
      <div className="flex justify-center py-8 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-color)]" />
      </div>
    ) : (
      <>
        <div className="lg:flex-1">
          <h3 className="text-sm font-semibold mb-2 text-panel">최근 게시물</h3>
          <div className="space-y-2">
            {safeRecent.length > 0
              ? safeRecent.map((item) => <SearchCard key={item.id} {...item} onNavigate={onNavigate} />)
              : <p className="text-panel opacity-50 text-sm">최근 게시물이 없습니다.</p>
            }
          </div>
        </div>
        <div className="lg:flex-1">
          <h3 className="text-sm font-semibold mb-2 text-panel">인기 게시물</h3>
          <div className="space-y-2">
            {safePopular.length > 0
              ? safePopular.map((item) => <SearchCard key={item.id} {...item} onNavigate={onNavigate} />)
              : <p className="text-panel opacity-50 text-sm">인기 게시물이 없습니다.</p>
            }
          </div>
        </div>
      </>
    )}
  </div>
  );
});

Feed.displayName = "Feed";
