import { useState, useCallback } from "react";
import { ModalStates } from "@/types/admin";

interface UseModalStatesOptions {
  modalNames: string[];
}

interface UseModalStatesReturn<T> {
  // State
  modalStates: ModalStates;
  selectedItem: T | null;
  
  // Actions
  openModal: (modalName: string, item?: T) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
  setSelectedItem: (item: T | null) => void;
  
  // Convenience methods for common modals
  openCreate: () => void;
  openEdit: (item: T) => void;
  openDelete: (item: T) => void;
  
  // Helper functions
  isModalOpen: (modalName: string) => boolean;
  hasAnyModalOpen: () => boolean;
}

export function useModalStates<T = any>({ 
  modalNames 
}: UseModalStatesOptions): UseModalStatesReturn<T> {
  
  // Initialize modal states
  const initialStates = modalNames.reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {} as ModalStates);

  const [modalStates, setModalStates] = useState<ModalStates>(initialStates);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // Open modal with optional item selection
  const openModal = useCallback((modalName: string, item?: T) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: true
    }));
    
    if (item !== undefined) {
      setSelectedItem(item);
    }
  }, []);

  // Close specific modal
  const closeModal = useCallback((modalName: string) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: false
    }));
    
    // Clear selected item if no modals are open
    const willHaveOpenModals = Object.entries(modalStates).some(
      ([name, isOpen]) => name !== modalName && isOpen
    );
    
    if (!willHaveOpenModals) {
      setSelectedItem(null);
    }
  }, [modalStates]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setModalStates(initialStates);
    setSelectedItem(null);
  }, [initialStates]);

  // Set selected item without opening modal
  const setSelectedItemValue = useCallback((item: T | null) => {
    setSelectedItem(item);
  }, []);

  // Convenience methods for common modal patterns
  const openCreate = useCallback(() => {
    openModal('create');
  }, [openModal]);

  const openEdit = useCallback((item: T) => {
    openModal('edit', item);
  }, [openModal]);

  const openDelete = useCallback((item: T) => {
    openModal('delete', item);
  }, [openModal]);

  // Helper functions
  const isModalOpen = useCallback((modalName: string): boolean => {
    return modalStates[modalName] || false;
  }, [modalStates]);

  const hasAnyModalOpen = useCallback((): boolean => {
    return Object.values(modalStates).some(isOpen => isOpen);
  }, [modalStates]);

  return {
    // State
    modalStates,
    selectedItem,
    
    // Actions
    openModal,
    closeModal,
    closeAllModals,
    setSelectedItem: setSelectedItemValue,
    
    // Convenience methods
    openCreate,
    openEdit,
    openDelete,
    
    // Helper functions
    isModalOpen,
    hasAnyModalOpen
  };
}

// Hook for common admin page modal patterns
export function useAdminModals<T = any>() {
  return useModalStates<T>({
    modalNames: ['create', 'edit', 'delete', 'view', 'manage']
  });
}