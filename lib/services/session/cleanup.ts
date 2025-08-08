import { prisma } from '@/lib/db/prisma';
import { cleanup, logger } from '@/lib/services/logger';

/**
 * Cleans up expired sessions.
 * This function should be executed as a cron job or periodic task.
 */
export async function cleanupExpiredSessions() {
  try {
    const now = new Date();
    
    // Find expired sessions
    const expiredSessions = await prisma.session.findMany({
      where: {
        OR: [
          { expiresTime: { lte: now } },
          { 
            active: false,
            updateTime: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
          }
        ]
      },
      select: {
        sessionId: true,
        userId: true,
        expiresTime: true,
        active: true
      }
    });

    if (expiredSessions.length === 0) {
      cleanup('No expired sessions found');
      return { cleaned: 0 };
    }

    // Delete expired sessions
    const deleteResult = await prisma.session.deleteMany({
      where: {
        sessionId: {
          in: expiredSessions.map(s => s.sessionId)
        }
      }
    });

    cleanup(`Cleaned up ${deleteResult.count} expired sessions`, { count: deleteResult.count });
    
    return { 
      cleaned: deleteResult.count,
      sessions: expiredSessions.map(s => ({
        sessionId: s.sessionId,
        userId: s.userId,
        expired: s.expiresTime < now,
        inactive: !s.active
      }))
    };

  } catch (error) {
    cleanup('Error cleaning up expired sessions', error);
    throw error;
  }
}

/**
 * Cleans up duplicate sessions for a specific user.
 * Maintains a maximum of 5 active sessions per user.
 */
export async function cleanupDuplicateSessions(userId: string, maxSessions: number = 5) {
  try {
    const activeSessions = await prisma.session.findMany({
      where: {
        userId,
        active: true,
        expiresTime: { gt: new Date() }
      },
      orderBy: {
        updateTime: 'desc'
      }
    });

    if (activeSessions.length <= maxSessions) {
      return { cleaned: 0 };
    }

    // Delete old sessions
    const sessionsToDelete = activeSessions.slice(maxSessions);
    const deleteResult = await prisma.session.deleteMany({
      where: {
        sessionId: {
          in: sessionsToDelete.map(s => s.sessionId)
        }
      }
    });

    cleanup(`Cleaned up ${deleteResult.count} duplicate sessions for user ${userId}`, { userId, count: deleteResult.count });
    
    return {
      cleaned: deleteResult.count,
      deletedSessions: sessionsToDelete.map(s => s.sessionId)
    };

  } catch (error) {
    logger.error('[CLEANUP] Error cleaning up duplicate sessions', 'SESSION', error);
    throw error;
  }
}

/**
 * Detects and cleans up suspicious session patterns.
 */
export async function detectSuspiciousSessions() {
  try {
    // Too many sessions from the same IP
    const suspiciousIPs = await prisma.session.groupBy({
      by: ['ipAddress'],
      where: {
        active: true,
        expiresTime: { gt: new Date() },
        createdTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      having: {
        sessionId: {
          _count: {
            gt: 10 // More than 10 sessions per IP
          }
        }
      },
      _count: {
        sessionId: true
      }
    });

    const suspiciousSessionIds: string[] = [];

    for (const { ipAddress, _count } of suspiciousIPs) {
      if (!ipAddress) continue;
      
      const sessions = await prisma.session.findMany({
        where: {
          ipAddress,
          active: true,
          expiresTime: { gt: new Date() }
        },
        orderBy: {
          createdTime: 'desc'
        },
        select: {
          sessionId: true
        }
      });

      // Mark all except the latest 3 as suspicious
      const sessionsToFlag = sessions.slice(3);
      suspiciousSessionIds.push(...sessionsToFlag.map(s => s.sessionId));
    }

    if (suspiciousSessionIds.length > 0) {
      logger.warn(`[CLEANUP] Found ${suspiciousSessionIds.length} suspicious sessions`, 'SESSION');
      
      // Deactivate suspicious sessions (deactivate first, don't delete)
      await prisma.session.updateMany({
        where: {
          sessionId: {
            in: suspiciousSessionIds
          }
        },
        data: {
          active: false,
          updateTime: new Date()
        }
      });
    }

    return {
      suspiciousIPs: suspiciousIPs.length,
      flaggedSessions: suspiciousSessionIds.length
    };

  } catch (error) {
    logger.error('[CLEANUP] Error detecting suspicious sessions', 'SESSION', error);
    throw error;
  }
}