import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import { cleanupExpiredSessions, cleanupDuplicateSessions, detectSuspiciousSessions } from '@/lib/services/session/cleanup';

const sessionCleanup = async (
  request: NextRequest,
  _context: AuthInfo
): Promise<APIResult> => {
  try {
    const { type, userId, maxSessions } = await request.json();

    let result;

    switch (type) {
      case 'expired':
        result = await cleanupExpiredSessions();
        return setRequest({
          type: 'expired',
          ...result
        });

      case 'duplicate':
        if (!userId) {
          return setMessage('InvalidField', null, 400);
        }
        result = await cleanupDuplicateSessions(userId, maxSessions);
        return setRequest({
          type: 'duplicate',
          userId,
          ...result
        });

      case 'suspicious':
        result = await detectSuspiciousSessions();
        return setRequest({
          type: 'suspicious',
          ...result
        });

      case 'all': {
        const [expired, suspicious] = await Promise.all([
          cleanupExpiredSessions(),
          detectSuspiciousSessions()
        ]);
        return setRequest({
          type: 'all',
          expired,
          suspicious
        });
      }

      default:
        return setMessage('InvalidField', null, 400);
    }

  } catch (error) {
    console.error('[CLEANUP API] Error:', error);
    return setMessage('NetworkError', null, 500);
  }
};

export const POST = handler(sessionCleanup, {
  auth: true,
  roles: ['admin']
});
