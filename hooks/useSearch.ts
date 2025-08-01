import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { setQuery, setDebouncedQuery, clearSearch } from '@/stores/slice/search';
import { useSearchAPI } from './useSearchAPI';
import { filterField } from '@/utils/regex/input';
import { useModal } from './useModal';

interface SearchOptions {
  debounceDelay?: number;
  minLength?: number;
}

const DEFAULT_CONFIG = {
  debounceDelay: 500,
  minLength: 2,
} as const;

export const useSearch = (options?: SearchOptions) => {
  const dispatch = useAppDispatch();
  const searchState = useAppSelector(state => state.search);
  const modalOpen = useAppSelector(state => state.modal.search);
  const { setSearch } = useModal();

  const config = useMemo(() => ({
    debounceDelay: options?.debounceDelay ?? DEFAULT_CONFIG.debounceDelay,
    minLength: options?.minLength ?? DEFAULT_CONFIG.minLength,
  }), [options?.debounceDelay, options?.minLength]);

  const { results, recent, popular, recommend, isLoading, error } = useSearchAPI(searchState.debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchState.query.trim();
      const filtered = trimmed.length >= config.minLength ? filterField('search', trimmed) : '';
      dispatch(setDebouncedQuery(filtered));
    }, config.debounceDelay);
    return () => clearTimeout(timer);
  }, [searchState.query, dispatch, config.debounceDelay, config.minLength]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setQuery(e.target.value));
  }, [dispatch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      searchState.query ? dispatch(clearSearch()) : setSearch(false);
    }
  }, [searchState.query, dispatch, setSearch]);

  const closeModal = useCallback(() => setSearch(false), [setSearch]);
  const openModal = useCallback(() => setSearch(true), [setSearch]);
  const setCustomSearch = useCallback((value: string) => dispatch(setQuery(value)), [dispatch]);

  return useMemo(() => ({
    query: searchState.query,
    debouncedQuery: searchState.debouncedQuery,
    modalOpen,
    results,
    recent,
    popular,
    recommend,
    isLoading,
    error,
    handleInputChange,
    handleKeyDown,
    closeModal,
    openModal,
    setCustomSearch,
  }), [
    searchState.query,
    searchState.debouncedQuery,
    modalOpen,
    results,
    recent,
    popular,
    recommend,
    isLoading,
    error,
    handleInputChange,
    handleKeyDown,
    closeModal,
    openModal,
    setCustomSearch,
  ]);
};
