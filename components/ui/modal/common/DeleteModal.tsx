"use client";

import { useState } from "react";

import { BaseModal } from "./BaseModal";
import { Icon } from "@/components/ui/Icon";

import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { BaseModalProps } from "@/types/admin";
import { logger } from "@/lib/services/logger";

interface DeleteModalProps extends BaseModalProps {
  readonly title: string;
  readonly entity: any;
  readonly entityName: string;
  readonly endpoint: string;
  readonly confirmationText?: string;
  readonly requiresConfirmation?: boolean;
  readonly warningMessage?: string;
  readonly getDangerLevel?: (entity: any) => 'low' | 'medium' | 'high';
  readonly getDisplayName?: (entity: any) => string;
  readonly onSuccess?: (deletedEntity: any) => void;
  readonly children?: React.ReactNode;
}

export function DeleteModal({
  isOpen,
  onClose,
  onUpdate,
  title,
  entity,
  entityName,
  endpoint,
  confirmationText,
  requiresConfirmation = false,
  warningMessage,
  getDangerLevel,
  getDisplayName,
  onSuccess,
  children
}: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');

  if (!entity) return null;

  const displayName = getDisplayName ? getDisplayName(entity) : entity.name || entity.title || entityName;
  const dangerLevel = getDangerLevel ? getDangerLevel(entity) : 'medium';

  const isConfirmationValid = !requiresConfirmation || confirmInput === displayName;

  const getDangerConfig = () => {
    if (dangerLevel === 'high') {
      return {
        bgColor: 'bg-red-500',
        textColor: 'text-red-600',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        iconBg: 'bg-red-500',
        message: '⚠️ 주의: 이 작업은 되돌릴 수 없으며 시스템에 중대한 영향을 줄 수 있습니다.'
      };
    }
    
    if (dangerLevel === 'medium') {
      return {
        bgColor: 'bg-orange-500',
        textColor: 'text-orange-600',
        buttonBg: 'bg-orange-600 hover:bg-orange-700',
        iconBg: 'bg-orange-500',
        message: '⚠️ 이 작업은 되돌릴 수 없습니다.'
      };
    }
    
    return {
      bgColor: 'bg-gray-500',
      textColor: 'text-gray-600',
      buttonBg: 'bg-gray-600 hover:bg-gray-700',
      iconBg: 'bg-gray-500',
      message: '이 작업은 되돌릴 수 없습니다.'
    };
  };

  const dangerConfig = getDangerConfig();

  const getWarningStyles = () => {
    if (dangerLevel === 'high') {
      return 'bg-red-50 border-red-500 dark:bg-red-900/20';
    }
    if (dangerLevel === 'medium') {
      return 'bg-orange-50 border-orange-500 dark:bg-orange-900/20';
    }
    return 'bg-gray-50 border-[var(--border-color)] dark:bg-gray-900/20';
  };

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.delete<APIResult>(endpoint);

      if (data.success) {
        onSuccess?.(entity);
        onUpdate?.();
        onClose();
      } else if (data.message === 'ConflictError') {
        setError('다른 시스템에서 사용 중이어서 삭제할 수 없습니다.');
      } else {
        setError(data.message || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      logger.error('[DeleteModal] Delete operation failed', 'MODAL', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-[var(--text-color)] hover:text-[var(--hover-text)] font-medium transition-colors disabled:opacity-50 border border-[var(--border-color)]  rounded-lg hover:bg-[var(--hover)]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading || !isConfirmationValid}
          className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${dangerConfig.buttonBg}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              삭제 중...
            </>
          ) : (
            <>
              <Icon name="Trash2" size={16} />
              삭제
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="Trash2"
      iconColor={dangerConfig.textColor}
      size="md"
      footer={footer}
      loading={loading}
    >
      <div className="p-6 space-y-6">
        {/* 경고 메시지 */}
        <div className={`p-4 rounded-lg border-l-4 ${getWarningStyles()}`}>
          <p className={`text-sm ${dangerConfig.textColor}`}>
            {warningMessage || dangerConfig.message}
          </p>
        </div>

        {/* 삭제할 항목 정보 */}
        <div className="p-4 bg-[var(--modal-header-bg)] rounded-lg">
          <h4 className="font-medium text-[var(--title)] mb-2">
            삭제할 {entityName}:
          </h4>
          <p className="text-[var(--text-color)]">
            {displayName}
          </p>

          {/* 추가 정보가 있다면 표시 */}
          {entity.description && (
            <p className="text-sm text-[var(--text-color)] opacity-70 mt-2">
              {entity.description}
            </p>
          )}
        </div>

        {/* Custom children content */}
        {children}

        {/* 확인 입력 */}
        {requiresConfirmation && (
          <div className="space-y-3">
            <div className="text-sm text-[var(--text-color)]">
              삭제를 확인하려면 <span className="font-mono font-medium bg-[var(--modal-header-bg)] px-1 rounded">{displayName}</span>을(를) 정확히 입력하세요:
            </div>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={displayName}
              disabled={loading}
              className="w-full px-4 py-3 border border-[var(--border-color)]  rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-[var(--color-modal)] disabled:opacity-50"
            />
            {confirmInput && confirmInput !== displayName && (
              <p className="text-sm text-red-600">입력한 이름이 정확하지 않습니다.</p>
            )}
          </div>
        )}

        {/* 추가 설명 */}
        {confirmationText && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {confirmationText}
          </div>
        )}
      </div>
    </BaseModal>
  );
}