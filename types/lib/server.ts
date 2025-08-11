// Server Library Type Definitions

import { TokenPayload } from '@/lib/services/token/types';

export interface InitialAuthData {
  user: TokenPayload;
  accessToken: string;
}

export interface ResponseParams {
  success: boolean;
  message?: string;
  data?: any;
  status?: number;
}