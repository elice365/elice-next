# Middleware & Security Documentation

## Overview

The elice-next application implements comprehensive middleware for security, rate limiting, authentication, and request processing. The middleware layer provides defense-in-depth security with multiple protection mechanisms.

## Architecture

### Middleware Stack

```
Request Flow:
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────┐
│Device Track │ → Device fingerprinting & cookie management
├─────────────┤
│Security Hdrs│ → XSS, Frame, Content-Type protection
├─────────────┤
│Language Det │ → Locale detection via CF headers
├─────────────┤
│Rate Limiting│ → 100 req/min per IP
├─────────────┤
│Authorization│ → JWT validation & route protection
├─────────────┤
│   Handler   │ → Route/API endpoint
└─────────────┘
```

## Core Middleware (`middleware.ts`)

### Configuration

```typescript
export const config = {
  matcher: [
    // All routes except static files
    '/((?!_next/static|_next/image|favicon.ico|images|sitemap|robots|_vercel|public|worker|pages|index).*)',
    // All API routes
    '/api/:path*',
  ],
};
```

### Main Middleware Function

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // 1. Device tracking
  handleDeviceTracking(request, response);
  
  // 2. Security headers
  setSecurityHeaders(response);
  
  // 3. Language detection
  handleLanguageDetection(request, response);
  
  // 4. Rate limiting
  const rateLimitResult = await limitAPI(request, request.url, 100);
  if (!rateLimitResult.access) {
    return createResponse(await setMessage("APILimit", null, 429));
  }
  
  // 5. Skip auth endpoints
  if (pathname.startsWith('/api/auth')) {
    return response;
  }
  
  // 6. Authorization check
  const authResponse = await checkAuthorization(request, pathname);
  if (authResponse) {
    return authResponse;
  }
  
  return response;
}
```

## Security Features

### 1. Device Tracking

**Purpose:** Track client devices for session security and analytics.

```typescript
function handleDeviceTracking(request: NextRequest, response: NextResponse) {
  const deviceInfoCookie = request.cookies.get('deviceInfo');
  
  if (deviceInfoCookie) {
    logger.debug('Device tracking cookie already exists', 'API');
    return;
  }
  
  const { ipAddress, userAgent } = requestInfo(request);
  
  // Skip axios/bot requests
  if (!ipAddress || !userAgent || userAgent.includes('axios')) {
    return;
  }
  
  const deviceInfo = JSON.stringify({ ipAddress, userAgent });
  
  response.cookies.set('deviceInfo', deviceInfo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400 // 24 hours
  });
}
```

**Security Benefits:**
- Device fingerprinting for session validation
- Bot detection and filtering
- Secure cookie configuration
- IP tracking for audit logs

### 2. Security Headers

**Implementation:**

```typescript
function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}
```

**Additional Headers (Production):**

```typescript
// Content Security Policy
response.headers.set('Content-Security-Policy', 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' https://api.elice.io"
);

// Strict Transport Security
response.headers.set('Strict-Transport-Security', 
  'max-age=31536000; includeSubDomains; preload'
);

// Referrer Policy
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

// Permissions Policy
response.headers.set('Permissions-Policy', 
  'camera=(), microphone=(), geolocation=()'
);
```

### 3. Rate Limiting

**Core Implementation (`lib/server/limit.ts`):**

```typescript
const requestStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestStore) {
    if (now >= entry.resetTime) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function limitAPI(
  request: NextRequest,
  url: string,
  limit: number = 10,
  defaultTime: number = 60 * 1000
): Promise<RateLimitResult> {
  const clientIP = await requestIP(request);
  const key = `${clientIP}:${url}`;
  const now = Date.now();
  
  let entry = requestStore.get(key);
  
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + defaultTime
    };
    requestStore.set(key, entry);
    
    return {
      access: true,
      limit,
      remaining: limit - 1,
      resetTime: entry.resetTime
    };
  }
  
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  
  return {
    access: entry.count <= limit,
    limit,
    remaining,
    resetTime: entry.resetTime
  };
}
```

**Rate Limit Configuration:**

| Endpoint Type | Limit | Window | Notes |
|--------------|-------|---------|-------|
| Authentication | 5 | 1 min | Prevent brute force |
| API (default) | 100 | 1 min | General API protection |
| File Upload | 10 | 5 min | Large request protection |
| Password Reset | 3 | 15 min | Email flood prevention |
| Registration | 10 | 1 hour | Spam prevention |

### 4. Authorization

**Route Protection:**

```typescript
async function checkAuthorization(request: NextRequest, pathname: string) {
  const productRouter = authConfig.protected.some(route => 
    pathname.startsWith(route)
  );
  const publicRouter = authConfig.public.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  if (!productRouter || publicRouter) {
    return null; // Allow access
  }
  
  const refreshToken = request.cookies.get("token")?.value;
  if (refreshToken) {
    return null; // Has valid token
  }
  
  // API routes return 401
  if (pathname.startsWith('/api/')) {
    return createResponse(await setMessage('Unauthorized', null, 401));
  }
  
  // Web routes redirect to login
  return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
}
```

**Protected Routes Configuration:**

```typescript
export const authConfig = {
  protected: [
    '/admin',
    '/dashboard',
    '/profile',
    '/api/admin',
    '/api/user'
  ],
  public: [
    '/login',
    '/register', 
    '/api/auth',
    '/api/post', // Public blog API
    '/' // Homepage
  ]
};
```

### 5. Language Detection

**Implementation:**

```typescript
function handleLanguageDetection(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(COOKIE)) {
    return; // Already has language preference
  }
  
  const countryCode = request.headers.get('cf-ipcountry');
  const language = countryCode ? country(countryCode) : 'ko';
  response.cookies.set(COOKIE, language);
}
```

**Country to Language Mapping:**

```typescript
export const country = (code: string): string => {
  const mapping = {
    'KR': 'ko', // Korean
    'US': 'en', // English
    'GB': 'en',
    'JP': 'ja', // Japanese
    'RU': 'ru', // Russian
    // Default fallbacks
    'CN': 'zh',
    'TW': 'zh',
    'FR': 'fr',
    'DE': 'de',
    'ES': 'es'
  };
  
  return mapping[code] || 'ko'; // Default to Korean
};
```

## Request Information Utilities

### IP Address Extraction (`lib/server/info.ts`)

```typescript
export const requestIP = async (request: NextRequest): Promise<string> => {
  // Priority order for IP detection
  const ip = 
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-real-ip') ||         // Nginx proxy
    request.headers.get('x-forwarded-for')?.split(',')[0] || // Standard proxy
    request.ip ||                                // Direct connection
    '127.0.0.1';                                // Fallback
    
  return ip.trim();
};
```

### User Agent Parsing

```typescript
export const requestInfo = (request: NextRequest) => {
  const userAgent = request.headers.get('user-agent') || '';
  const ipAddress = await requestIP(request);
  
  // Parse user agent for device info
  const isMobile = /mobile|android|iphone/i.test(userAgent);
  const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  
  return {
    ipAddress,
    userAgent,
    isMobile,
    isBot,
    browser,
    os,
    timestamp: new Date().toISOString()
  };
};
```

## Response Handling

### Standard Response Format

```typescript
export const createResponse = (data: any, status: number = 200) => {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
};
```

### Error Response Builder

```typescript
export const setMessage = async (
  type: string,
  data?: any,
  status?: number
) => {
  const messages = {
    Success: { message: 'Operation successful', status: 200 },
    Created: { message: 'Resource created', status: 201 },
    BadRequest: { message: 'Invalid request', status: 400 },
    Unauthorized: { message: 'Authentication required', status: 401 },
    Forbidden: { message: 'Access denied', status: 403 },
    NotFound: { message: 'Resource not found', status: 404 },
    APILimit: { message: 'Rate limit exceeded', status: 429 },
    ServerError: { message: 'Internal server error', status: 500 }
  };
  
  const response = messages[type] || messages.ServerError;
  
  return {
    success: status < 400,
    ...response,
    data,
    timestamp: new Date().toISOString()
  };
};
```

## Logging and Monitoring

### Request Logging

```typescript
export const logRequest = (
  request: NextRequest,
  response: NextResponse,
  duration: number
) => {
  const logData = {
    method: request.method,
    path: request.nextUrl.pathname,
    query: Object.fromEntries(request.nextUrl.searchParams),
    status: response.status,
    duration: `${duration}ms`,
    ip: request.headers.get('cf-connecting-ip'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  };
  
  if (response.status >= 400) {
    logger.error('Request failed', logData);
  } else if (duration > 1000) {
    logger.warn('Slow request', logData);
  } else {
    logger.info('Request completed', logData);
  }
};
```

### Performance Monitoring

```typescript
export async function middleware(request: NextRequest) {
  const start = Date.now();
  
  try {
    // ... middleware logic ...
    const response = await processRequest(request);
    const duration = Date.now() - start;
    
    // Add timing header
    response.headers.set('X-Response-Time', `${duration}ms`);
    
    // Log if slow
    if (duration > 1000) {
      logger.warn('Slow middleware execution', {
        path: request.nextUrl.pathname,
        duration
      });
    }
    
    return response;
  } catch (error) {
    logger.error('Middleware error', error);
    return createResponse(
      await setMessage('ServerError', null, 500)
    );
  }
}
```

## CORS Configuration

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

// Handle preflight requests
if (request.method === 'OPTIONS') {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
```

## Testing Middleware

### Unit Tests

```typescript
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Middleware', () => {
  it('should add security headers', async () => {
    const request = new NextRequest(
      new Request('http://localhost:3000/')
    );
    
    const response = await middleware(request);
    
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });
  
  it('should enforce rate limiting', async () => {
    const request = new NextRequest(
      new Request('http://localhost:3000/api/test')
    );
    
    // Simulate multiple requests
    for (let i = 0; i < 101; i++) {
      const response = await middleware(request);
      
      if (i < 100) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
  
  it('should protect authenticated routes', async () => {
    const request = new NextRequest(
      new Request('http://localhost:3000/admin')
    );
    
    const response = await middleware(request);
    
    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get('location')).toContain('/login');
  });
});
```

### Integration Tests

```typescript
describe('Middleware Integration', () => {
  it('should handle complete request flow', async () => {
    const request = new NextRequest(
      new Request('http://localhost:3000/api/posts'),
      {
        headers: {
          'cf-ipcountry': 'US',
          'cf-connecting-ip': '192.168.1.1',
          'user-agent': 'Mozilla/5.0'
        }
      }
    );
    
    const response = await middleware(request);
    
    // Check all middleware layers
    expect(response.cookies.get('deviceInfo')).toBeDefined();
    expect(response.cookies.get('locale')?.value).toBe('en');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.status).toBe(200);
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache middleware results for static content
const cache = new Map();

export async function cachedMiddleware(request: NextRequest) {
  const cacheKey = `${request.method}:${request.nextUrl.pathname}`;
  
  // Check cache for GET requests
  if (request.method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.response.clone();
    }
  }
  
  const response = await middleware(request);
  
  // Cache successful GET responses
  if (request.method === 'GET' && response.status === 200) {
    cache.set(cacheKey, {
      response: response.clone(),
      timestamp: Date.now()
    });
  }
  
  return response;
}
```

### Early Returns

```typescript
export async function optimizedMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Fast path for static assets
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    return NextResponse.next();
  }
  
  // Fast path for public routes
  if (authConfig.public.includes(pathname)) {
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }
  
  // Full middleware for other routes
  return middleware(request);
}
```

## Troubleshooting

### Common Issues

1. **Rate Limit Memory Leak**
   - Issue: Memory grows over time
   - Solution: Ensure cleanup interval is running
   - Monitor: Check `requestStore.size` periodically

2. **Cookie Not Setting**
   - Issue: Device tracking fails
   - Check: Secure flag in development
   - Solution: Adjust cookie settings for environment

3. **CORS Errors**
   - Issue: Cross-origin requests blocked
   - Check: Allowed origins configuration
   - Solution: Add origin to whitelist

4. **Slow Middleware**
   - Issue: High latency on requests
   - Check: Database queries in middleware
   - Solution: Use caching and early returns

## Best Practices

### Security
- Always validate and sanitize inputs
- Use secure cookie settings
- Implement defense in depth
- Log security events
- Regular security audits

### Performance
- Use early returns for known paths
- Cache when appropriate
- Avoid blocking operations
- Monitor execution time
- Optimize regex patterns

### Maintenance
- Keep middleware focused and simple
- Document all security decisions
- Test edge cases thoroughly
- Monitor error rates
- Version control configurations

---

This middleware architecture provides comprehensive security and request processing for the elice-next application, with multiple layers of protection and optimization for production use.