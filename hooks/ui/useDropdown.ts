"use client";
import { useRef, useState, useCallback } from 'react';
import { useClickOutside } from '../utils';

export function useDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null!);
  
  useClickOutside(dropdownRef, () => setOpen(false));
  
  const toggleDropdown = useCallback(() => setOpen((prev) => !prev), []);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  
  return {
    open,
    setOpen,
    dropdownRef,
    toggleDropdown,
    handleKeyDown
  };
}