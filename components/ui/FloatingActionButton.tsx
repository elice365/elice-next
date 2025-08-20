"use client";

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import type { FloatingActionButtonProps, MobileActionBarProps } from '@/types/ui/components';

/**
 * FloatingActionButton - 모바일 환경을 위한 플로팅 액션 버튼
 * 
 * Features:
 * - 메인 버튼 클릭 시 서브 액션 펼치기
 * - 테마 인식 스타일링
 * - 부드러운 애니메이션
 * - 데스크톱에서 자동 숨김 옵션
 * 
 * @example
 * ```tsx
 * <FloatingActionButton
 *   actions={[
 *     { label: '새 글', icon: 'Plus', onClick: handleCreate },
 *     { label: '필터', icon: 'Filter', onClick: handleFilter }
 *   ]}
 *   position="bottom-right"
 *   hideOnDesktop
 * />
 * ```
 */
export function FloatingActionButton({
  actions,
  mainIcon = 'Plus',
  position = 'bottom-right',
  hideOnDesktop = true
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6'
  };

  const menuDirection = {
    'bottom-right': 'bottom-16',
    'bottom-left': 'bottom-16',
    'top-right': 'top-16',
    'top-left': 'top-16'
  };

  const variantColors = {
    default: 'bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)]',
    primary: 'bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)]',
    danger: 'bg-[var(--admin-danger)] hover:bg-red-700',
    success: 'bg-[var(--admin-success)] hover:bg-green-700'
  };

  // Hide on desktop if needed
  const hideClass = hideOnDesktop ? 'sm:hidden' : '';

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${hideClass}`}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            
            {/* Action menu */}
            <motion.div 
              className={`absolute ${menuDirection[position]} right-0 space-y-3 z-50`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 
                    ${variantColors[action.variant || 'default']}
                    text-white rounded-full shadow-lg
                    transform transition-all duration-200
                    hover:scale-105 hover:shadow-xl
                    min-w-max
                  `}
                >
                  <Icon name={action.icon} size={20} />
                  <span className="font-medium text-sm pr-2">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-14 h-14 rounded-full
          ${isOpen ? 'bg-[var(--admin-secondary)]' : 'bg-[var(--admin-primary)]'}
          hover:bg-[var(--admin-primary-hover)]
          text-white shadow-lg
          flex items-center justify-center
          transform transition-all duration-300
          hover:scale-110 hover:shadow-xl
          z-50
        `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon name={mainIcon} size={24} />
        </motion.div>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-[var(--admin-primary)] animate-ping opacity-30" />
        )}
      </motion.button>
    </div>
  );
}

/**
 * MobileActionBar - 모바일 하단 액션 바
 * 
 * Alternative to FAB for multiple primary actions
 */
export function MobileActionBar({
  actions,
  visible = true
}: Readonly<MobileActionBarProps>) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-[var(--modal-bg)] border-t border-[var(--modal-border)] px-4 py-3 z-40 sm:hidden"
    >
      <div className="flex gap-2 overflow-x-auto">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`
              flex items-center gap-2 px-4 py-2.5
              ${action.variant === 'primary' 
                ? 'bg-[var(--admin-primary)] text-white' 
                : 'bg-[var(--modal-header-bg)] text-[var(--text-color)]'
              }
              rounded-lg font-medium text-sm
              transition-all duration-200
              hover:scale-105 active:scale-95
              whitespace-nowrap
            `}
          >
            <Icon name={action.icon} size={18} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}