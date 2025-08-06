import useSWR from 'swr';
import { search } from '@/lib/services/search';
import { searchConfig } from '@/constants/search';

// 이 훅은 오직 "데이터를 가져오는 책임"만 가집니다.
export const useSearchAPI = (debouncedQuery: string) => {
  // 정적 데이터 페칭
  const {
    data: staticData,
    isLoading: isStaticLoading,
    error: staticError,
  } = useSWR('search-static', search.staticData, searchConfig.option);

  // 실시간 검색 결과 페칭
  const {
    data: results,
    isLoading: isResultsLoading,
    error: resultsError,
  } = useSWR(
    debouncedQuery ? ['search-results', debouncedQuery] : null,
    ([, query]) => search.searchResults(query),
    searchConfig.option
  );

  return {
    // 명확한 이름으로 반환
    recent: staticData?.recent ?? [],
    popular: staticData?.popular ?? [],
    recommend: staticData?.recommend ?? [],
    results: results ?? [],
    isLoading: isStaticLoading || isResultsLoading, 
    error: staticError || resultsError,
  };
};
