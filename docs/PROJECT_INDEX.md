# Elice Next.js Project Documentation

## Overview

**elice-next** is a modern full-stack web application built with **Next.js 15.4.3** and **React 19.1.0**. It features a comprehensive blog system with advanced user management, authentication, social login integration, and a multi-language interface.

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: Next.js 15.4.3, React 19.1.0, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Prisma schema
- **Authentication**: JWT with refresh tokens, social login (Kakao, Google, Naver, Apple)
- **State Management**: Redux Toolkit
- **Internationalization**: next-intl (Korean, English, Japanese, Russian)
- **Cloud Services**: AWS S3, Cloudflare R2, Upstash Redis
- **Analytics**: Vercel Analytics, PostHog

### Core Features
- 🔐 **Authentication System**: Email/password + social login with 2FA support
- 📝 **Blog Management**: Full-featured blog with categories, tags, likes, views
- 👥 **User Management**: Role-based access control, session management
- 🌐 **Multi-language**: i18n with automatic country detection
- 🔔 **Notifications**: Real-time notifications system
- 📊 **Admin Dashboard**: Complete admin interface for content management
- 🔍 **Search**: Advanced search functionality
- 📱 **Responsive Design**: Mobile-first responsive UI

## 📁 Project Structure

```
elice-next/
├── app/                          # Next.js 13+ App Router
│   ├── (admin)/                  # Admin dashboard routes
│   │   └── admin/                # Admin pages (blog, user, role management)
│   ├── (main)/                   # Public routes
│   │   ├── auth/                 # Authentication pages
│   │   ├── blog/                 # Blog pages
│   │   └── product/              # Product pages
│   └── api/                      # API routes
│       ├── admin/                # Admin API endpoints
│       ├── auth/                 # Authentication API
│       ├── post/                 # Blog post API
│       └── notification/         # Notification API
├── components/                   # React components
│   ├── features/                 # Feature-specific components
│   │   ├── admin/                # Admin components
│   │   ├── auth/                 # Authentication components
│   │   ├── blog/                 # Blog components
│   │   └── notification/         # Notification components
│   ├── layout/                   # Layout components
│   ├── ui/                       # Reusable UI components
│   └── provider/                 # Context providers
├── lib/                          # Core utilities and services
│   ├── auth/                     # Authentication utilities
│   ├── db/                       # Database utilities
│   ├── services/                 # External service integrations
│   └── server/                   # Server-side utilities
├── stores/                       # Redux store configuration
├── types/                        # TypeScript type definitions
├── hooks/                        # Custom React hooks
├── i18n/                         # Internationalization
├── utils/                        # Utility functions
└── prisma/                       # Database schema and migrations
```

## 🔐 Authentication & Security

### Authentication Features
- **Multi-provider Authentication**: Email/password, social login (Kakao, Google, Naver, Apple)
- **JWT Token System**: Access + refresh token rotation
- **Session Management**: Device tracking, session cleanup
- **Two-Factor Authentication**: TOTP support
- **Email Verification**: Required for account activation
- **Password Security**: Argon2 hashing with salt

### Security Measures
- **Rate Limiting**: API rate limiting with Redis
- **Security Headers**: XSS protection, CSRF prevention, content security
- **Input Validation**: Server-side validation for all inputs
- **Role-based Access Control**: Granular permission system
- **Audit Logging**: Complete authentication history tracking

### Protected Routes
```typescript
// Route protection configuration
const authConfig = {
  protected: ['/admin', '/profile', '/dashboard'],
  public: ['/auth/login', '/auth/register', '/blog']
};
```

## 📝 Blog System

### Blog Features
- **Content Management**: Rich text editor with image upload
- **Category System**: Hierarchical category structure
- **Tagging System**: Flexible tag management
- **Social Features**: Likes, bookmarks, sharing
- **View Tracking**: Detailed analytics for post views
- **Status Management**: Draft, published, archived states
- **SEO Optimization**: Meta tags, structured data

### Content Parser
```typescript
// Blog content structure
interface BlogContent {
  title: string;
  description: string;
  author: AuthorInfo;
  products: ProductItem[];
  sections: ContentSection[];
}
```

## 🌐 Internationalization

### Supported Languages
- **Korean (ko)**: Default language
- **English (en)**: Full translation
- **Japanese (ja)**: Full translation
- **Russian (ru)**: Full translation

### i18n Implementation
- **Automatic Detection**: Country-based language detection via Cloudflare
- **Cookie Persistence**: Language preference storage
- **Route Localization**: Localized URL patterns
- **Component Translation**: `<Translated />` component for dynamic content

## 📊 Database Schema

### Core Models
```prisma
// User management
model User {
  id: String @id @default(cuid())
  email: String @unique
  auth: Auth?
  sessions: Session[]
  userRoles: UserRole[]
}

// Blog system
model Post {
  uid: String @id @default(uuid())
  type: String
  title: String
  description: String
  status: String @default("draft")
  category: Category?
  tags: Tag[]
  likes: Like[]
}

// Authentication
model Auth {
  passwordHash: String
  emailVerified: Boolean @default(false)
  twoFactor: Boolean @default(false)
}
```

## 🎨 UI/UX Components

### Component Library
- **Form Components**: FormField, Input, Button with validation
- **Layout Components**: Header, Footer, Navigation, Panel
- **Data Components**: Table, Pagination, Card layouts
- **Modal System**: Reusable modal components for CRUD operations
- **Responsive Design**: Mobile-first with tablet/desktop breakpoints

### Theme System
- **Dark/Light Mode**: Theme switching with persistence
- **Responsive Breakpoints**: Mobile/tablet/desktop optimization
- **Animation**: Framer Motion for smooth transitions

## 🔧 Development Setup

### Prerequisites
```bash
# Required versions
Node.js >= 18.0.0
PostgreSQL >= 13.0
Redis (for rate limiting)
```

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd elice-next
pnpm install

# Database setup
npx prisma generate
npx prisma db push

# Environment variables
cp .env.example .env.local
```

### Development Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 📈 Performance & Analytics

### Monitoring
- **Vercel Analytics**: Page views, performance metrics
- **PostHog**: User behavior tracking
- **Speed Insights**: Core Web Vitals monitoring

### Optimization
- **Image Optimization**: Next.js Image component with AVIF/WebP
- **Bundle Optimization**: Tree shaking, code splitting
- **Caching Strategy**: Static generation, API caching
- **Database Optimization**: Prisma query optimization, indexing

## 🚀 Deployment

### Production Configuration
- **Security Headers**: CSP, HSTS, XSS protection
- **Error Handling**: Graceful error boundaries
- **Logging**: Structured logging with service integration
- **Environment**: Production-ready configuration

### Cloud Services Integration
- **AWS S3**: Image storage and CDN
- **Cloudflare**: DNS, CDN, geographic detection
- **Upstash Redis**: Session storage, rate limiting
- **Vercel**: Hosting, analytics, performance monitoring

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/social` - Social login
- `POST /api/auth/verify` - Email verification

### Blog Endpoints
- `GET /api/post` - Get blog posts
- `POST /api/post` - Create blog post
- `GET /api/post/categories` - Get categories
- `POST /api/post/like` - Like/unlike post

### Admin Endpoints
- `GET /api/admin/users` - User management
- `POST /api/admin/blog` - Blog management
- `GET /api/admin/sessions` - Session management

## 🧪 Code Quality

### Type Safety
- **TypeScript**: Strict type checking throughout
- **Prisma Types**: Auto-generated database types
- **API Types**: Comprehensive API response types

### Code Organization
- **Feature-based Structure**: Components organized by functionality
- **Custom Hooks**: Reusable logic extraction
- **Utility Functions**: Pure functions for common operations
- **Consistent Naming**: Clear, descriptive naming conventions

## 🔍 Key Files Reference

### Configuration
- `next.config.ts` - Next.js configuration with security headers
- `middleware.ts` - Route protection and i18n setup
- `prisma/schema.prisma` - Database schema definition
- `package.json` - Dependencies and scripts

### Core Components
- `components/features/auth/AuthForm.tsx` - Authentication form
- `components/features/blog/` - Blog component suite
- `components/layout/Header.tsx` - Main navigation
- `components/ui/` - Reusable UI components

### API Layer
- `lib/db/` - Database utilities and queries
- `lib/auth/` - Authentication utilities
- `lib/services/` - External service integrations
- `stores/` - Redux state management

---

This documentation provides a comprehensive overview of the elice-next project architecture, features, and implementation details. For specific implementation details, refer to the individual component files and API documentation.