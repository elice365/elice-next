import { memo } from "react";
import { SearchCard } from '@/components/ui/card/Search';
import { SearchItem } from '@/types/search';

export const Feed = memo<{
  recent: SearchItem[];
  popular: SearchItem[];
  staticLoading: boolean;
}>(({ recent, popular, staticLoading }) => (
  <div className="p-4 space-y-6 lg:flex lg:gap-6 lg:space-y-0">
    {staticLoading ? (
      <div className="flex justify-center py-8 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-color)] " />
      </div>
    ) : (
      <>
        <div className="lg:flex-1">
          <h3 className="text-sm font-semibold mb-2 text-panel">최근 게시물</h3>
          <div className="space-y-2">
            {recent.length > 0
              ? recent.map((item) => <SearchCard key={item.id} {...item} />)
              : <p className="text-panel opacity-50 text-sm">최근 게시물이 없습니다.</p>
            }
          </div>
        </div>
        <div className="lg:flex-1">
          <h3 className="text-sm font-semibold mb-2 text-panel">인기 게시물</h3>
          <div className="space-y-2">
            {popular.length > 0
              ? popular.map((item) => <SearchCard key={item.id} {...item} />)
              : <p className="text-panel opacity-50 text-sm">인기 게시물이 없습니다.</p>
            }
          </div>
        </div>
      </>
    )}
  </div>
));

Feed.displayName = "Feed";
