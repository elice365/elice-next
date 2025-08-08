"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/fetch";
import { APIResult } from "@/types/api";
import { FormErrors } from "@/types/admin";

interface UseModalFormProps<T> {
  initialData?: Partial<T>;
  endpoint: string;
  method?: 'POST' | 'PATCH' | 'PUT';
  onSuccess?: (data: any) => void;
  onUpdate?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

interface UseModalFormReturn<T> {
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

export function useModalForm<T extends Record<string, any>>({
  initialData,
  endpoint,
  method = 'POST',
  onSuccess,
  onUpdate,
  onClose,
  isOpen
}: UseModalFormProps<T>): UseModalFormReturn<T> {
  const [formData, setFormData] = useState<T>(() => 
    initialData ? (initialData as T) : ({} as T)
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? (initialData as T) : ({} as T));
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle field change
  const handleFieldChange = useCallback((name: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(String(name));
  }, []);

  // Clear specific error
  const clearError = useCallback((field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData ? (initialData as T) : ({} as T));
    setErrors({});
  }, [initialData]);

  // Handle API error response
  const handleApiError = useCallback((data: APIResult) => {
    if (data.message === 'DuplicateField' && data.data?.field) {
      setErrors({ [data.data.field]: data.data.message || '중복된 값입니다.' });
    } else if (data.message === 'InvalidField' && data.data?.field) {
      setErrors({ [data.data.field]: data.data.message || '잘못된 값입니다.' });
    } else if (data.message === 'ValidationError' && data.data?.errors) {
      setErrors(data.data.errors);
    } else {
      setErrors({ general: data.message || '처리 중 오류가 발생했습니다.' });
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const apiMethod = method.toLowerCase() as keyof typeof api;
      let response: { data: APIResult };
      
      if (apiMethod === 'post') {
        response = await api.post(endpoint, formData);
      } else if (apiMethod === 'patch') {
        response = await api.patch(endpoint, formData);
      } else if (apiMethod === 'put') {
        response = await api.put(endpoint, formData);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      const { data } = response;

      if (data.success) {
        onSuccess?.(data.data);
        onUpdate?.();
        onClose();
        resetForm();
      } else {
        handleApiError(data);
      }
    } catch (error) {
      console.error('[useModalForm] API request failed:', error);
      setErrors({ general: '네트워크 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [formData, endpoint, method, onSuccess, onUpdate, onClose, resetForm, handleApiError]);

  return {
    formData,
    setFormData,
    loading,
    errors,
    setErrors,
    handleFieldChange,
    handleSubmit,
    resetForm,
    clearError
  };
}