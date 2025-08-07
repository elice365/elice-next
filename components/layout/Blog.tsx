'use client';

import { memo, useCallback, useEffect } from 'react';
import { Card } from '../features/blog/Card';
// import { Filters } from '../features/blog/Filters';
import { Icon } from '@/components/ui/Icon';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { 
  setLayout,
  selectBlogLayout,
  selectFilteredPosts,
  selectIsLoadingList,
  selectListError,
  fetchBlogPosts,
  selectCurrentPage,
  selectPostsPagination,
  setCurrentPage
} from '@/stores/slice/blog';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { List } from '../features/blog/List';

interface BlogLayoutProps {
  className?: string;
}

export const BlogLayout = memo(function BlogLayout({ className = '' }: BlogLayoutProps) {
  const dispatch = useAppDispatch();
  const { mobile, tablet, desktop } = useAppSelector((state) => state.device);
  const t = useTranslations("common");
  
  // Blog state
  const layout = useAppSelector(selectBlogLayout);
  const posts = useAppSelector(selectFilteredPosts);
  const isLoading = useAppSelector(selectIsLoadingList);
  const error = useAppSelector(selectListError);
  const currentPage = useAppSelector(selectCurrentPage);
  const pagination = useAppSelector(selectPostsPagination);
  const filters = useAppSelector((state) => state.blog.filters);

  // Load posts on mount and when filters change
  useEffect(() => {
    dispatch(fetchBlogPosts({
      page: currentPage,
      limit: 12,
      category: filters.category,
      tag: filters.tag,
      search: filters.search,
      sortBy: filters.sortBy || 'latest'
    }));
  }, [dispatch, currentPage, filters]);

  const handleLayoutChange = useCallback((newLayout: 'card' | 'list') => {
    dispatch(setLayout(newLayout));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (pagination?.hasNext) {
      dispatch(setCurrentPage(currentPage + 1));
    }
  }, [dispatch, pagination?.hasNext, currentPage]);

  const renderViewToggle = () => (
    <div className="flex items-center bg-[var(--selecter)] rounded-lg p-1">
      <motion.button
        onClick={() => handleLayoutChange('card')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]  overflow-hidden ${
          layout === 'card'
            ? 'bg-[var(--background)] text-[var(--hover-primary)] shadow-sm'
            : 'text-[var(--text-color)] hover:text-[var(--title)] hover:bg-[var(--hover)]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <Icon name="LayoutGrid" size={16} />
        {!mobile && <span>{t('card_view')}</span>}
      </motion.button>
      
      <motion.button
        onClick={() => handleLayoutChange('list')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]  overflow-hidden ${
          layout === 'list'
            ? 'bg-[var(--background)] text-[var(--hover-primary)] shadow-sm'
            : 'text-[var(--text-color)] hover:text-[var(--title)] hover:bg-[var(--hover)]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <Icon name="List" size={16} />
        {!mobile && <span>{t('list_view')}</span>}
      </motion.button>
    </div>
  );

  const renderPostCount = () => {
    const totalCount = pagination?.totalCount || 0;
    return (
      <div className="text-sm text-[var(--text-color)] opacity-60">
        {totalCount > 0 ? (
          <span>
            {t('showing')} {posts.length} {t('of')} {totalCount.toLocaleString()} {t('posts')}
          </span>
        ) : (
          <span>{t('no_posts')}</span>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && posts.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--hover-primary)]"></div>
            <p className="text-[var(--text-color)] opacity-60">
              {t('loading_posts')}
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="AlertCircle" className="w-12 h-12 mx-auto text-[var(--hover-error)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--title)] mb-2">
            {t('error_loading_posts')}
          </h3>
          <p className="text-[var(--text-color)] opacity-60 mb-4">
            {typeof error === 'string' ? error : (error as Error)?.message || 'An error occurred'}
          </p>
          <button
            type="button"
            className="bg-gradient-to-r from-[var(--hover-primary)] to-[var(--hover-primary)]/80 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300  overflow-hidden"
            onClick={() => dispatch(fetchBlogPosts({
              page: 1,
              limit: 12,
              category: filters.category,
              tag: filters.tag,
              search: filters.search,
              sortBy: filters.sortBy || 'latest'
            }))}
          >
            {t('retry')}
          </button>
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={layout}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {layout === 'card' ? (
            <div className={`grid gap-6 justify-items-center grid-cols-[repeat(auto-fit,minmax(280px,1fr))] ${
              mobile 
                ? 'grid-cols-1' 
                : tablet 
                  ? 'grid-cols-2' 
                  : desktop
                    ? 'grid-cols-3'
                    : 'grid-cols-3'
            }`}>
              {posts.map((post) => (
                <Card key={post.uid} post={post} />
              ))}
            </div>
          ) : (
            <List posts={posts} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderLoadMore = () => {
    if (!pagination?.hasNext || isLoading) return null;

    return (
      <div className="flex justify-center pt-8">
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoading}
          className="group relative bg-gradient-to-r from-[var(--hover-primary)] to-[var(--hover-primary)]/80 text-white px-8 py-4 rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-50 disabled:cursor-not-allowed  overflow-hidden"
        >
          <span className="relative z-10">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('loading')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icon name="ChevronDown" size={16} className="transition-transform duration-300 group-hover:translate-y-1" />
                <span>{t('load_more')}</span>
              </div>
            )}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with filters and view toggle */}
      <div className="space-y-4">
        {/* Filters */}
        {/* <Filters /> */}
        {/* Controls bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Post count */}
          {renderPostCount()}
          
          {/* View toggle */}
          {renderViewToggle()}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Load more */}
      {renderLoadMore()}

      {/* Loading overlay for pagination */}
      {isLoading && posts.length > 0 && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-[var(--background)] rounded-lg p-6 shadow-xl border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--hover-primary)]"></div>
              <span className="text-[var(--title)] font-medium">
                {t('loading_more_posts')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});

BlogLayout.displayName = 'BlogLayout';