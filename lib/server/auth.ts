import { cookies } from 'next/headers';
import { tokenServer } from '@/lib/services/token/server';
import { TokenPayload } from '@/lib/services/token/types';
import { api } from '../fetch';
import { APIResult } from '@/types/api';

interface InitialAuthData {
  user: TokenPayload;
  accessToken: string;
}

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

    const { data, headers } = await api.post<APIResult>('/api/auth/refresh', {
      type: 'token'
    }, {
      headers: {
        'Cookie': `token=${refreshToken}; fp=${fingerprint}`
      }
    });

    if(!data.success){
      return null;
    }
    
    if (!headers) {
      return null;
    }
    
    const accessToken = (headers.authorization ?? headers.Authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      return null;
    }
    return {
      user: tokenServer.verify(accessToken, 'access') as TokenPayload,
      accessToken: accessToken,
    };

  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }


}
