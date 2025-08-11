# Database Architecture Documentation

## Overview

The elice-next project uses Prisma ORM with PostgreSQL for data persistence, implementing a modular database access layer with advanced features including connection pooling, query caching, and batch operations.

## Architecture

### Core Components

#### Database Client (`lib/db/prisma.ts`)
Singleton Prisma client with connection pooling and query logging.

```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

#### Connection Manager (`lib/db/connection-manager.ts`)
Advanced connection management with retry logic and health monitoring.

**Key Features:**
- Connection status monitoring
- Automatic retry with exponential backoff
- Batch query optimization
- Connection pool cleanup

```typescript
// Connection status check
export const getConnectionStatus = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', timestamp: new Date() };
  } catch (error) {
    return { status: 'disconnected', error };
  }
};

// Retry wrapper for resilient operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
};
```

### Data Models

#### User Model (`lib/db/user.ts`)

**Core Functions:**

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `createUser` | Create new user with hashed password | UserCreateData | User |
| `findUserByEmail` | Find user by email address | email: string | User \| null |
| `findUserById` | Find user by ID | id: string | User \| null |
| `updateUser` | Update user data | id, data | User |
| `deleteUser` | Soft delete user | id: string | User |
| `getAdminUsers` | Get paginated admin users | AdminUserParams | PaginatedUsers |

**Security Features:**
- Argon2 password hashing
- Sensitive field exclusion
- Role-based access control
- Soft deletion support

```typescript
export const createUser = async (data: UserCreateData) => {
  const hashedPassword = await argon2.hash(data.password);
  
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      roles: {
        connect: { name: 'USER' } // Default role
      }
    },
    select: userSelectFields // Exclude sensitive data
  });
};
```

#### Session Model (`lib/db/session.ts`)

**Session Management:**

```typescript
interface SessionData {
  userId: string;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
}

export const createSession = async (data: SessionData) => {
  // Clean expired sessions first
  await cleanExpiredSessions(data.userId);
  
  return prisma.session.create({
    data: {
      ...data,
      deviceFingerprint: generateFingerprint(data.userAgent, data.ipAddress)
    }
  });
};

export const validateSession = async (
  refreshToken: string,
  deviceInfo: DeviceInfo
): Promise<Session | null> => {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  // Validate device fingerprint
  const fingerprint = generateFingerprint(deviceInfo.userAgent, deviceInfo.ipAddress);
  if (session.deviceFingerprint !== fingerprint) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  
  return session;
};
```

**Session Features:**
- Device fingerprinting for security
- Automatic expired session cleanup
- Refresh token rotation
- Concurrent session limits

#### Role Model (`lib/db/roles.ts`)

**RBAC Implementation:**

```typescript
export const roleHierarchy = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
  ADMIN: ['ADMIN', 'MODERATOR', 'USER'],
  MODERATOR: ['MODERATOR', 'USER'],
  USER: ['USER']
};

export const checkPermission = async (
  userId: string,
  requiredRole: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });
  
  if (!user) return false;
  
  const userRoles = user.roles.map(r => r.name);
  const allowedRoles = roleHierarchy[requiredRole] || [];
  
  return userRoles.some(role => allowedRoles.includes(role));
};
```

#### Notification Model (`lib/db/notification.ts`)

**Notification System:**

```typescript
export const createBulkNotifications = async (
  data: BulkNotificationCreateData
) => {
  const { userIds, ...notificationData } = data;
  
  return prisma.notification.createMany({
    data: userIds.map(userId => ({
      ...notificationData,
      userId,
      isRead: false,
      createdAt: new Date()
    }))
  });
};

export const markAsRead = async (
  userId: string,
  notificationIds?: string[]
) => {
  const where = notificationIds 
    ? { id: { in: notificationIds }, userId }
    : { userId, isRead: false };
    
  return prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() }
  });
};
```

### Database Schema

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String?
  name          String?
  profileImage  String?
  bio           String?
  
  // OAuth fields
  provider      String?
  providerId    String?
  
  // Status fields
  isActive      Boolean        @default(true)
  isDeleted     Boolean        @default(false)
  emailVerified DateTime?
  
  // Timestamps
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  
  // Relations
  sessions      Session[]
  roles         Role[]
  notifications Notification[]
  posts         Post[]
  comments      Comment[]
  
  @@index([email])
  @@index([provider, providerId])
}

model Session {
  id                String   @id @default(cuid())
  userId            String
  refreshToken      String   @unique
  accessToken       String?
  deviceFingerprint String
  userAgent         String
  ipAddress         String
  expiresAt         DateTime
  createdAt         DateTime @default(now())
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([refreshToken])
  @@index([userId])
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions Json     @default("[]")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  
  @@index([name])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  data      Json?
  isRead    Boolean   @default(false)
  readAt    DateTime?
  createdAt DateTime  @default(now())
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, isRead])
  @@index([createdAt])
}
```

## Query Patterns

### Pagination Pattern

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export const paginate = async <T>(
  model: any,
  params: PaginationParams,
  where?: any
): Promise<PaginatedResult<T>> => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.orderBy || 'createdAt']: params.order || 'desc' }
    }),
    model.count({ where })
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

### Transaction Pattern

```typescript
export const transferOwnership = async (
  fromUserId: string,
  toUserId: string,
  resourceIds: string[]
) => {
  return prisma.$transaction(async (tx) => {
    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      tx.user.findUnique({ where: { id: fromUserId } }),
      tx.user.findUnique({ where: { id: toUserId } })
    ]);
    
    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }
    
    // Transfer resources
    await tx.post.updateMany({
      where: { 
        id: { in: resourceIds },
        userId: fromUserId
      },
      data: { userId: toUserId }
    });
    
    // Log the transfer
    await tx.auditLog.create({
      data: {
        action: 'TRANSFER_OWNERSHIP',
        fromUserId,
        toUserId,
        metadata: { resourceIds }
      }
    });
    
    return { success: true, transferredCount: resourceIds.length };
  });
};
```

### Soft Delete Pattern

```typescript
export const softDelete = async (
  model: any,
  id: string
): Promise<any> => {
  return model.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};

export const restore = async (
  model: any,
  id: string
): Promise<any> => {
  return model.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null
    }
  });
};
```

## Performance Optimization

### Query Optimization

```typescript
// Bad: N+1 query problem
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({ 
    where: { id: post.userId } 
  });
}

// Good: Single query with includes
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
});
```

### Index Strategy

```sql
-- User table indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_provider ON "User"(provider, "providerId");

-- Session table indexes
CREATE INDEX idx_session_token ON "Session"("refreshToken");
CREATE INDEX idx_session_user ON "Session"("userId");
CREATE INDEX idx_session_expires ON "Session"("expiresAt");

-- Notification indexes
CREATE INDEX idx_notification_user ON "Notification"("userId", "isRead");
CREATE INDEX idx_notification_created ON "Notification"("createdAt" DESC);
```

### Connection Pooling

```typescript
// Database URL with connection pooling
DATABASE_URL="postgresql://user:password@localhost:5432/elice?schema=public&connection_limit=20"

// Prisma configuration
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["metrics", "tracing"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Migration Management

### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_user_preferences

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices

1. **Always review generated SQL:**
```bash
npx prisma migrate dev --create-only
# Review migration in prisma/migrations folder
npx prisma migrate dev
```

2. **Handle data migrations:**
```typescript
// prisma/migrations/custom_migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Perform data migration
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "emailVerified" = NOW() 
    WHERE "emailVerified" IS NULL AND "isActive" = true
  `;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

3. **Backup before migrations:**
```bash
# Backup database
pg_dump elice_production > backup_$(date +%Y%m%d).sql

# Run migration
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

## Monitoring and Metrics

### Query Performance Monitoring

```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' }
  ],
});

prisma.$on('query', (e) => {
  console.log(`Query: ${e.query}`);
  console.log(`Duration: ${e.duration}ms`);
  
  // Alert on slow queries
  if (e.duration > 1000) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      timestamp: e.timestamp
    });
  }
});
```

### Database Health Checks

```typescript
export const healthCheck = async (): Promise<HealthStatus> => {
  const checks = {
    database: false,
    migrations: false,
    connectionPool: false
  };
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    
    // Check migrations are up to date
    const pendingMigrations = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "_prisma_migrations" 
      WHERE "finished_at" IS NULL
    `;
    checks.migrations = pendingMigrations[0].count === 0;
    
    // Check connection pool
    const poolStats = await prisma.$metrics.json();
    checks.connectionPool = poolStats.counters
      .find(c => c.key === 'prisma_pool_connections_open')
      ?.value < 18; // Under 90% of max connections
    
  } catch (error) {
    logger.error('Health check failed', error);
  }
  
  return {
    healthy: Object.values(checks).every(v => v),
    checks,
    timestamp: new Date()
  };
};
```

## Testing

### Database Testing Strategy

```typescript
// tests/db/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export const setupTestDatabase = async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  
  // Reset and migrate
  execSync('npx prisma migrate reset --force --skip-seed');
  
  return prisma;
};

export const cleanupTestDatabase = async () => {
  await prisma.$disconnect();
};
```

### Integration Tests

```typescript
// tests/db/user.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import * as User from '@/lib/db/user';

describe('User Database Operations', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('should create a user with hashed password', async () => {
    const user = await User.createUser({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User'
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBeUndefined(); // Should be excluded
    expect(user.id).toBeDefined();
  });
  
  it('should handle concurrent session creation', async () => {
    const userId = 'test-user-id';
    const sessions = await Promise.all([
      Session.createSession({ userId, /* ... */ }),
      Session.createSession({ userId, /* ... */ }),
      Session.createSession({ userId, /* ... */ })
    ]);
    
    expect(sessions).toHaveLength(3);
    expect(new Set(sessions.map(s => s.id)).size).toBe(3);
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
```typescript
// Symptom: "Too many connections" error
// Solution: Ensure proper connection cleanup
export const safeQuery = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } finally {
    await prisma.$disconnect();
  }
};
```

2. **Migration Conflicts**
```bash
# Reset migrations in development
npx prisma migrate reset

# Force resolve in production (use carefully)
npx prisma migrate resolve --applied "migration_name"
```

3. **Query Performance Issues**
```typescript
// Use query analysis
const result = await prisma.$queryRaw`
  EXPLAIN ANALYZE 
  SELECT * FROM "User" 
  WHERE email = ${email}
`;
console.log(result);
```

## Best Practices

### Security
- Always hash passwords with Argon2
- Use parameterized queries (Prisma handles this)
- Implement row-level security where needed
- Exclude sensitive fields from selections
- Validate all user inputs

### Performance
- Use indexes strategically
- Implement connection pooling
- Cache frequently accessed data
- Batch operations when possible
- Monitor slow queries

### Maintenance
- Regular database backups
- Test migrations in staging
- Monitor database metrics
- Clean up expired data regularly
- Document schema changes

---

This database architecture provides a robust, secure, and performant foundation for the elice-next application, with comprehensive patterns for common operations and clear guidelines for maintenance and optimization.