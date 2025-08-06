"use client";

import { useState, useCallback, useEffect } from "react";

interface UseModalStateProps {
  onOpen?: () => void;
  onClose?: () => void;
  defaultOpen?: boolean;
}

interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModalState({
  onOpen,
  onClose,
  defaultOpen = false
}: UseModalStateProps = {}): UseModalStateReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState) {
        onOpen?.();
      } else {
        onClose?.();
      }
      return newState;
    });
  }, [onOpen, onClose]);

  return { isOpen, open, close, toggle };
}