import type { SearchItem } from '@/types/common/search';

export interface FeedProps {
  recent: SearchItem[];
  popular: SearchItem[];
  staticLoading: boolean;
  onNavigate?: () => void;
}

export interface SearchResultsProps {
  results: SearchItem[];
  isLoading: boolean;
  onNavigate?: () => void;
}