# Authentication System Documentation

## Overview

The elice-next authentication system provides a comprehensive, enterprise-grade solution with JWT tokens, social login integration, and advanced security features. The system is designed for scalability, security, and user experience.

## Architecture

### Core Components
```
Authentication System/
├── JWT Token Management      # Access & refresh token handling
├── Social Authentication     # OAuth provider integration
├── Session Management        # Device tracking & cleanup  
├── Security Middleware       # Route protection & rate limiting
├── Database Layer           # User, auth, and session models
└── Client Integration       # Redux store & API client
```

### Security Philosophy
- **Zero Trust**: Verify everything, trust nothing
- **Defense in Depth**: Multiple security layers
- **Principle of Least Privilege**: Minimal access rights
- **Secure by Default**: Safe configurations out of the box

## JWT Token System

### Token Architecture
The system uses a dual-token approach for optimal security and user experience:

```typescript
interface TokenSystem {
  accessToken: {
    purpose: 'API Authorization';
    storage: 'Memory Only';
    expiry: '15 minutes';
    security: 'High';
  };
  refreshToken: {
    purpose: 'Token Renewal';
    storage: 'HTTP-Only Cookie';
    expiry: '7 days';
    security: 'Maximum';
  };
}
```

### Token Manager Implementation

#### Client-Side Token Management
```typescript
// lib/services/token/manager.ts
export const tokenManager = createTokenManager();

// Get valid access token
const token = await tokenManager.getAccessToken();
if (!token) {
  // Token expired or invalid - will attempt refresh
  const refreshed = await tokenManager.refreshAccessToken();
  if (!refreshed) {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

#### Token Client Operations
```typescript
// lib/services/token/client.ts
export const tokenClient = {
  // Store access token in memory
  set: (token: string) => void,
  
  // Retrieve current access token
  get: () => TokenData | null,
  
  // Check if token is expired
  expired: (token: string) => boolean,
  
  // Decode JWT payload
  decode: (token: string) => JWTPayload | null,
  
  // Clear all tokens
  clear: () => void
};
```

### Token Flow Diagram
```
[User Login] → [Server Validation] → [Generate Tokens]
     ↓
[Access Token] → [Memory Storage] → [API Requests]
     ↓
[Refresh Token] → [HTTP-Only Cookie] → [Token Renewal]
     ↓
[Token Expiry] → [Automatic Refresh] → [New Access Token]
     ↓
[Refresh Failure] → [Clear Tokens] → [Redirect Login]
```

## Authentication Flows

### 1. Email/Password Authentication

#### Registration Flow
```typescript
// 1. User Registration
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "name": "User Name",
  "marketing": true,
  "terms": true
}

// 2. Email Verification Required
Response: {
  "success": true,
  "message": "Please check your email for verification",
  "data": { "emailVerification": true }
}

// 3. Email Verification
POST /api/auth/verify
{
  "token": "email_verification_token"
}

// 4. Account Activated + Auto Login
Response Headers:
Authorization: Bearer <access_token>
Set-Cookie: token=<refresh_token>; HttpOnly; Secure
```

#### Login Flow
```typescript
// 1. Login Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// 2. Server Validation
- Verify email exists
- Check password hash (Argon2)
- Generate device fingerprint
- Create session record

// 3. Token Generation
- Generate JWT access token (15min)
- Generate refresh token (7 days)
- Set secure cookies

// 4. Client Token Storage
- Access token → Memory
- User data → Redux store
- Automatic API integration
```

### 2. Social Authentication

#### Supported Providers
- **Kakao** - Primary Korean market
- **Google** - Global OAuth provider
- **Naver** - Korean market alternative
- **Apple** - iOS/macOS integration

#### OAuth Flow
```typescript
// 1. Social Login Initiation
const authUrl = `https://kauth.kakao.com/oauth/authorize?${params}`;
window.location.href = authUrl;

// 2. OAuth Callback
GET /api/auth/kakao?code=authorization_code

// 3. Server Processing
- Exchange code for access token
- Fetch user profile from provider
- Check existing account or create new
- Generate internal JWT tokens

// 4. Account Linking
- Link social account to user record
- Store social tokens for future API calls
- Return elice-next JWT tokens
```

#### Social Provider Configuration
```typescript
// constants/auth/client.ts
export const socialConfig = {
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/kakao`,
    scope: ['profile_nickname', 'account_email']
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/google`,
    scope: ['openid', 'profile', 'email']
  }
};
```

## Session Management

### Session Model
```typescript
// Prisma Schema
model Session {
  sessionId        String    @id
  userId           String
  refreshToken     String    @unique
  deviceInfo       String?   // Device fingerprint
  ipAddress        String?
  userAgent        String?
  active           Boolean   @default(true)
  lastActivityTime DateTime?
  loginType        String    @default("email")
  expiresTime      DateTime
  createdTime      DateTime  @default(now())
  updateTime       DateTime  @updatedAt
}
```

### Device Fingerprinting
```typescript
// middleware.ts - Device tracking
function handleDeviceTracking(request: NextRequest, response: NextResponse) {
  const { ipAddress, userAgent } = requestInfo(request);
  
  // Skip if already tracked or axios request
  if (request.cookies.get('deviceInfo') || userAgent?.includes('axios')) {
    return;
  }
  
  // Create device fingerprint
  const deviceInfo = JSON.stringify({ ipAddress, userAgent });
  
  response.cookies.set('deviceInfo', deviceInfo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400 // 24 hours
  });
}
```

### Session Cleanup
```typescript
// lib/services/session/cleanup.ts
export const cleanupExpiredSessions = async () => {
  const expired = new Date();
  
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresTime: { lt: expired } },
        { active: false },
        { lastActivityTime: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      ]
    }
  });
  
  return result.count;
};
```

## Security Features

### 1. Password Security
```typescript
// lib/auth/password.ts - Argon2 implementation
import argon2 from 'argon2';

export const hashPassword = async (password: string): Promise<{
  hash: string;
  salt: string;
}> => {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64MB
    timeCost: 3,
    parallelism: 1,
    salt: Buffer.from(salt, 'hex')
  });
  
  return { hash, salt };
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await argon2.verify(hash, password);
};
```

### 2. Rate Limiting
```typescript
// lib/server/limit.ts
export const limitAPI = async (
  request: NextRequest,
  endpoint: string,
  maxRequests: number = 100
): Promise<{ access: boolean; remaining: number }> => {
  const identifier = getClientIdentifier(request);
  const key = `rate_limit:${identifier}:${endpoint}`;
  
  // Redis-based rate limiting
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  return {
    access: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count)
  };
};
```

### 3. Security Headers
```typescript
// next.config.ts - Security headers
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }
  ];
}
```

### 4. CSRF Protection
```typescript
// Middleware CSRF protection
export async function middleware(request: NextRequest) {
  // Check for secure headers on state-changing requests
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    if (!isValidOrigin(origin, request.url)) {
      return new Response('CSRF token mismatch', { status: 403 });
    }
  }
}
```

## Route Protection

### Middleware Configuration
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route requires authentication
  const isProtected = authConfig.protected.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublic = authConfig.public.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  if (isProtected && !isPublic) {
    const refreshToken = request.cookies.get("token")?.value;
    
    if (!refreshToken) {
      // Redirect to login for page routes
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
      }
      // Return 401 for API routes
      return createResponse(await setMessage('Unauthorized', null, 401));
    }
  }
  
  return NextResponse.next();
}
```

### Auth Configuration
```typescript
// constants/auth/client.ts
export const authConfig = {
  protected: [
    '/admin',
    '/api/admin',
    '/profile',
    '/settings'
  ],
  public: [
    '/login',
    '/register',
    '/api/auth',
    '/api/post' // Public blog endpoints
  ],
  endpoints: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh'
  }
};
```

## Redux Integration

### Auth Slice
```typescript
// stores/slice/auth.ts
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Async thunk handlers for login, register, etc.
  }
});
```

### Auth Thunks
```typescript
// Async actions for authentication
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: AuthCredentials) => {
    const { data, headers } = await api.post('/api/auth/login', credentials);
    
    // Extract and store token
    const token = headers.Authorization.replace('Bearer ', '');
    tokenClient.set(token);
    
    // Decode user info from token
    const decoded = tokenClient.decode(token);
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles
    };
  }
);
```

## Error Handling

### Authentication Errors
```typescript
// lib/auth/errors.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED',
  SOCIAL_AUTH_FAILED = 'SOCIAL_AUTH_FAILED'
}
```

### Error Recovery
```typescript
// Automatic error recovery in API client
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const newToken = await tokenManager.refreshAccessToken();
      
      if (newToken) {
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } else {
        // Redirect to login
        store.dispatch(clearUser());
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Testing Authentication

### Unit Tests
```typescript
// __tests__/auth/tokenManager.test.ts
describe('TokenManager', () => {
  it('should refresh expired access token', async () => {
    // Mock expired token
    tokenClient.set(expiredToken);
    
    // Mock refresh API response
    mockApi.post.mockResolvedValue({
      data: { success: true },
      headers: { Authorization: 'Bearer new_token' }
    });
    
    const token = await tokenManager.getAccessToken();
    expect(token).toBe('new_token');
  });
});
```

### Integration Tests
```typescript
// __tests__/api/auth.test.ts
describe('Auth API', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers.authorization).toBeDefined();
  });
});
```

## Security Best Practices

### 1. Token Security
- ✅ Access tokens in memory only (never localStorage)
- ✅ Refresh tokens in HTTP-only cookies
- ✅ Short access token expiry (15 minutes)
- ✅ Automatic token rotation
- ✅ Secure cookie attributes

### 2. Password Security
- ✅ Argon2id hashing algorithm
- ✅ Cryptographically secure salt
- ✅ Memory-hard parameters
- ✅ Password complexity requirements
- ✅ Rate limiting on auth endpoints

### 3. Session Security
- ✅ Device fingerprinting
- ✅ IP address tracking
- ✅ Session timeout handling
- ✅ Concurrent session management
- ✅ Automatic cleanup

### 4. API Security
- ✅ HTTPS enforcement
- ✅ Security headers
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation with Zod

## Deployment Considerations

### Environment Variables
```bash
# Required for production
DATABASE_URL="postgresql://..."
JWT_SECRET="cryptographically-secure-secret"
JWT_REFRESH_SECRET="different-secure-secret"

# Social OAuth
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-secret"

# Redis for rate limiting
UPSTASH_REDIS_URL="your-redis-url"
UPSTASH_REDIS_TOKEN="your-redis-token"
```

### Production Checklist
- [ ] HTTPS enabled and enforced
- [ ] Secure cookie configuration
- [ ] Rate limiting configured
- [ ] Session cleanup scheduled
- [ ] Error monitoring setup
- [ ] Security headers verified
- [ ] OAuth callbacks registered
- [ ] Database connections secured

This authentication system provides enterprise-grade security with excellent developer experience. The modular architecture allows for easy testing, maintenance, and feature additions.