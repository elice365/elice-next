import { memo } from "react";
import { SearchCard } from '@/components/ui/card/Search';
import { SearchItem } from '@/types/search';

export const SearchResults = memo<{ results: SearchItem[]; isLoading: boolean }>(({ results, isLoading }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4 text-[var(--text-color)]">검색 결과</h3>
    {
      (() => {
        if (isLoading) {
          return (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-color)] " />
            </div>
          );
        } else if (results.length === 0) {
          return (
            <p className="text-[var(--text-color)] opacity-70 text-center py-8">검색 결과가 없습니다.</p>
          );
        } else {
          return (
            <div className="space-y-2">
              {results.map((item) => <SearchCard key={item.id} {...item} />)}
            </div>
          );
        }
      })()
    }
  </div>
));

SearchResults.displayName = "SearchResults";
