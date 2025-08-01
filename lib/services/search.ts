import { api } from '@/lib/fetch';
import { searchConfig } from '@/constants/search';
import { SearchItem } from '@/types/search';
import { APIResult } from '@/types/api'; // 이미 존재하는 APIResult 타입을 임포트합니다.

const staticData = async () => {
  // api.get은 APIResult<T> 형태의 전체 응답을 반환합니다.
  const { data } = await api.get<APIResult<{ recent: SearchItem[], popular: SearchItem[], recommend: string[] }>>('/api/search');
  // success 플래그를 확인합니다.

  // true이면, 실제 데이터를 반환합니다.
  return {
    recent: data.data?.recent ?? [],
    popular: data.data?.popular ?? [],
    recommend: data.data?.recommend ?? [],
  };
};

const searchResults = async (searchText: string) => {
  if (searchText.length <= 1) return [];
  
  // api.post의 제네릭과 인자 타입을 올바르게 수정합니다.
  const { data } = await api.post<APIResult<SearchItem[]>>('/api/search', {
    type: searchConfig.type.search,
    search: searchText
  });

  return data.data || [];
};

export const search = {
  staticData,
  searchResults,
};
