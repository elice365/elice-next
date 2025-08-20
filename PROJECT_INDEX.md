# Elice Next - Project Documentation Index

## 📋 Project Overview

**Elice Next** is a modern Next.js 15 application featuring a comprehensive blog system, enterprise-grade authentication, and multilingual support. Built with TypeScript, Tailwind CSS v4, and Redux Toolkit for state management.

### 🚀 Quick Start
- **Development**: `pnpm dev` (with Turbopack)
- **Build**: `pnpm build`
- **Type Check**: `npx tsc --noEmit`
- **Database**: `npx prisma studio`

---

## 🏗️ Architecture

### Framework & Core Technologies
- **Next.js 15.4.6** - App Router with route groups
- **React 19.1.0** - Latest React features
- **TypeScript 5.9.2** - Type safety throughout
- **Tailwind CSS v4** - Modern CSS-first styling
- **Prisma 6.13.0** - Database ORM with PostgreSQL
- **Redux Toolkit** - State management

### Authentication & Security
- **JWT tokens** - 15-minute access, 7-day refresh rotation
- **Social login** - Kakao, Google, Naver, Apple
- **Argon2** - Password hashing with salt
- **Device fingerprinting** - Enhanced session security
- **Rate limiting** - 100 requests/minute default
- **Security headers** - XSS, CSRF, Content-Type protection

---

## 📁 Project Structure

### Application Routes (`app/`)

#### Public Routes (`(main)/`)
```
(main)/
├── page.tsx                 # Home page
├── layout.tsx              # Main layout wrapper
├── blog/
│   ├── page.tsx            # Blog listing
│   └── [uid]/
│       ├── page.tsx        # Individual blog post
│       └── not-found.tsx   # 404 for missing posts
├── auth/
│   ├── [type]/page.tsx     # Dynamic auth pages (login/register)
│   └── setting/page.tsx    # User settings
├── login/page.tsx          # Login page
├── register/page.tsx       # Registration page
├── product/page.tsx        # Product showcase
├── payment/page.tsx        # Payment integration
└── notice/page.tsx         # Notices/announcements
```

#### Admin Routes (`(admin)/`)
```
(admin)/
├── layout.tsx              # Admin layout with auth protection
└── admin/
    ├── page.tsx            # Admin dashboard
    ├── blog/
    │   ├── page.tsx        # Blog management
    │   └── content/[uid]/  # Blog content editor
    ├── user/page.tsx       # User management
    ├── role/page.tsx       # Role management
    ├── session/page.tsx    # Session monitoring
    ├── router/page.tsx     # Route management
    ├── category/page.tsx   # Category management
    └── notification/page.tsx # Notification management
```

#### API Routes (`api/`)
```
api/
├── auth/[type]/route.ts    # Dynamic auth endpoints
├── post/
│   ├── route.ts           # Blog posts CRUD
│   ├── like/route.ts      # Post likes
│   └── categories/route.ts # Category filtering
├── search/route.ts        # Search functionality
├── notice/route.ts        # Notice system
├── notification/route.ts  # User notifications
└── admin/                 # Admin-only APIs
    ├── blog/             # Blog management
    ├── users/            # User management
    ├── roles/            # Role-based access
    ├── session/          # Session management
    ├── category/         # Category CRUD
    └── notification/     # Admin notifications
```

### Components Architecture

#### Feature Components (`components/features/`)
```
features/
├── auth/                   # Authentication components
│   ├── AuthForm.tsx       # Main auth form
│   ├── AuthFormFields.tsx # Form inputs
│   ├── AuthFormActions.tsx # Form actions
│   └── SocialButtons.tsx  # Social login buttons
├── blog/                   # Blog system components
│   ├── Card.tsx           # Blog post cards
│   ├── List.tsx           # Blog listing
│   ├── Display.tsx        # Blog post display
│   ├── Post.tsx           # Individual post
│   ├── Gallery.tsx        # Image gallery
│   ├── Content.tsx        # Content rendering
│   ├── Header.tsx         # Post header
│   ├── Actions.tsx        # Post actions
│   ├── Related.tsx        # Related posts
│   ├── Filters.tsx        # Post filters
│   ├── Comment.tsx        # Comments system
│   └── card/              # Card sub-components
├── search/                 # Search functionality
│   ├── Input.tsx          # Search input
│   ├── Result.tsx         # Search results
│   └── Feed.tsx           # Search feed
├── admin/                  # Admin-specific components
├── profile/                # User profile components
├── locale/                 # Internationalization
├── theme/                  # Theme switching
├── notification/           # Notification system
└── navigation/             # Navigation components
```

#### UI Components (`components/ui/`)
```
ui/
├── Button.tsx             # Reusable buttons
├── Input.tsx              # Form inputs
├── Icon.tsx               # Icon system
├── Avatar.tsx             # User avatars
├── Badge.tsx              # Status badges
├── Table.tsx              # Data tables
├── Dropdown.tsx           # Dropdown menus
├── Pagination.tsx         # Pagination controls
├── DataTable.tsx          # Advanced data tables
├── ShareButton.tsx        # Social sharing
├── ReadingProgress.tsx    # Reading progress bar
├── LoadingSpinner.tsx     # Loading states
├── ErrorMessage.tsx       # Error display
├── FloatingActionButton.tsx # FAB component
├── modal/                 # Modal system
│   ├── common/           # Shared modals
│   ├── blog/             # Blog modals
│   ├── user/             # User modals
│   ├── role/             # Role modals
│   ├── admin/            # Admin modals
│   └── category/         # Category modals
├── form/                  # Form components
└── card/                  # Card components
```

#### Layout Components (`components/layout/`)
```
layout/
├── Header.tsx             # Site header
├── Footer.tsx             # Site footer
├── Navigator.tsx          # Navigation menu
├── Panel.tsx              # Side panel
├── Blog.tsx               # Blog layout
└── Admin.tsx              # Admin layout
```

#### Providers (`components/provider/`)
```
provider/
├── index.tsx              # Provider composition
├── Redux.tsx              # Redux store provider
├── Auth.tsx               # Authentication provider
└── Admin.tsx              # Admin context provider
```

### State Management (`stores/`)
```
stores/
├── index.ts               # Store configuration
├── hook.ts                # Typed hooks
├── asyncThunk.ts          # Async actions
└── slice/
    ├── auth.ts           # Authentication state
    ├── blog.ts           # Blog filters & views
    ├── modal.ts          # Modal state
    ├── panel.ts          # UI panel state
    ├── device.ts         # Responsive state
    └── search.ts         # Search state
```

### Custom Hooks (`hooks/`)
```
hooks/
├── admin/                 # Admin functionality hooks
│   ├── useAdminModals.ts # Modal management
│   ├── useAdminPage.ts   # Page state
│   ├── useAdminTable.ts  # Table operations
│   └── useRoles.ts       # Role management
├── auth/                  # Authentication hooks
│   ├── useAuth.ts        # Auth state
│   ├── useAuthFormState.ts # Form state
│   ├── useAuthFormValidation.ts # Validation
│   ├── useAuthFormSubmission.ts # Form submission
│   ├── useTokenRefresh.ts # Token management
│   ├── useSocialAuth.ts  # Social login
│   └── useAuthError.ts   # Error handling
├── blog/                  # Blog functionality
│   ├── usePost.ts        # Post operations
│   ├── useBlogActions.ts # Blog actions
│   ├── useImageSlider.ts # Image carousel
│   └── useListItem.ts    # List item state
├── modal/                 # Modal management
│   ├── useModal.ts       # Modal state
│   ├── useModalState.ts  # State management
│   ├── useModalStates.ts # Multi-modal
│   └── useModalForm.ts   # Form modals
├── search/                # Search functionality
│   ├── useSearch.ts      # Search operations
│   └── useSearchAPI.ts   # API calls
├── ui/                    # UI interaction hooks
│   ├── useDropdown.ts    # Dropdown state
│   ├── usePanel.ts       # Panel state
│   └── useAnimatedWidth.ts # Animations
├── utils/                 # Utility hooks
│   ├── useMount.ts       # Mount detection
│   ├── useFingerprint.ts # Device fingerprinting
│   └── useClickOutside.ts # Outside click detection
├── tracking/              # Analytics hooks
│   └── useAnalytics.ts   # Event tracking
├── performance/           # Performance monitoring
│   └── usePerformanceMonitor.ts
└── api/                   # API interaction
    └── useApiCall.ts     # Generic API calls
```

### Database Layer (`lib/db/`)
```
lib/db/
├── index.ts               # Database exports
├── prisma.ts             # Prisma client
├── connection-manager.ts  # Connection management
├── user.ts               # User operations
├── session.ts            # Session management
├── roles.ts              # Role-based access
├── blog.ts               # Blog system
├── category.ts           # Category management
├── notification.ts       # Notifications
├── notice.ts             # Notice system
├── search.ts             # Search operations
├── translations.ts       # Multilingual content
├── views.ts              # View tracking
├── history.ts            # User history
├── router.ts             # Route management
└── middleware.ts         # Database middleware
```

### Services & Utilities (`lib/`)

#### Services (`lib/services/`)
```
services/
├── logger.ts             # Centralized logging
├── notifications.ts      # Notification service
├── search.ts            # Search service
├── cloudflare/
│   └── r2.ts           # R2 storage integration
├── session/
│   └── cleanup.ts      # Session cleanup
├── social/
│   ├── login.ts        # Social authentication
│   └── map.ts          # Provider mapping
└── token/
    ├── client.ts       # Client-side tokens
    ├── server.ts       # Server-side tokens
    ├── manager.ts      # Token management
    └── types.ts        # Token types
```

#### Request Handlers (`lib/request/`)
```
request/
├── index.ts              # Request utilities
├── auth.ts              # Auth requests
├── login.ts             # Login handling
├── register.ts          # Registration
├── logout.ts            # Logout handling
├── refresh.ts           # Token refresh
├── verify.ts            # Verification
├── resend.ts            # Email resending
├── social.ts            # Social login
└── me.ts                # User profile
```

#### Server Utilities (`lib/server/`)
```
server/
├── auth.ts              # Server auth utilities
├── info.ts              # Server info
├── limit.ts             # Rate limiting
├── roles.ts             # Role validation
└── response.ts          # Response formatting
```

### Type System (`types/`)

TypeScript interfaces are centralized by domain:

#### UI Types (`types/ui/`)
- `modal.ts` - Modal component interfaces
- `table.ts` - Table component interfaces  
- `card.ts` - Card component interfaces
- `form.ts` - Form component interfaces
- `button.ts`, `input.ts`, `icon.ts` - Basic UI components

#### Hook Types (`types/hooks/`)
- `admin.ts` - Admin hook interfaces
- `auth.ts` - Authentication hooks
- `modal.ts` - Modal management hooks
- `ui.ts` - UI interaction hooks
- `search.ts` - Search functionality
- `performance.ts` - Performance monitoring

#### Library Types (`types/lib/`)
- `token.ts` - Token management
- `logger.ts` - Logging service
- `server.ts` - Server utilities
- `social.ts` - Social authentication
- `response.ts` - API responses
- `db.ts` - Database operations

#### Domain Types
- `types/auth/` - Authentication & sessions
- `types/blog/` - Blog system
- `types/admin/` - Admin functionality
- `types/api/` - API routes & responses
- `types/layout/` - Layout components
- `types/common/` - Shared interfaces

### Utilities (`utils/`)
```
utils/
├── admin/
│   ├── badges.ts         # Status badges
│   └── blog/            # Blog admin utilities
├── blog/
│   └── contentParser.ts # Content parsing
├── auth/               # Auth utilities (regex patterns)
├── cookie/             # Cookie management
├── email/              # Email services
├── error/              # Error handling
├── logger/             # Logging utilities
├── parse/              # Data parsing
├── performance/        # Performance optimization
├── regex/              # Regular expressions
├── type/               # Type utilities
└── date/               # Date formatting
```

### Constants (`constants/`)
```
constants/
├── auth/
│   ├── client.ts        # Client auth config
│   └── server.ts        # Server auth config
├── blog.ts             # Blog constants
├── search.ts           # Search configuration
├── registerEmail.ts    # Email templates
└── modal/
    └── iconCategories.ts # Icon categories
```

### Internationalization (`i18n/`)
```
i18n/
├── routing.ts          # Route internationalization
├── request.ts          # Server-side i18n
└── translations/
    ├── en.json        # English
    ├── ko.json        # Korean (default)
    ├── ja.json        # Japanese
    └── ru.json        # Russian
```

### Styling (`styles/`)
```
styles/
├── globals.css         # Global styles & Tailwind
├── admin/             # Admin-specific styles
└── blog/              # Blog-specific styles
```

---

## 🔧 Development Workflow

### Type Safety Standards
- **Centralized Types**: All interfaces in `types/` directory
- **Import Pattern**: Use `import type` for type imports
- **No Inline Interfaces**: Avoid declaring interfaces in components
- **Type Organization**: Domain-specific type files

### Component Patterns
- **Feature-Based**: Domain components in `features/`
- **UI Primitives**: Reusable components in `ui/`
- **Layout Components**: Page layouts in `layout/`
- **Provider Pattern**: Context providers for state

### State Management
- **Redux Toolkit**: Complex global state
- **Custom Hooks**: Component-specific state
- **SWR/React Query**: Server state caching
- **Local State**: Simple component state with `useState`

### API Development
- **RESTful Patterns**: Consistent API design
- **Type-Safe Routes**: TypeScript for all endpoints
- **Error Handling**: Standardized error responses
- **Authentication**: JWT-based auth with role checking

### Database Operations
- **Prisma ORM**: Type-safe database operations
- **Centralized Operations**: Database logic in `lib/db/`
- **Migration Strategy**: Version-controlled schema changes
- **Connection Management**: Efficient connection pooling

---

## 🚀 Production Features

### Performance Optimizations
- **Turbopack**: Ultra-fast development builds
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Build optimization tools
- **Static Generation**: Optimized blog pages
- **Caching Strategy**: Redis with SWR

### Security Features
- **JWT Security**: Short-lived access tokens
- **Rate Limiting**: API protection
- **CSRF Protection**: Cross-site request forgery prevention
- **XSS Protection**: Content security policies
- **Password Security**: Argon2 hashing with salt

### Monitoring & Analytics
- **Vercel Analytics**: Performance monitoring
- **Error Tracking**: Centralized error logging
- **User Analytics**: PostHog integration
- **Performance Monitoring**: Core Web Vitals
- **Session Tracking**: User behavior analysis

### Deployment
- **Vercel Platform**: Optimized Next.js hosting
- **Environment Variables**: Secure configuration
- **Database Migrations**: Production deployment strategy
- **CDN Integration**: Global content delivery

---

## 📚 Quick Reference

### Key Files
- `CLAUDE.md` - Development guidelines
- `middleware.ts` - Route protection & security
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind configuration
- `prisma/schema.prisma` - Database schema

### Important Commands
```bash
# Development
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Production build
pnpm lint                   # Code linting

# Database
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema changes
npx prisma studio           # Database GUI
npx prisma migrate dev      # Create migration

# Type Checking
npx tsc --noEmit           # Type check without compilation
npx tsc --noEmit --watch   # Watch mode type checking
```

### Development Patterns
- Import with `@/` alias for all internal imports
- Use centralized types from `types/` directory
- Follow feature-based component organization
- Implement proper error boundaries and handling
- Use Redux for complex state, custom hooks for simple state
- Apply responsive design with mobile-first approach

---

##  Cross-References

### Related Documentation
- [CLAUDE.md](./CLAUDE.md) - Complete development guide
- [Next.js 15 Docs](https://nextjs.org/docs) - Framework documentation
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Styling guide
- [Prisma Docs](https://www.prisma.io/docs) - Database ORM
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management

### Key Integration Points
- Authentication flows connect `lib/auth/`, `stores/slice/auth.ts`, and `hooks/auth/`
- Blog system spans `components/features/blog/`, `lib/db/blog.ts`, and `api/post/`
- Admin functionality integrates `hooks/admin/`, `components/ui/modal/`, and `api/admin/`
- Type system connects all domains through centralized `types/` directory

This documentation provides a comprehensive overview of the Elice Next project structure, patterns, and development workflow. For detailed implementation guidance, refer to the [CLAUDE.md](./CLAUDE.md) file.