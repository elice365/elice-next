"use client";
import { useSearch } from '@/hooks/useSearch';
import { Icon } from '@/components/ui/Icon';

export const SearchInput = () => {
  const { query, handleInputChange, handleKeyDown, openModal } = useSearch();

  return (
    <div className="relative w-full">
      <input
        name="search"
        type="search"
        placeholder="Search..."
        className="w-full py-2 pl-10 pr-2 border border-[var(--border-color)]  rounded-sm transition-colors duration-500 cursor-pointer"
        value={query}
        onClick={openModal}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <Icon name="Search" size={24} className="absolute top-1/2 -translate-y-1/2 left-2" />
    </div>
  );
};

SearchInput.displayName = "SearchInput";
