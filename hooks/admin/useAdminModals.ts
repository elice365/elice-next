"use client";

import { useState } from "react";

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

export function useAdminModals<T>(): [AdminModalsState<T>, AdminModalsActions<T>] {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openEditModal = (record: T, e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (record: T, e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  const state: AdminModalsState<T> = {
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedRecord
  };

  const actions: AdminModalsActions<T> = {
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    setSelectedRecord
  };

  return [state, actions];
}