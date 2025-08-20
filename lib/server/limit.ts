import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { requestIP } from '@/lib/server/info';

import type { RateLimitResult } from '@/types/api';

// Initialize Redis client with fallback for development
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? Redis.fromEnv() 
  : null;

// Create rate limiter with fallback for development
const limiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, '60 s'),
  analytics: true,
}) : null;

/**
 * Improved rate limiting using Upstash Redis for distributed environments
 * Replaces memory-based Map with distributed Redis-backed solution
 */
export async function limitAPI(
  request: NextRequest,
  url: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  // If Redis is not configured, skip rate limiting in development
  if (!redis || !limiter) {
    return {
      access: true,
      limit,
      remaining: limit - 1,
      resetTime: Date.now() + windowMs,
    };
  }

  try {
    const clientIP = await requestIP(request);
    const key = `ratelimit:${clientIP}:${url}`;
    
    // Use Upstash rate limiter with custom limit if needed
    const customLimiter = limit !== 100 ? 
      new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(limit, `${Math.floor(windowMs / 1000)} s`),
        analytics: true,
      }) : limiter;

    const { success, limit: rateLimitCount, reset, remaining } = await customLimiter?.limit(key) || { success: true, limit, reset: Date.now() + windowMs, remaining: limit - 1 };
    
    return {
      access: success,
      limit: rateLimitCount,
      remaining,
      resetTime: reset,
    };
  } catch (error) {
    // Fallback to allowing request if Redis is unavailable
    console.error('Rate limiting failed, allowing request:', error);
    return {
      access: true,
      limit,
      remaining: limit - 1,
      resetTime: Date.now() + windowMs,
    };
  }
}