"use client";
import React, { memo } from "react";
import { createPortal } from "react-dom";
import { useSearch } from "@/hooks/search";
import { Icon } from "@/components/ui/Icon";
import { Feed } from "@/components/features/search/Feed";
import { motion, AnimatePresence } from "framer-motion";
import { SearchResults } from "@/components/features/search/Result";

export const SearchModal = memo(() => {
  const {
    modalOpen,
    query,
    debouncedQuery,
    results,
    isLoading,
    error,
    recent,
    popular,
    recommend,
    setCustomSearch,
    handleInputChange,
    handleKeyDown,
    closeModal,
  } = useSearch();

  if (!modalOpen) return null;

  const searchModal = (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 pointer-events-none"
          >
            <motion.div
              className="bg-panel rounded-lg w-full max-h-[90vh] max-w-2xl mx-4 border border-[var(--border-color)]  pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[var(--border-color)]  bg-header">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={closeModal}
                    className="w-6 h-6 self-end transition-colors p-1 rounded hover:bg-[var(--hover)] border border-[var(--border-color)] "
                    aria-label="검색 창 닫기"
                  >
                    <Icon name="X" size={12} className="m-auto" />
                  </button>
                  <div className="relative">
                    <input
                      name="search"
                      type="search"
                      placeholder="search"
                      className="w-full py-2 pl-10 border border-[var(--border-color)]  rounded pr-2"
                      value={query}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    <Icon name="Search" size={24} className="absolute top-2 left-2" />
                  </div>
                  {recommend.length > 0 && (
                    <motion.div
                      className="flex gap-2 items-center overflow-auto max-md:pb-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                      {recommend.map((term, index) => (
                        <motion.button
                          key={term}
                          onClick={() => setCustomSearch(term)}
                          className="px-3 py-1 hover:bg-[var(--hover)] bg-badge text-color rounded-full text-sm border border-[var(--border-color)]  whitespace-nowrap"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + index * 0.05 }}
                        >
                          {term}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              <motion.div
                className="overflow-y-auto max-h-[calc(80vh-100px)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {
                  (() => {
                    if (error) {
                      return (
                        <div className="p-4 text-center text-red-500">
                          {error.message}
                        </div>
                      );
                    } else if (debouncedQuery.length > 1) {
                      return <SearchResults results={results} isLoading={isLoading} />;
                    } else {
                      return <Feed recent={recent} popular={popular} staticLoading={isLoading} />;
                    }
                  })()
                }
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined'
    ? createPortal(searchModal, document.body)
    : null;
});

SearchModal.displayName = "SearchModal";
