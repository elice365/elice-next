"use client";

import { useCallback } from "react";
import { useModalStates } from "@/hooks/modal/useModalStates";

/**
 * @deprecated Use useModalStates from '@/hooks/modal/useModalStates' instead
 * This hook is maintained for backward compatibility
 */
export interface AdminModalsState<T> {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedRecord: T | null;
}

export interface AdminModalsActions<T> {
  openCreateModal: () => void;
  openEditModal: (record: T, e?: React.MouseEvent | Event) => void;
  openDeleteModal: (record: T, e?: React.MouseEvent | Event) => void;
  closeModals: () => void;
  setSelectedRecord: (record: T | null) => void;
}

/**
 * @deprecated Use useModalStates instead for better performance and consistency
 * This hook is maintained for backward compatibility but should be migrated
 */
// eslint-disable-next-line deprecation/deprecation
export function useAdminModals<T>(): [AdminModalsState<T>, AdminModalsActions<T>] {
  const modalStates = useModalStates<T>({
    modalNames: ['create', 'edit', 'delete']
  });

  const openEditModal = useCallback((record: T, e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    modalStates.openModal('edit', record);
  }, [modalStates]);

  const openDeleteModal = useCallback((record: T, e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    modalStates.openModal('delete', record);
  }, [modalStates]);

  // Compatibility layer - map new API to old API
  // eslint-disable-next-line deprecation/deprecation
  const state: AdminModalsState<T> = {
    isCreateModalOpen: modalStates.modalStates.create || false,
    isEditModalOpen: modalStates.modalStates.edit || false,
    isDeleteModalOpen: modalStates.modalStates.delete || false,
    selectedRecord: modalStates.selectedItem
  };

  const actions: AdminModalsActions<T> = {
    openCreateModal: modalStates.openCreate,
    openEditModal,
    openDeleteModal,
    closeModals: modalStates.closeAllModals,
    setSelectedRecord: modalStates.setSelectedItem
  };

  return [state, actions];
}