import { SocialProvider } from "@/types/social";

export const socialTypeCheck = (provider: string): provider is SocialProvider => {
  return ['google', 'kakao', 'naver', 'apple'].includes(provider);
};