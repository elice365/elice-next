"use client";

import { ReactNode } from "react";
import { BaseModal } from "../common/BaseModal";
import { Icon } from "@/components/ui/Icon";
import type { BaseModalExtendedProps } from "@/types/ui/modal";

interface AdminModalProps extends Omit<BaseModalExtendedProps, 'children'> {
  children: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  showDivider?: boolean;
}

/**
 * AdminModal - Enhanced modal component for admin interfaces
 * 
 * Features:
 * - Theme-aware styling with all 4 themes
 * - Smooth animations and transitions
 * - Consistent button styling
 * - Built-in action buttons
 * 
 * @example
 * ```tsx
 * <AdminModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Edit User"
 *   icon="User"
 *   primaryAction={{
 *     label: "Save Changes",
 *     onClick: handleSave,
 *     loading: isSaving
 *   }}
 *   secondaryAction={{
 *     label: "Cancel",
 *     onClick: onClose
 *   }}
 * >
 *   <div className="p-6">
 *     Modal content here
 *   </div>
 * </AdminModal>
 * ```
 */
export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconColor,
  size = 'lg',
  primaryAction,
  secondaryAction,
  showDivider = true,
  children,
  loading = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  variant = 'default',
  ...props
}: AdminModalProps) {
  
  const footer = (primaryAction || secondaryAction) ? (
    <div className="flex justify-end gap-3">
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled || loading}
          className="modal-button-secondary"
        >
          {secondaryAction.label}
        </button>
      )}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading || loading}
          className="modal-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {primaryAction.loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              처리 중...
            </>
          ) : (
            <>
              {primaryAction.icon && <Icon name={primaryAction.icon} size={16} />}
              {primaryAction.label}
            </>
          )}
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      size={size}
      footer={footer}
      loading={loading}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      variant={variant}
      {...props}
    >
      {showDivider && <div className="border-t border-[var(--modal-border)]" />}
      {children}
    </BaseModal>
  );
}

/**
 * AdminFormModal - Specialized admin modal for forms
 * 
 * Features:
 * - Built-in form handling
 * - Validation error display
 * - Success message handling
 * 
 * @example
 * ```tsx
 * <AdminFormModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Create Category"
 *   onSubmit={handleSubmit}
 *   submitLabel="Create"
 *   loading={isSubmitting}
 *   errors={validationErrors}
 *   successMessage={successMsg}
 * >
 *   <input className="modal-input" />
 * </AdminFormModal>
 * ```
 */
export function AdminFormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  onSubmit,
  submitLabel = "저장",
  cancelLabel = "취소",
  loading = false,
  errors = {},
  successMessage,
  children,
  size = 'lg',
  ...props
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  errors?: Record<string, string>;
  successMessage?: string;
  children: ReactNode;
  size?: BaseModalExtendedProps['size'];
}) {
  
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      loading={loading}
      primaryAction={{
        label: submitLabel,
        onClick: () => {
          const form = document.getElementById('admin-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        },
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        disabled: loading,
      }}
      showDivider={false}
      {...props}
    >
      <form id="admin-form" onSubmit={onSubmit} className="p-6 space-y-6">
        {/* Error display */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <ul className="space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm text-red-600">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Success message */}
        {successMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
            <p className="text-sm text-green-600 font-medium">{successMessage}</p>
          </div>
        )}
        
        {children}
      </form>
    </AdminModal>
  );
}

/**
 * AdminConfirmModal - Confirmation dialog for admin actions
 * 
 * @example
 * ```tsx
 * <AdminConfirmModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Delete User?"
 *   message="This action cannot be undone."
 *   onConfirm={handleDelete}
 *   confirmLabel="Delete"
 *   variant="danger"
 * />
 * ```
 */
export function AdminConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = "확인",
  cancelLabel = "취소",
  loading = false,
  variant = 'default',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'warning';
}) {
  
  const iconName = variant === 'danger' ? 'AlertTriangle' : 
                  variant === 'warning' ? 'AlertCircle' : 'Info';
  const iconColor = variant === 'danger' ? 'text-red-600' : 
                   variant === 'warning' ? 'text-yellow-600' : 'text-blue-600';
  
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={iconName}
      iconColor={iconColor}
      size="sm"
      loading={loading}
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        disabled: loading,
      }}
      variant={variant}
      showDivider={false}
    >
      <div className="p-6">
        <p className="text-[var(--text-color)]">{message}</p>
      </div>
    </AdminModal>
  );
}