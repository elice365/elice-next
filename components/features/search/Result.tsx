import { memo } from "react";
import { SearchCard } from '@/components/ui/card/Search';
import type { SearchItem } from '@/types/common/search';
import type { SearchResultsProps } from '@/types/ui/search';

export const SearchResults = memo<SearchResultsProps>(({ results, isLoading, onNavigate }) => {
  // Ensure results is always an array
  const safeResults = Array.isArray(results) ? results : [];
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-[var(--text-color)]">검색 결과</h3>
      {
        (() => {
          if (isLoading) {
            return (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-color)]" />
              </div>
            );
          } else if (safeResults.length === 0) {
            return (
              <p className="text-[var(--text-color)] opacity-70 text-center py-8">검색 결과가 없습니다.</p>
            );
          } else {
            return (
              <div className="space-y-2">
                {safeResults.map((item) => <SearchCard key={item.id} {...item} onNavigate={onNavigate} />)}
              </div>
            );
          }
        })()
      }
    </div>
  );
});

SearchResults.displayName = "SearchResults";
