/**
 * Environment variable validation and type safety
 * Centralized configuration with runtime validation
 */

import { z } from 'zod';

// Server-side environment schema
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Cloudflare R2 Configuration
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  
  // Redis Configuration
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
});

// Client-side environment schema (only NEXT_PUBLIC_ variables)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate and parse server-side environment variables
 * Only use this in server-side code (API routes, middleware, etc.)
 */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`
    );
  }
  
  return result.data;
}

/**
 * Validate and parse client-side environment variables
 * Safe to use in browser code
 */
export function getClientEnv(): ClientEnv {
  const env = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  };
  
  const result = clientEnvSchema.safeParse(env);
  
  if (!result.success) {
    console.warn('Invalid client environment variables:', result.error.issues);
    return {} as ClientEnv;
  }
  
  return result.data;
}

/**
 * Runtime environment checks
 */
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Safe environment variable getter with type checking
 */
export function getEnvVar(key: keyof ServerEnv, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value || defaultValue || '';
}