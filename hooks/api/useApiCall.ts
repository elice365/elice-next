import { useState, useCallback } from 'react';
import { extractErrorMessage } from '@/utils/error/extractErrorMessage';

export interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showAlert?: boolean;
  successMessage?: string;
}

export interface ApiCallState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useApiCall<T = any>(options: UseApiCallOptions<T> = {}) {
  const { onSuccess, onError, showAlert = true, successMessage } = options;
  
  const [state, setState] = useState<ApiCallState>({
    loading: false,
    error: null,
    success: false
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState({ loading: true, error: null, success: false });
    
    try {
      const result = await apiCall();
      
      setState({ loading: false, error: null, success: true });
      
      if (successMessage && showAlert) {
        alert(successMessage);
      }
      
      onSuccess?.(result);
      return result;
      
    } catch (err) {
      const errorMessage = extractErrorMessage(err) || 'An error occurred';
      
      setState({ loading: false, error: errorMessage, success: false });
      
      if (showAlert) {
        alert(errorMessage);
      }
      
      onError?.(errorMessage);
      return null;
    }
  }, [onSuccess, onError, showAlert, successMessage]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Specialized hook for admin operations
export function useAdminApiCall<T = any>(options: UseApiCallOptions<T> & { 
  refreshData?: () => void;
} = {}) {
  const { refreshData, ...apiOptions } = options;
  
  const apiCall = useApiCall<T>({
    ...apiOptions,
    onSuccess: (data) => {
      refreshData?.();
      apiOptions.onSuccess?.(data);
    }
  });

  return apiCall;
}

// Hook for bulk operations
export function useBulkApiCall<T = any>(options: UseApiCallOptions<T[]> & {
  itemName?: string;
} = {}) {
  const { itemName = 'items', ...apiOptions } = options;
  
  return useApiCall<T[]>({
    ...apiOptions,
    successMessage: apiOptions.successMessage || `Selected ${itemName} have been processed successfully`,
    onError: (error) => {
      console.error(`Bulk ${itemName} operation failed:`, error);
      apiOptions.onError?.(error);
    }
  });
}