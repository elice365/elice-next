# Elice Next.js Project File Structure

## Project Overview
Next.js 15.4.3 full-stack application with TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, Redis, and JWT authentication.

## Root Structure
```
elice-next/
├── .claude/                     # Claude Code configuration
├── .env.local                   # Environment variables
├── .gitignore                   # Git ignore rules
├── .vscode/                     # VS Code settings
├── CLAUDE.md                    # Claude Code project instructions
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── pnpm-lock.yaml              # Package lock file
├── pnpm-workspace.yaml         # PNPM workspace config
├── postcss.config.mjs          # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
├── middleware.ts               # Next.js middleware
├── tailwind_v4.md              # Tailwind v4 documentation
└── prisma/
    └── schema.prisma           # Database schema
```

## Application Structure (app/)
```
app/
├── (admin)/                    # Admin route group
│   ├── admin/
│   │   ├── blog/              # Blog management
│   │   │   ├── content/[uid]/ # Blog content editor
│   │   │   └── page.tsx       # Blog list
│   │   ├── category/          # Category management
│   │   ├── notification/      # Notification management
│   │   ├── role/             # Role management
│   │   ├── router/           # Router management
│   │   ├── session/          # Session management
│   │   ├── user/             # User management
│   │   └── page.tsx          # Admin dashboard
│   └── layout.tsx            # Admin layout
├── (main)/                   # Public route group
│   ├── auth/[type]/          # Authentication pages
│   ├── blog/
│   │   ├── [uid]/            # Blog post detail
│   │   │   ├── page.tsx      # Blog post page
│   │   │   └── not-found.tsx # 404 page
│   │   └── page.tsx          # Blog list page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── product/              # Product page
│   ├── page.tsx              # Home page
│   └── layout.tsx            # Main layout
├── api/                      # API routes
│   ├── admin/               # Admin API endpoints
│   │   ├── blog/            # Blog CRUD operations
│   │   ├── category/        # Category management
│   │   ├── notification/    # Notification management
│   │   ├── roles/           # Role management
│   │   ├── router/          # Router management
│   │   ├── session/         # Session management
│   │   └── users/           # User management
│   ├── auth/[type]/         # Authentication endpoints
│   ├── notification/        # Public notifications
│   ├── post/               # Public blog posts
│   ├── router/[type]/      # Navigation router
│   └── search/             # Search functionality
├── favicon.ico              # Site favicon
└── layout.tsx              # Root layout
```

## Components Architecture (components/)
```
components/
├── features/               # Feature-specific components
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── blog/              # Blog-related components
│   │   ├── Actions.tsx    # Blog action buttons
│   │   ├── Card.tsx       # Blog card component
│   │   ├── Content.tsx    # Blog content renderer
│   │   ├── Display.tsx    # Blog display controller
│   │   ├── Gallery.tsx    # Image gallery
│   │   ├── Header.tsx     # Blog header
│   │   ├── List.tsx       # Blog list view
│   │   ├── Post.tsx       # Post component
│   │   └── index.ts       # Exports
│   ├── locale/            # Localization components
│   ├── notification/      # Notification components
│   ├── profile/           # Profile components
│   ├── search/            # Search components
│   └── theme/             # Theme components
├── i18n/                  # Internationalization
├── layout/                # Layout components
│   ├── Admin.tsx          # Admin layout
│   ├── Blog.tsx           # Blog layout
│   ├── Footer.tsx         # Footer component
│   ├── Header.tsx         # Header component
│   ├── Navigator.tsx      # Navigation component
│   └── Panel.tsx          # Side panel
├── pages/                 # Page-specific components
├── provider/              # Context providers
│   ├── Admin.tsx          # Admin provider
│   ├── Auth.tsx           # Authentication provider
│   ├── Redux.tsx          # Redux provider
│   └── index.tsx          # Main app provider
└── ui/                    # Reusable UI components
    ├── Avatar.tsx         # User avatar
    ├── Badge.tsx          # Badge component
    ├── Button.tsx         # Button component
    ├── Icon.tsx           # Icon component
    ├── Input.tsx          # Input component
    ├── modal/             # Modal components
    │   ├── blog/          # Blog modals
    │   ├── category/      # Category modals
    │   ├── common/        # Common modals
    │   ├── notification/  # Notification modals
    │   ├── role/          # Role modals
    │   ├── router/        # Router modals
    │   └── user/          # User modals
    └── skeleton/          # Loading skeletons
```

## Hooks Architecture (hooks/)
```
hooks/
├── admin/                 # Admin-specific hooks
├── auth/                  # Authentication hooks
│   ├── useAuth.ts        # Main auth hook
│   ├── useTokenRefresh.ts # Token refresh
│   └── useSocialAuth.ts  # Social authentication
├── blog/                  # Blog-related hooks
├── modal/                 # Modal management hooks
├── search/                # Search functionality hooks
├── tracking/              # Analytics hooks
├── ui/                    # UI-specific hooks
└── utils/                 # Utility hooks
```

## Library Architecture (lib/)
```
lib/
├── auth/                  # Authentication utilities
├── cookie/                # Cookie management
├── db/                    # Database layer
│   ├── blog.ts           # Blog operations
│   ├── user.ts           # User operations
│   ├── session.ts        # Session management
│   ├── prisma.ts         # Prisma client
│   └── views.ts          # View tracking
├── fetch/                 # API client
├── request/               # Request utilities
├── response/              # Response utilities
├── server/                # Server utilities
│   ├── auth.ts           # Server-side auth
│   ├── info.ts           # Request info
│   └── limit.ts          # Rate limiting
└── services/              # External services
    ├── cloudflare/       # Cloudflare R2
    ├── social/           # Social login
    └── token/            # Token management
```

## State Management (stores/)
```
stores/
├── index.ts              # Store configuration
├── hook.ts               # Typed hooks
├── asyncThunk.ts         # Async actions
└── slice/                # Redux slices
    ├── auth.ts           # Authentication state
    ├── blog.ts           # Blog state
    ├── device.ts         # Device detection
    ├── modal.ts          # Modal state
    ├── panel.ts          # Panel state
    └── search.ts         # Search state
```

## Types System (types/)
```
types/
├── admin.ts              # Admin types
├── api.ts                # API types
├── auth.ts               # Authentication types
├── blog.ts               # Blog types
├── post.ts               # Post types
├── user.ts               # User types
├── session.ts            # Session types
├── global.d.ts           # Global type declarations
└── [component].ts        # Component-specific types
```

## Utilities (utils/)
```
utils/
├── admin/                # Admin utilities
├── blog/                 # Blog utilities
├── cookie/               # Cookie utilities
├── email/                # Email utilities
├── parse/                # Parsing utilities
├── regex/                # Regex patterns
└── type/                 # Type utilities
```

## Internationalization (i18n/)
```
i18n/
├── request.ts            # i18n request handling
├── route.ts              # Route localization
└── translations/         # Translation files
    ├── ko.json           # Korean (default)
    ├── en.json           # English
    ├── ja.json           # Japanese
    └── ru.json           # Russian
```

## Styling (styles/)
```
styles/
├── globals.css           # Global styles (Tailwind v4)
└── pretendard.css        # Font styles
```

## Assets
```
assets/
└── fonts/
    └── Pretendard/       # Korean web font
```

## Documentation (docs/)
```
docs/
├── API_IMPLEMENTATION_GUIDE.md
├── API_REFERENCE.md
├── COMPONENT_GUIDE.md
├── COMPONENT_PATTERNS.md
├── DEPLOYMENT.md
├── DEVELOPER_ONBOARDING.md
├── PROJECT_INDEX.md
└── architecture/
    ├── ADR-003-authentication-architecture.md
    ├── next-js-app-router.md
    └── tailwind-css-v4.md
```

## Key Features

### Architecture Patterns
- **Route Groups**: Organized by user type (admin/main)
- **Feature-based Components**: Grouped by domain functionality
- **Centralized State**: Redux Toolkit with typed hooks
- **Type Safety**: Comprehensive TypeScript coverage
- **Database Layer**: Prisma with PostgreSQL
- **Authentication**: JWT with refresh token rotation
- **Internationalization**: next-intl with 4 languages
- **Styling**: Tailwind CSS v4 with custom theme system

### Technology Stack
- **Framework**: Next.js 15.4.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (Upstash)
- **State**: Redux Toolkit
- **Authentication**: JWT + Social (Kakao, Google, Naver, Apple)
- **Deployment**: Vercel with Analytics & Speed Insights
- **Storage**: Cloudflare R2
- **Package Manager**: PNPM

### File Naming Conventions
- **Components**: PascalCase (`BlogCard.tsx`)
- **Pages**: lowercase (`page.tsx`, `not-found.tsx`)
- **API Routes**: `route.ts` in folders
- **Utilities**: camelCase (`contentParser.ts`)
- **Types**: camelCase (`.ts` extension)
- **Constants**: camelCase in domain folders

Total: 265 directories, 559 files