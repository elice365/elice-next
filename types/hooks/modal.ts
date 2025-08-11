// Modal Hook Type Definitions

import { FormErrors } from "@/types/admin";

export interface UseModalStateProps {
  onOpen?: () => void;
  onClose?: () => void;
  defaultOpen?: boolean;
}

export interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseModalFormProps<T> {
  initialData?: Partial<T>;
  endpoint: string;
  method?: 'POST' | 'PATCH' | 'PUT';
  onSuccess?: (data: any) => void;
  onUpdate?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface UseModalFormReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  handleFieldChange: (name: keyof T, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  clearError: (field: string) => void;
}