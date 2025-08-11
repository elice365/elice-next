# Developer Guide

## Overview

This comprehensive developer guide covers setup, development workflows, coding standards, and best practices for the elice-next project. Whether you're a new contributor or an experienced developer, this guide will help you work effectively with the codebase.

## Quick Start

### Prerequisites
- **Node.js**: 18.17+ or 20.0+
- **pnpm**: 8.0+ (recommended package manager)
- **PostgreSQL**: 15+ (for database)
- **Redis**: 6+ (for caching and rate limiting)
- **Git**: For version control

### Setup Commands
```bash
# Clone repository
git clone <repository-url>
cd elice-next

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma db push

# Start development server
pnpm dev
```

### Verify Installation
```bash
# Check server is running
curl http://localhost:3000/api/health

# Check database connection
npx prisma studio
```

## Development Workflow

### Daily Development
```bash
# 1. Start development server with hot reload
pnpm dev

# 2. Run type checking in parallel
pnpm type-check --watch

# 3. Run linting for code quality
pnpm lint

# 4. Database operations (as needed)
npx prisma studio          # GUI for data
npx prisma db push         # Sync schema changes
npx prisma migrate dev     # Create migration
```

### Feature Development Process
```bash
# 1. Create feature branch
git checkout -b feature/new-auth-flow

# 2. Make changes with frequent commits
git add .
git commit -m "feat: add social login integration"

# 3. Run tests and validation
pnpm type-check
pnpm lint
pnpm test # if tests are available

# 4. Create pull request
git push origin feature/new-auth-flow
# Create PR through GitHub interface
```

## Project Structure Deep Dive

### Directory Organization
```
elice-next/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 (admin)/           # Admin route group (protected)
│   ├── 📁 (main)/            # Public route group  
│   ├── 📁 api/               # API endpoints
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── 📁 components/            # React components
│   ├── 📁 features/          # Domain-specific components
│   ├── 📁 ui/                # Reusable UI components
│   ├── 📁 layout/            # Layout components
│   └── 📁 provider/          # Context providers
├── 📁 lib/                   # Business logic & utilities
│   ├── 📁 auth/              # Authentication utilities
│   ├── 📁 db/                # Database operations
│   ├── 📁 services/          # External service integrations
│   └── 📁 validation/        # Schema validation
├── 📁 stores/                # Redux state management
│   └── 📁 slice/             # Redux slices
├── 📁 types/                 # TypeScript definitions
├── 📁 constants/             # Configuration constants
├── 📁 hooks/                 # Custom React hooks
├── 📁 utils/                 # Utility functions
├── 📁 styles/                # CSS & styling
├── 📁 i18n/                  # Internationalization
├── 📁 prisma/                # Database schema
└── 📁 docs/                  # Documentation
```

### Import Path Patterns
```typescript
// Use @ alias for all imports
import { AuthForm } from '@/components/features/auth/AuthForm';
import { api } from '@/lib/fetch';
import { User } from '@/types/auth';
import { authConfig } from '@/constants/auth/client';

// Organize imports by category
import { useState, useEffect } from 'react';         // React imports
import { NextRequest, NextResponse } from 'next/server'; // Next.js imports
import { prisma } from '@/lib/db';                   // Database imports
import { AuthForm } from '@/components/features/auth'; // Component imports
import type { User, AuthState } from '@/types/auth'; // Type imports
```

## Coding Standards

### TypeScript Guidelines

#### Interface Definitions
```typescript
// Use descriptive interface names
interface BlogPostProps {
  post: Post;
  onLike?: (postId: string) => void;
  className?: string;
}

// Extend base interfaces for variants
interface AdminBlogPostProps extends BlogPostProps {
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}

// Use generic types for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}
```

#### Type Exports and Imports
```typescript
// Export types explicitly
export type { User, UserRole } from './user';
export type { Post, Category, Tag } from './blog';

// Import types explicitly
import type { AuthUser } from '@/types/auth';
import type { ComponentProps } from 'react';
```

### React Component Patterns

#### Component Structure Template
```tsx
'use client'; // Only for client components

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ComponentProps } from '@/types/component';
import { useCustomHook } from '@/hooks/useCustomHook';

export const Component = memo(function Component({
  prop1,
  prop2,
  className = '',
  ...props
}: ComponentProps) {
  // 1. State declarations
  const [state, setState] = useState(initialState);
  
  // 2. Custom hooks
  const { data, loading, error } = useCustomHook();
  
  // 3. Event handlers (memoized)
  const handleClick = useCallback(() => {
    // Handler implementation
  }, [dependency]);
  
  // 4. Computed values (memoized if expensive)
  const computedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  // 5. Effects
  useEffect(() => {
    // Effect implementation
  }, [dependency]);
  
  // 6. Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 7. Render
  return (
    <motion.div
      className={`base-classes ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      {...props}
    >
      {/* Component content */}
    </motion.div>
  );
});

Component.displayName = 'Component';
```

#### Custom Hooks Pattern
```tsx
// Extract complex logic into custom hooks
export const useAuthForm = (initialValues: AuthFormData) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);
  
  const handleSubmit = useCallback(async (onSubmit: SubmitHandler) => {
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      return result;
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  }, [formData]);
  
  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
    reset: () => setFormData(initialValues)
  };
};
```

### API Development Patterns

#### Route Handler Structure
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createResponse } from '@/lib/server/response';
import { limitAPI } from '@/lib/server/limit';
import { validateAuth } from '@/lib/server/auth';

// Request validation schema
const requestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimit = await limitAPI(request, '/api/example', 100);
    if (!rateLimit.access) {
      return createResponse({ 
        success: false, 
        message: 'Rate limit exceeded',
        status: 429 
      });
    }
    
    // 2. Authentication (if required)
    const auth = await validateAuth(request);
    if (!auth.success) {
      return createResponse({
        success: false,
        message: 'Unauthorized',
        status: 401
      });
    }
    
    // 3. Request validation
    const body = await request.json();
    const validatedData = requestSchema.parse(body);
    
    // 4. Business logic
    const result = await performOperation(validatedData, auth.user);
    
    // 5. Response
    return createResponse({
      success: true,
      message: 'Operation successful',
      data: result
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return createResponse({
        success: false,
        message: 'Validation error',
        data: error.errors,
        status: 400
      });
    }
    
    return createResponse({
      success: false,
      message: 'Internal server error',
      status: 500
    });
  }
}
```

#### Database Operations Pattern
```typescript
// lib/db/example.ts
import { prisma } from './prisma';
import type { CreateExampleData, UpdateExampleData } from '@/types/example';

// Create operation
export const createExample = async (data: CreateExampleData) => {
  return prisma.example.create({
    data,
    select: {
      id: true,
      name: true,
      createdAt: true,
      // Only select needed fields
    }
  });
};

// Read operation with pagination
export const getExamples = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { page = 1, limit = 10, search } = params;
  const skip = (page - 1) * limit;
  
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {};
  
  const [examples, totalCount] = await Promise.all([
    prisma.example.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    }),
    prisma.example.count({ where })
  ]);
  
  return {
    examples,
    totalCount,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    }
  };
};
```

## Database Development

### Prisma Best Practices

#### Schema Design
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid()) @map("uid")
  email       String   @unique
  name        String?
  status      String   @default("active")
  createdTime DateTime @default(now()) @map("created_time")
  updateTime  DateTime @updatedAt @map("update_time")
  
  // Relations
  auth        Auth?
  posts       Post[]
  sessions    Session[]
  
  @@map("users")
  @@index([email])
  @@index([status, createdTime])
}
```

#### Migration Workflow
```bash
# 1. Modify schema in prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name add_user_status

# 3. Apply to production (deployment)
npx prisma migrate deploy

# 4. Generate updated client
npx prisma generate
```

#### Database Queries
```typescript
// Efficient querying patterns
export const getUserWithPosts = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        where: { status: 'published' },
        orderBy: { createdTime: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          publishedAt: true
        }
      },
      _count: {
        select: {
          posts: { where: { status: 'published' } }
        }
      }
    }
  });
};
```

## State Management

### Redux Toolkit Patterns

#### Slice Structure
```typescript
// stores/slice/example.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/fetch';

interface ExampleState {
  items: Example[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
}

const initialState: ExampleState = {
  items: [],
  loading: false,
  error: null,
  pagination: null
};

// Async thunk
export const fetchExamples = createAsyncThunk(
  'example/fetchExamples',
  async (params: FetchParams, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/examples', { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Fetch failed');
    }
  }
);

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addItem: (state, action: PayloadAction<Example>) => {
      state.items.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamples.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, addItem } = exampleSlice.actions;
export default exampleSlice.reducer;
```

### Selectors
```typescript
// stores/selectors/example.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/stores';

const selectExampleState = (state: RootState) => state.example;

export const selectExamples = createSelector(
  selectExampleState,
  (state) => state.items
);

export const selectExampleLoading = createSelector(
  selectExampleState,
  (state) => state.loading
);

export const selectPublishedExamples = createSelector(
  selectExamples,
  (examples) => examples.filter(example => example.status === 'published')
);
```

## Styling and UI Development

### Tailwind CSS v4 Usage
```css
/* styles/globals.css */
@import "tailwindcss";

/* Custom theme variables */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --accent-color: #f59e0b;
  
  /* Component-specific variables */
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

@theme {
  --color-primary: var(--primary-color);
  --color-secondary: var(--secondary-color);
  --color-accent: var(--accent-color);
}

/* Custom utility classes */
@utility animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Component Styling Patterns
```tsx
// Responsive design with utility classes
const BlogCard = ({ post, variant = 'default' }: BlogCardProps) => {
  const baseClasses = [
    'bg-card',
    'border border-border',
    'rounded-lg',
    'overflow-hidden',
    'transition-all duration-300'
  ];
  
  const variantClasses = {
    default: ['shadow-md hover:shadow-lg'],
    featured: ['shadow-lg hover:shadow-xl', 'ring-1 ring-primary'],
    compact: ['shadow-sm']
  };
  
  const responsiveClasses = [
    'w-full',
    'sm:max-w-sm',
    'md:max-w-md',
    'lg:max-w-lg'
  ];
  
  const className = [
    ...baseClasses,
    ...variantClasses[variant],
    ...responsiveClasses
  ].join(' ');
  
  return (
    <article className={className}>
      {/* Card content */}
    </article>
  );
};
```

## Performance Optimization

### Code Splitting
```tsx
// Dynamic imports for code splitting
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('@/components/admin/Dashboard'));
const BlogEditor = lazy(() => import('@/components/blog/Editor'));

// Usage with suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Component Optimization
```tsx
// Memoization patterns
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({
  data,
  onUpdate
}: ComponentProps) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processLargeDataSet(data);
  }, [data]);
  
  // Memoize event handlers
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);
  
  return (
    <div>
      {processedData.map(item => (
        <Item
          key={item.id}
          data={item}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
});
```

### Bundle Analysis
```bash
# Analyze bundle size
ANALYZE=true pnpm build

# Check specific imports
npx @next/bundle-analyzer .next

# Monitor performance
pnpm build && pnpm start
# Use Chrome DevTools Performance tab
```

## Testing Strategies

### Unit Testing Setup
```bash
# Install testing dependencies
pnpm add -D @testing-library/react @testing-library/jest-dom vitest jsdom

# Create test configuration
# vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});
```

### Component Testing
```tsx
// __tests__/components/AuthForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '@/components/features/auth/AuthForm';
import { Provider } from 'react-redux';
import { store } from '@/stores';

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <IntlProvider locale="en" messages={{}}>
      {children}
    </IntlProvider>
  </Provider>
);

describe('AuthForm', () => {
  const mockSubmit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders login form with required fields', () => {
    render(
      <AuthForm
        title="login"
        fields={['email', 'password']}
        onSubmit={mockSubmit}
      />,
      { wrapper: TestWrapper }
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('validates required fields', async () => {
    render(
      <AuthForm
        title="login"
        fields={['email', 'password']}
        onSubmit={mockSubmit}
      />,
      { wrapper: TestWrapper }
    );
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

### API Testing
```typescript
// __tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/auth/login/route';

describe('/api/auth/login', () => {
  it('returns 401 for invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrong-password'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'Invalid credentials'
    });
  });
});
```

## Deployment and DevOps

### Environment Configuration
```bash
# .env.local (development)
DATABASE_URL="postgresql://localhost:5432/elice_dev"
JWT_SECRET="development-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"

# .env.production (production)
DATABASE_URL="postgresql://production-url"
JWT_SECRET="production-secret-key" 
NEXT_PUBLIC_API_URL="https://your-domain.com"
REDIS_URL="redis://production-redis"
```

### Build Process
```bash
# Development build
pnpm dev

# Production build
pnpm build
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint

# Database operations
npx prisma migrate deploy
npx prisma generate
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && \
    pnpm prisma generate && \
    pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

#### 2. Type Errors
```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Regenerate types
npx prisma generate
pnpm type-check
```

#### 3. Build Errors
```bash
# Clear build cache
rm -rf .next
pnpm build

# Check for circular dependencies
npx madge --circular --extensions ts,tsx src/
```

#### 4. Performance Issues
```bash
# Analyze bundle
ANALYZE=true pnpm build

# Profile application
pnpm dev
# Open DevTools → Performance tab
```

### Debug Configuration
```typescript
// lib/utils/debug.ts
export const DEBUG = {
  API: process.env.NODE_ENV === 'development',
  AUTH: process.env.DEBUG_AUTH === 'true',
  DATABASE: process.env.DEBUG_DB === 'true'
};

export const debugLog = (category: keyof typeof DEBUG, message: string, data?: any) => {
  if (DEBUG[category]) {
    console.log(`[${category}] ${message}`, data);
  }
};
```

## Contributing Guidelines

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed and memoized
- [ ] API endpoints have proper error handling
- [ ] Database queries are optimized
- [ ] Security considerations addressed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Performance impact considered

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"

# Code review process
git push origin feature/new-feature
# Create PR through GitHub

# After approval
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main
```

This developer guide provides comprehensive coverage of the development process, patterns, and best practices for the elice-next project. Regular updates to this guide ensure it stays current with project evolution and new best practices.