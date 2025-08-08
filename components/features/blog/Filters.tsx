'use client';

import { memo, useCallback, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Translated } from '@/components/i18n/Translated';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { 
  setFilters,
  clearFilters,
  selectBlogFilters,
  selectCategories,
  selectTags,
  selectIsLoadingMetadata,
  fetchCategories,
  fetchTags
} from '@/stores/slice/blog';
import { motion, AnimatePresence } from 'framer-motion';

export const Filters = memo(function Filters() {
  const dispatch = useAppDispatch();
  const { mobile } = useAppSelector((state) => state.device);
  
  // Blog state
  const filters = useAppSelector(selectBlogFilters);
  const categories = useAppSelector(selectCategories);
  const tags = useAppSelector(selectTags);
  const isLoadingMetadata = useAppSelector(selectIsLoadingMetadata);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Load categories and tags on mount
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories({ type: 'list' }));
    }
    if (tags.length === 0) {
      dispatch(fetchTags({ type: 'list' }));
    }
  }, [dispatch, categories.length, tags.length]);

  // Sync search term with filters
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm.trim() || undefined }));
  }, [dispatch, searchTerm]);

  const handleCategorySelect = useCallback((categorySlug: string) => {
    dispatch(setFilters({ 
      category: filters.category === categorySlug ? undefined : categorySlug 
    }));
  }, [dispatch, filters.category]);

  const handleTagSelect = useCallback((tagName: string) => {
    dispatch(setFilters({ 
      tag: filters.tag === tagName ? undefined : tagName 
    }));
  }, [dispatch, filters.tag]);

  const handleSortChange = useCallback((sortBy: 'latest' | 'popular' | 'views') => {
    dispatch(setFilters({ sortBy }));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    setSearchTerm('');
  }, [dispatch]);

  const hasActiveFilters = Boolean(
    filters.category || filters.tag || filters.search || filters.sortBy !== 'latest'
  );

  const renderSearchBar = () => (
    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
      <div className="relative">
        <Icon 
          name="Search" 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={Translated('common', 'search_posts')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              dispatch(setFilters({ search: undefined }));
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>
    </form>
  );

  const renderSortOptions = () => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {Translated('common', 'sort_by')}:
      </span>
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(['latest', 'popular', 'views'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => handleSortChange(sort)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
              filters.sortBy === sort
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {Translated('common', sort)}
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategories = () => {
    if (categories.length === 0) return null;

    const displayCategories = mobile ? categories.slice(0, 4) : categories.slice(0, 8);
    const hasMore = categories.length > (mobile ? 4 : 8);

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Translated('common', 'categories')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((category) => (
            <motion.button
              key={category.uid}
              onClick={() => handleCategorySelect(category.slug)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                filters.category === category.slug
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.name}</span>
              {category._count?.posts && (
                <Badge className="bg-white/20 text-xs">
                  {category._count.posts}
                </Badge>
              )}
            </motion.button>
          ))}
          {hasMore && (
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Icon name={isFiltersExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
              <span>+{categories.length - (mobile ? 4 : 8)}</span>
            </button>
          )}
        </div>
        
        {/* Expanded categories */}
        <AnimatePresence>
          {isFiltersExpanded && hasMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              {categories.slice(mobile ? 4 : 8).map((category) => (
                <motion.button
                  key={category.uid}
                  onClick={() => handleCategorySelect(category.slug)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    filters.category === category.slug
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span>{category.name}</span>
                  {category._count?.posts && (
                    <Badge className="bg-white/20 text-xs">
                      {category._count.posts}
                    </Badge>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderTags = () => {
    if (tags.length === 0) return null;

    const popularTags = tags
      .sort((a, b) => (b._count?.posts || 0) - (a._count?.posts || 0))
      .slice(0, mobile ? 6 : 10);

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Translated('common', 'popular_tags')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <motion.button
              key={tag.uid}
              onClick={() => handleTagSelect(tag.name)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                filters.tag === tag.name
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>#{tag.name}</span>
              {tag._count?.posts && (
                <Badge className="bg-white/20 text-xs">
                  {tag._count.posts}
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {Translated('common', 'active_filters')}:
        </span>
        
        {filters.category && (
          <Badge className="bg-primary text-white flex items-center gap-1">
            <span>{categories.find(c => c.slug === filters.category)?.name}</span>
            <button
              onClick={() => filters.category && handleCategorySelect(filters.category)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <Icon name="X" size={12} />
            </button>
          </Badge>
        )}
        
        {filters.tag && (
          <Badge className="bg-primary text-white flex items-center gap-1">
            <span>#{filters.tag}</span>
            <button
              onClick={() => filters.tag && handleTagSelect(filters.tag)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <Icon name="X" size={12} />
            </button>
          </Badge>
        )}
        
        {filters.search && (
          <Badge className="bg-primary text-white flex items-center gap-1">
            <span>"{filters.search}"</span>
            <button
              onClick={() => dispatch(setFilters({ search: undefined }))}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <Icon name="X" size={12} />
            </button>
          </Badge>
        )}
        
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm underline"
        >
          {Translated('common', 'clear_all')}
        </button>
      </div>
    );
  };

  if (isLoadingMetadata) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1 max-w-md"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`filter-skeleton-category-${i}`} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Search and Sort */}
      <div className={`flex ${mobile ? 'flex-col items-stretch' : 'flex-row items-center'} gap-4`}>
        {renderSearchBar()}
        {renderSortOptions()}
      </div>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Categories */}
      {renderCategories()}

      {/* Tags */}
      {renderTags()}
    </div>
  );
});

Filters.displayName = 'Filters';