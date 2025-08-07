/**
 * Custom hook for auth form submission logic
 * Handles success/error states, redirects, and timing logic
 */
import { useCallback } from 'react';
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { extractErrorMessage } from "@/lib/auth/utils";
import { useAuthError } from "@/hooks/auth";
import { logger } from "@/utils/logger";

interface UseAuthFormSubmissionProps {
  title: string;
  successRedirect?: string;
  onSuccess?: () => void;
}

export function useAuthFormSubmission({ 
  title, 
  successRedirect, 
  onSuccess 
}: UseAuthFormSubmissionProps) {
  const router = useRouter();
  const messages = useTranslations("messages");
  const { setError } = useAuthError();

  const handleSuccess = useCallback((successMessage: string) => {
    logger.auth.info('Form submission successful', { formType: title });
    
    // Configure redirect delay based on auth type
    let redirectDelay = 0;
    if (title === "register") {
      redirectDelay = 3000; // Give time to read email verification message
    } else if (title === "login") {
      redirectDelay = 1000; // Quick redirect after login
    }

    onSuccess?.();

    if (successRedirect) {
      setTimeout(() => {
        router.push(successRedirect);
      }, redirectDelay);
    }
  }, [title, successRedirect, onSuccess, router]);

  const handleError = useCallback((error: unknown) => {
    logger.auth.error('Form submission failed', { 
      formType: title,
      error: error instanceof Error ? error.message : String(error)
    });
    
    const errorMessage = extractErrorMessage(error) || 
                        messages("UnknownError") || 
                        "Unknown error occurred.";
    setError(errorMessage);
  }, [title, messages, setError]);

  const createSubmissionHandler = useCallback((
    submitFn: (data: Record<string, string>) => Promise<void>,
    formData: Record<string, string>,
    setLoading: (loading: boolean) => void,
    setSuccess: (success: string | null) => void
  ) => {
    return async () => {
      setError(null);
      setSuccess(null);
      setLoading(true);

      try {
        await submitFn(formData);
        const successMessage = messages(`${title}Success`);
        setSuccess(successMessage);
        handleSuccess(successMessage);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
  }, [title, messages, setError, handleSuccess, handleError]);

  return {
    createSubmissionHandler,
    handleSuccess,
    handleError,
  };
}