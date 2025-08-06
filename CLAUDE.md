# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
# Development server with Turbopack (ultra-fast builds)
pnpm dev

# Production build
pnpm build

# Production server
pnpm start

# Linting
pnpm lint
```

### Database Commands
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and apply migrations (production)
npx prisma migrate dev --name description_of_change
npx prisma migrate deploy

# Database GUI
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset
```

### TypeScript Commands
```bash
# Type checking (no script in package.json, run manually)
npx tsc --noEmit

# Watch mode type checking
npx tsc --noEmit --watch
```

## Architecture Overview

### Next.js 15.4.3 App Router Structure
The project uses Next.js 15 App Router with **route groups** for organization:
- `(admin)/` - Admin interface routes (protected)
- `(main)/` - Public routes (blog, auth, product)
- `api/` - API routes following RESTful patterns

### Authentication System
JWT-based authentication with refresh token rotation:
- **Access tokens**: 15 minutes (stored in memory)
- **Refresh tokens**: 7 days (HTTP-only cookies)
- **Social login**: Kakao, Google, Naver, Apple
- **Security**: Argon2 password hashing, device fingerprinting
- **Session management**: Database-stored sessions with cleanup

Key files:
- `middleware.ts` - Route protection and rate limiting
- `lib/auth/` - Authentication utilities
- `constants/auth/client.ts` - Auth configuration
- `stores/slice/auth.ts` - Auth state management

### Database Layer (Prisma + PostgreSQL)
Centralized database operations through `lib/db/`:
- **User management**: `lib/db/user.ts`
- **Session handling**: `lib/db/session.ts`
- **Role-based access**: `lib/db/roles.ts`
- **Notifications**: `lib/db/notification.ts`
- **Blog system**: `lib/db/blog.ts`, `lib/db/category.ts`

Import pattern: `import { User, Session, prisma } from '@/lib/db';`

### State Management (Redux Toolkit)
Global state slices in `stores/slice/`:
- `auth.ts` - User authentication state
- `blog.ts` - Blog post filters and view modes
- `modal.ts` - Modal state management
- `panel.ts` - UI panel states
- `device.ts` - Device and responsive states
- `search.ts` - Search functionality state

### Internationalization (next-intl)
- **Languages**: Korean (default), English, Japanese, Russian
- **Translations**: `i18n/translations/{locale}.json`
- **Country-based detection**: Middleware uses Cloudflare headers
- **Cookie storage**: `locale` cookie for persistence

### Styling (Tailwind CSS v4)
CSS-first configuration with custom theme system:
- **Global styles**: `styles/globals.css`
- **Theme variables**: CSS custom properties for light/dark/deepblue themes
- **Custom utilities**: Animations, transitions, hover effects
- **Component classes**: Admin tables, blog items, cards

### Component Architecture
Feature-based organization:
- `components/features/` - Domain-specific components (auth, blog, admin)
- `components/ui/` - Reusable UI primitives
- `components/layout/` - Page layout components
- `components/provider/` - Context providers

## API Route Patterns

### Authentication Routes (`app/api/auth/`)
- `[type]/route.ts` - Dynamic auth endpoints (login, register, social)
- JWT token management with refresh rotation
- Rate limiting and security headers

### Admin Routes (`app/api/admin/`)
- Role-based access control
- Pagination with `page` and `limit` parameters
- Consistent response format: `{ success: boolean, data: any, error?: string }`

### Blog Routes (`app/api/post/`)
- Public blog endpoints with caching
- Like system with optimistic updates
- Category and tag filtering

## Security Considerations

### Middleware Security
- Rate limiting: 100 requests/minute default
- Security headers: XSS, Content-Type, Frame-Options
- CSRF protection with secure headers
- Route protection based on `authConfig.protected`

### Database Security
- Prisma prevents SQL injection
- Parameterized queries only
- Cascade deletes for data integrity
- Index optimization for performance

### Authentication Security
- Argon2 password hashing with salt
- Device fingerprinting for session security
- Refresh token rotation on each use
- Session cleanup for expired tokens

## File Naming Conventions

- **Components**: PascalCase (`BlogCard.tsx`)
- **Pages**: lowercase with hyphens (`blog/[uid]/page.tsx`)
- **API routes**: `route.ts` files in folders
- **Utilities**: camelCase (`contentParser.ts`)
- **Types**: camelCase with `.ts` extension
- **Constants**: camelCase in folders by domain

## Import Patterns

Use the `@/` alias for all imports:
```typescript
import { prisma } from '@/lib/db';
import { authConfig } from '@/constants/auth/client';
import { BlogCard } from '@/components/features/blog/Card';
```

## Key Development Patterns

### Error Handling
- API routes return `{ success: boolean, error?: string }`
- Client-side error boundaries for React components
- Centralized error logging in `lib/services/logger.ts`

### Data Fetching
- Server components for initial data loading
- SWR for client-side data fetching with caching
- Redux for complex state management
- React Query patterns for blog data

### Modal Management
- Centralized modal state in Redux (`stores/slice/modal.ts`)
- Modal components in `components/ui/modal/`
- Admin modals for CRUD operations

### Responsive Design
- Mobile-first Tailwind classes
- Device detection in Redux (`stores/slice/device.ts`)
- Responsive component variants

## Production Considerations

### Build Process
- Turbopack for development (ultra-fast)
- Static optimization for blog pages
- Image optimization with Next.js Image component
- Bundle analysis available

### Database Migrations
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Always backup before migrations
- Test migrations in staging environment

### Environment Variables
Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - JWT signing secret
- Social login credentials (KAKAO_*, GOOGLE_*, etc.)
- `NODE_ENV=production` for security headers

This codebase follows modern Next.js patterns with enterprise-grade authentication, internationalization, and a comprehensive blog system. The architecture emphasizes type safety, security, and developer experience.