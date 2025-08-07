/**
 * Custom hook for managing auth form state
 * Extracted from complex AuthForm component to improve separation of concerns
 */
import { useState, useCallback } from 'react';
import { AuthFormField } from '@/types/auth';

interface UseAuthFormStateProps {
  fields: AuthFormField[];
}

export function useAuthFormState({ fields }: UseAuthFormStateProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.name, ""]))
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(Object.fromEntries(fields.map((field) => [field.name, ""])));
    setSuccess(null);
  }, [fields]);

  const clearState = useCallback(() => {
    setSuccess(null);
  }, []);

  return {
    formData,
    loading,
    success,
    setLoading,
    setSuccess,
    handleChange,
    resetForm,
    clearState,
  };
}