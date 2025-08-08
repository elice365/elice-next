import { cookies } from 'next/headers';
import { tokenServer } from '@/lib/services/token/server';
import { TokenPayload } from '@/lib/services/token/types';
import { logger } from '@/lib/services/logger';

interface InitialAuthData {
  user: TokenPayload;
  accessToken: string;
}

// cache() 함수로 래핑하여 동일한 렌더링 사이클에서 중복 호출 방지
export async function UserInfo(): Promise<InitialAuthData | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('token')?.value;
  const fingerprint = cookieStore.get('fp')?.value;

  if (!refreshToken || !fingerprint) {
    return null;
  }

  try {
    if (!tokenServer.verifyRefreshToken(refreshToken)) {
      return null;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',           
        'Cookie': `token=${refreshToken}; fp=${fingerprint}`,
      },
      body: JSON.stringify({ type: 'token' }), 
      cache: "no-store",
    });

    const data = await response.json();
    const headers = response.headers;

    if(!data){
      return null;
    }

    const accessToken =
      (headers.get("authorization") ?? headers.get("Authorization") ?? "").replace(
        /^Bearer\s+/i,
        ""
      );

    if (!accessToken) {
      return null;
    }

    return {
      user: tokenServer.verify(accessToken, 'access') as TokenPayload,
      accessToken: accessToken,
    };

  } catch (error) {
    logger.error("Error fetching user info", 'AUTH', error);
    return null;
  }
};