export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  image: string;
  category?: string;
  createdTime: string;
  views: number;
  likeCount: number;
  relevance?: number;
  snippet?: string;
}

export interface SearchHookReturn {
  search: string;
  searchText: string;
  results: SearchItem[];
  isLoading: boolean;
  error: Error | null;
  modal: boolean;
  recent: SearchItem[];
  popular: SearchItem[];
  recommend: string[];
  staticLoading: boolean;
  setSearch: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  open: () => void;
  close: () => void;
}

export interface SearchState {
  query: string;
  debouncedQuery: string;
  results: SearchItem[];
  isLoading: boolean;
  error: string | null;
  recent: SearchItem[];
  popular: SearchItem[];
  recommend: string[];
  staticLoading: boolean;
}
