// Auth Hook Type Definitions

import { AuthFormField } from '@/types/auth';

export interface UseAuthFormStateProps {
  fields: AuthFormField[];
}

export interface UseAuthFormValidationProps {
  fields: AuthFormField[];
  validate?: (data: Record<string, string>) => string | null;
}

export interface UseAuthFormSubmissionProps {
  title: string;
  successRedirect?: string;
  onSuccess?: () => void;
}

export interface TokenRefreshOptions {
  // Activity detection settings
  enabled?: boolean;
  debounceTime?: number; // Time to wait after activity before refresh (ms)
  refreshBeforeExpiry?: number; // Time before expiry to trigger refresh (ms)
  activityEvents?: string[]; // Events to monitor for activity
  enableVisibilityRefresh?: boolean; // Refresh on tab focus
}