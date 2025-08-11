import React from 'react';
import { Icon } from '../../Icon';
import { ErrorMessage } from '../../ErrorMessage';
import { LoadingSpinner } from '../../LoadingSpinner';
import type { ModalFooterProps } from '@/types/ui/modal';

const variantClasses = {
  default: 'bg-blue-600 hover:bg-blue-700',
  danger: 'bg-red-600 hover:bg-red-700',
  success: 'bg-green-600 hover:bg-green-700'
};

export function ModalFooter({
  onClose,
  onSubmit,
  loading = false,
  error,
  submitLabel = '확인',
  submitIcon,
  cancelLabel = '취소',
  formId,
  disabled = false,
  className = '',
  variant = 'default'
}: ModalFooterProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1">
        <ErrorMessage error={error} />
      </div>
      
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-[var(--text-color)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        
        <button
          type={formId ? 'submit' : 'button'}
          form={formId}
          onClick={!formId ? onSubmit : undefined}
          disabled={loading || disabled}
          className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${variantClasses[variant]}`}
        >
          {loading ? (
            <LoadingSpinner size="sm" text="처리 중..." />
          ) : (
            <>
              {submitIcon && <Icon name={submitIcon} size={16} />}
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ModalFooter;