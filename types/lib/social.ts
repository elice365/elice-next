// Social Login Service Type Definitions

import { SocialProvider, SocialUserInfo, ProviderTokens } from "@/types/auth/social";
import { requestInfo } from "@/lib/server/info";

export interface SocialLoginParams {
  provider: SocialProvider;
  code: string;
  clientInfo: ReturnType<typeof requestInfo>;
  fingerprint?: string;
}