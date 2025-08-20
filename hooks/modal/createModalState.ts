import { useCallback, useState } from 'react';

/**
 * 재사용 가능한 모달 상태 팩토리
 * 타입 안전성을 제공하며, 일관된 모달 관리 패턴을 구현
 */
export function createModalState<T extends object>(initialData: T) {
  return function useModalState() {
    const [state, setState] = useState<T>(initialData);
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback((patch?: Partial<T>) => {
      if (patch) {
        setState(current => ({ ...current, ...patch }));
      }
      setIsOpen(true);
    }, []);

    const close = useCallback(() => {
      setIsOpen(false);
      // Reset to initial state on close
      setState(initialData);
    }, []);

    const update = useCallback((patch: Partial<T>) => {
      setState(current => ({ ...current, ...patch }));
    }, []);

    const reset = useCallback(() => {
      setState(initialData);
    }, []);

    return {
      isOpen,
      state,
      open,
      close,
      update,
      reset,
    };
  };
}

/**
 * 일반적인 CRUD 모달을 위한 헬퍼
 */
export interface CrudModalData<T = unknown> {
  mode: 'create' | 'edit' | 'delete' | 'view';
  item: T | null;
  loading: boolean;
}

export function createCrudModalState<T = unknown>() {
  return createModalState<CrudModalData<T>>({
    mode: 'create',
    item: null,
    loading: false,
  });
}

/**
 * 폼 모달을 위한 헬퍼
 */
export interface FormModalData<T = unknown> {
  data: Partial<T>;
  errors: Record<string, string>;
  submitting: boolean;
}

export function createFormModalState<T = unknown>(initialFormData: Partial<T> = {}) {
  return createModalState<FormModalData<T>>({
    data: initialFormData,
    errors: {},
    submitting: false,
  });
}