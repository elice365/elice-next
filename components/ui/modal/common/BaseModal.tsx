"use client";

import { useEffect, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { BaseModalProps } from "@/types/admin";

/**
 * Extended props interface for BaseModal component
 * @interface BaseModalExtendedProps
 * @extends BaseModalProps
 */
interface BaseModalExtendedProps extends BaseModalProps {
  /** Modal title displayed in the header */
  readonly title: string;
  /** Optional subtitle displayed below the title */
  readonly subtitle?: string;
  /** Optional icon name from Lucide React icons */
  readonly icon?: string;
  /** Icon color class (e.g., 'text-blue-600') */
  readonly iconColor?: string;
  /** Modal size variant */
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Modal content */
  readonly children: ReactNode;
  /** Optional footer content */
  readonly footer?: ReactNode;
  /** Loading state - prevents closing and shows overlay */
  readonly loading?: boolean;
  /** Additional CSS classes for the modal container */
  readonly className?: string;
  /** Prevent closing on backdrop click */
  readonly closeOnBackdrop?: boolean;
  /** Prevent closing on ESC key */
  readonly closeOnEscape?: boolean;
  /** Custom loading message */
  readonly loadingMessage?: string;
  /** Modal variant for different styles */
  readonly variant?: 'default' | 'danger' | 'success' | 'warning';
}

/**
 * Size class mappings for modal widths
 * Maps size variants to Tailwind CSS max-width classes
 */
const sizeClasses = {
  sm: 'max-w-sm',    // ~384px
  md: 'max-w-md',    // ~448px
  lg: 'max-w-lg',    // ~512px
  xl: 'max-w-xl',    // ~576px
  '2xl': 'max-w-2xl', // ~672px
  '3xl': 'max-w-3xl'  // ~768px
};

/**
 * BaseModal - Foundation modal component with accessibility features
 * 
 * A comprehensive modal dialog component that provides:
 * - Accessible modal dialog with proper ARIA attributes
 * - Keyboard navigation (ESC to close, focus management)  
 * - Backdrop click handling
 * - Loading states with overlay
 * - Responsive sizing options
 * - Body scroll prevention when open
 * - CSS custom properties for theming
 * 
 * @component
 * @example
 * ```tsx
 * <BaseModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="User Settings"
 *   subtitle="Manage your account preferences"
 *   icon="Settings"
 *   iconColor="text-blue-600"
 *   size="lg"
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   <div className="p-6">
 *     Modal content goes here
 *   </div>
 * </BaseModal>
 * ```
 * 
 * @param props - BaseModalExtendedProps
 * @returns JSX.Element | null
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconColor = "text-blue-600",
  size = 'md',
  children,
  footer,
  loading = false,
  className = "",
  closeOnBackdrop = true,
  closeOnEscape = true,
  loadingMessage = "처리 중...",
  variant = 'default'
}: BaseModalExtendedProps) {

  /**
   * Handle keyboard interactions and body scroll prevention
   * Sets up ESC key listener and prevents background scrolling when modal is open
   */
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus trap setup
      const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modalElement) {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        firstFocusable?.focus();
        
        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable?.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable?.focus();
            }
          }
        };
        
        modalElement.addEventListener('keydown', handleTabKey);
        
        return () => {
          modalElement.removeEventListener('keydown', handleTabKey);
        };
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading, closeOnEscape]);

  /**
   * Handle backdrop click to close modal
   * Only closes if clicking the backdrop itself (not modal content) and not loading
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && closeOnBackdrop) {
      onClose();
    }
  };

  /**
   * Get background color class for icon container based on icon color
   * Maps text color classes to corresponding background color classes
   */
  const getIconBgColor = () => {
    // Use variant-based colors if no custom color provided
    if (variant !== 'default' && !iconColor.includes('text-')) {
      const variantColors = {
        danger: 'bg-red-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        default: 'bg-blue-500'
      };
      return variantColors[variant];
    }
    
    if (iconColor.includes('blue')) return 'bg-blue-500';
    if (iconColor.includes('green')) return 'bg-green-500';
    if (iconColor.includes('red')) return 'bg-red-500';
    if (iconColor.includes('yellow')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };
  
  const getVariantIconColor = () => {
    if (iconColor?.includes('text-')) return iconColor;
    
    const variantColors = {
      danger: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      default: 'text-blue-600'
    };
    return variantColors[variant];
  };

  /**
   * Get modal size class from size prop
   * @returns Tailwind CSS max-width class for the specified size
   */
  const getModalSizeClass = () => {
    return sizeClasses[size];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <button
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
        className="absolute inset-0 bg-transparent cursor-default"
        aria-label="모달 닫기"
        tabIndex={-1}
      />
      <dialog
        open
        role="dialog"
        aria-modal="true"
        className={`bg-[var(--color-modal)] rounded-xl shadow-xl w-full ${getModalSizeClass()} max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-200 scale-100 ${className} border-0 p-0 m-0 relative z-10 flex flex-col`}
        aria-labelledby="modal-title"
        aria-describedby={subtitle ? "modal-subtitle" : undefined}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--modal-border)] bg-[var(--modal-header-bg)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-2 rounded-lg bg-opacity-10 ${getIconBgColor()}`}>
                <Icon name={icon} size={20} className={getVariantIconColor()} />
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-[var(--title)]">
                {title}
              </h2>
              {subtitle && (
                <p id="modal-subtitle" className="text-sm text-[var(--text-color)] opacity-70 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center"
            aria-label="모달 닫기"
          >
            <Icon name="X" size={20} className="text-[var(--text-color)]" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-modal)] min-h-0">
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="bg-[var(--modal-footer-bg)] border-t border-[var(--modal-border)] p-3 flex-shrink-0">
            {footer}
          </div>
        )}

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="absolute inset-0 bg-[var(--color-modal)] bg-opacity-75 flex items-center justify-center backdrop-blur-sm rounded-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--hover-primary)]"></div>
              <span className="text-[var(--text-color)]">{loadingMessage}</span>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}