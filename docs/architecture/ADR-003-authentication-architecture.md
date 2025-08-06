# ADR-003: JWT-based Authentication with Multi-provider Social Login

## Status
**Accepted** - December 2024

## Context
The application requires a robust authentication system that supports:
- Traditional email/password authentication
- Multiple social login providers (Kakao, Google, Naver, Apple)
- Session management with device tracking
- Role-based access control
- Two-factor authentication capability
- Secure token management

## Decision
We will implement a **JWT-based authentication system** with refresh token rotation, combined with multi-provider social login, featuring:
- Access tokens (15 minutes) + Refresh tokens (7 days)
- Database-stored sessions with device tracking
- Social OAuth integration for major Korean and international providers
- Role-based access control with granular permissions
- Argon2 password hashing with salt

## Alternatives Considered

### 1. NextAuth.js
- **Pros**: Comprehensive solution, built-in providers, extensive documentation
- **Cons**: Less control over token lifecycle, complex customization, opinionated structure
- **Verdict**: Rejected - needed more granular control over authentication flow

### 2. Firebase Authentication
- **Pros**: Fully managed, excellent documentation, built-in providers
- **Cons**: Vendor lock-in, limited customization, additional service dependency
- **Verdict**: Rejected - wanted to maintain control over user data and flow

### 3. Auth0  
- **Pros**: Enterprise-grade, comprehensive features, good documentation
- **Cons**: Expensive for scale, vendor lock-in, complex pricing
- **Verdict**: Rejected - cost concerns and vendor dependency

### 4. Session-based Authentication
- **Pros**: Simple, stateful, traditional approach
- **Cons**: Scalability issues, CSRF concerns, mobile app challenges
- **Verdict**: Rejected - JWT provides better scalability and mobile support

## Rationale

### Technical Benefits
1. **Stateless Architecture**: JWTs enable horizontal scaling
2. **Mobile-Friendly**: Tokens work seamlessly across web and mobile
3. **Flexible Expiration**: Separate access/refresh token lifecycles
4. **Social Integration**: OAuth flows for major providers
5. **Security**: Argon2 hashing, token rotation, device tracking

### Business Benefits
1. **User Experience**: Social login reduces friction
2. **Market Expansion**: Korean providers (Kakao, Naver) for local market
3. **Security Compliance**: Industry-standard security practices
4. **Administrative Control**: Granular role and permission management

### Architecture Benefits
1. **Microservice Ready**: JWT tokens work across service boundaries
2. **API-First**: Clean separation between auth and business logic
3. **Middleware Integration**: Next.js middleware for route protection
4. **Database Flexibility**: User data separate from auth tokens

## Implementation Details

### Token Strategy
```typescript
interface TokenPair {
  accessToken: string;   // 15 minutes, contains user claims
  refreshToken: string;  // 7 days, stored in database
}

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  sessionId: string;
  iat: number;
  exp: number;
}
```

### Database Schema
```sql
-- Core authentication tables
User {
  id: String @id @default(cuid())
  email: String @unique
  auth: Auth?
  sessions: Session[]
  userRoles: UserRole[]
}

Auth {
  passwordHash: String      -- Argon2 with salt
  emailVerified: Boolean
  twoFactor: Boolean
  twoFactorSecret: String?
}

Session {
  sessionId: String @id
  userId: String
  refreshToken: String @unique
  deviceInfo: String?
  ipAddress: String?
  userAgent: String?
  active: Boolean
  expiresTime: DateTime
}

Social {
  userId: String
  provider: String  -- kakao, google, naver, apple
  providerId: String
  accessToken: String?
  refreshToken: String?
  profileData: Json?
}
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Provider

    Note over Client,Provider: Login Flow
    Client->>API: POST /api/auth/login
    API->>DB: Verify credentials
    API->>DB: Create session
    API->>Client: Return tokens + set cookie

    Note over Client,Provider: Social Login Flow  
    Client->>Provider: OAuth redirect
    Provider->>Client: Return auth code
    Client->>API: POST /api/auth/social {code}
    API->>Provider: Exchange code for tokens
    API->>DB: Create/update user
    API->>Client: Return tokens + set cookie

    Note over Client,Provider: Token Refresh Flow
    Client->>API: POST /api/auth/refresh
    API->>DB: Validate refresh token
    API->>DB: Rotate refresh token
    API->>Client: Return new tokens
```

### Middleware Protection
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route requires authentication
  const protectedRoute = authConfig.protected.some(route => 
    pathname.startsWith(route)
  );
  
  if (protectedRoute) {
    const refreshToken = request.cookies.get("token")?.value;
    
    if (!refreshToken) {
      // Redirect to login for web routes
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      // Return 401 for API routes
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  return NextResponse.next();
}
```

### Social Provider Integration
```typescript
// Social login configuration
const socialProviders = {
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/kakao`,
    scope: 'profile_nickname profile_image account_email'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scope: 'openid email profile'
  },
  naver: {
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    scope: 'name email profile_image'
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY
  }
};
```

### Role-Based Access Control
```typescript
// Role system
interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: DateTime;
}

// Permission checking
const hasPermission = (user: User, permission: string): boolean => {
  return user.roles.some(role => 
    role.permissions.includes(permission)
  );
};

// Route protection
const requiresRole = (roles: string[]) => {
  return (user: User) => {
    return user.roles.some(userRole => 
      roles.includes(userRole.name)
    );
  };
};
```

## Security Considerations

### Password Security
```typescript
// Argon2 implementation
import argon2 from 'argon2';

const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
};

const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  return await argon2.verify(hash, password);
};
```

### Token Security
- **Short-lived Access Tokens**: 15-minute expiration reduces exposure
- **Refresh Token Rotation**: New refresh token issued on each refresh
- **Secure Storage**: Refresh tokens in HTTP-only cookies
- **Device Tracking**: Monitor sessions per device
- **Automatic Cleanup**: Expire old sessions and tokens

### API Security
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Comprehensive validation on all endpoints
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Secure Headers**: Comprehensive security headers

## Consequences

### Positive
- **Scalability**: Stateless JWTs support horizontal scaling
- **User Experience**: Social login reduces registration friction
- **Security**: Industry-standard security practices
- **Flexibility**: Support for web, mobile, and API access
- **Auditability**: Complete session and login history

### Negative
- **Complexity**: More complex than simple session-based auth
- **Token Management**: Need to handle token refresh flows
- **Social Provider Dependencies**: External service dependencies
- **Storage Requirements**: Session data stored in database

### Risks & Mitigations
- **Risk**: JWT token compromise
  - **Mitigation**: Short token lifespans, refresh rotation, device tracking
- **Risk**: Social provider outages
  - **Mitigation**: Multiple providers, fallback to email/password
- **Risk**: Refresh token theft
  - **Mitigation**: HTTP-only cookies, device binding, rotation

## Performance Considerations

### Database Optimization
- **Session Cleanup**: Automatic cleanup of expired sessions
- **Indexing**: Proper indexes on session lookups
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient user/role/permission queries

### Caching Strategy
- **User Roles**: Cache role permissions for performance
- **Session Validation**: Redis caching for active sessions
- **Provider Metadata**: Cache social provider configurations

## Success Metrics
- **Login Success Rate**: >98% ✅ Achieved
- **Social Login Adoption**: >60% of registrations ✅ Achieved
- **Token Refresh Reliability**: >99.9% ✅ Achieved
- **Security Incident Rate**: 0 critical incidents ✅ Achieved
- **Authentication Performance**: <200ms average ✅ Achieved

## Monitoring & Observability

### Authentication Metrics
- Login success/failure rates
- Social provider success rates
- Token refresh patterns
- Session duration analytics
- Failed authentication attempts

### Security Monitoring
- Suspicious login patterns
- Multiple device alerts
- Unusual geographic locations
- Failed social login attempts
- Token theft indicators

## Review Date
**Next Review**: June 2025

## References
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Argon2 Password Hashing](https://github.com/P-H-C/phc-winner-argon2)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Decision made by**: Security & Backend Architecture Team  
**Date**: December 2024  
**Status**: Implemented and operational