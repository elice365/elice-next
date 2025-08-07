/**
 * Custom hook for auth form validation logic
 * Extracted from AuthForm to improve maintainability and testability
 */
import { useCallback } from 'react';
import { useTranslations } from "next-intl";
import { Field, inputValue } from "@/utils/regex/input";
import { AuthFormField } from '@/types/auth';

interface UseAuthFormValidationProps {
  fields: AuthFormField[];
  validate?: (data: Record<string, string>) => string | null;
}

export function useAuthFormValidation({ fields, validate }: UseAuthFormValidationProps) {
  const messages = useTranslations("messages");

  const validateForm = useCallback((formData: Record<string, string>) => {
    // Check empty fields
    for (const field of fields) {
      if (!formData[field.name]?.trim()) {
        return messages("allFieldsRequired") || "All fields are required.";
      }
    }

    // Custom validation
    const validationError = validate?.(formData);
    if (validationError) return validationError;

    // Field-specific validation
    for (const field of fields) {
      const fieldName = field.name as Field;
      const value = formData[fieldName];
      const compareValue = field.compareValue ? formData[field.compareValue] : undefined;
      const fieldError = inputValue(fieldName, value, messages, compareValue);
      if (fieldError) return fieldError;
    }
    
    return null;
  }, [fields, validate, messages]);

  return { validateForm };
}