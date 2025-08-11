# 📚 Elice-Next Project Index

> **Version**: 0.1.0 | **Stack**: Next.js 15.4.3 + TypeScript 5.9.2 | **Last Updated**: August 2024

## 🎯 Quick Navigation

### 📖 Documentation Hub
- [📋 Documentation Index](./docs/README.md) - Complete documentation overview
- [🚀 Developer Guide](./docs/DEVELOPER_GUIDE.md) - Setup and development workflow
- [🔌 API Reference](./docs/API.md) - REST API documentation
- [🔐 Authentication Guide](./docs/AUTHENTICATION.md) - Security and auth system
- [📦 Component Library](./docs/COMPONENTS.md) - React component documentation
- [🗄️ Database Schema](./docs/DATABASE.md) - Prisma and PostgreSQL
- [🛡️ Middleware & Security](./docs/MIDDLEWARE.md) - Request processing
- [🔄 State Management](./docs/STATE_MANAGEMENT.md) - Redux Toolkit

### 🏗️ Project Structure

```
elice-next/
├── 📱 app/                    # Next.js App Router
│   ├── (admin)/              # Admin interface routes
│   ├── (main)/               # Public-facing routes
│   └── api/                  # API endpoints
├── 🧩 components/            # React components
│   ├── features/             # Feature-specific components
│   ├── ui/                   # Reusable UI components
│   └── layout/               # Layout components
├── 💾 lib/                   # Core libraries
│   ├── auth/                 # Authentication logic
│   ├── db/                   # Database operations
│   └── services/             # Business logic
├── 🎨 stores/                # Redux state management
├── 🗃️ prisma/                # Database schema
├── 🌍 i18n/                  # Internationalization
├── 🎨 styles/                # Global styles
└── 📝 docs/                  # Documentation

```

## 🚀 Quick Start Commands

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
npx prisma studio     # Open database GUI
npx prisma migrate dev # Create migration

# Type Checking
npx tsc --noEmit      # Check TypeScript types
```

## 📂 Core Modules Index

### 🔐 Authentication System
| Module | Path | Description |
|--------|------|-------------|
| JWT Manager | [`lib/auth/jwt.ts`](./lib/auth/jwt.ts) | Token generation and validation |
| Session Manager | [`lib/db/session.ts`](./lib/db/session.ts) | Session CRUD operations |
| Auth Middleware | [`middleware.ts`](./middleware.ts) | Route protection |
| Social Login | [`lib/services/social/`](./lib/services/social/) | OAuth integrations |

### 📊 Database Layer
| Module | Path | Description |
|--------|------|-------------|
| Prisma Client | [`lib/db/prisma.ts`](./lib/db/prisma.ts) | Database connection |
| User Operations | [`lib/db/user.ts`](./lib/db/user.ts) | User CRUD |
| Session Management | [`lib/db/session.ts`](./lib/db/session.ts) | Session handling |
| Role System | [`lib/db/roles.ts`](./lib/db/roles.ts) | RBAC implementation |
| Notifications | [`lib/db/notification.ts`](./lib/db/notification.ts) | Notification system |

### 🎨 UI Components
| Component | Path | Description |
|-----------|------|-------------|
| AuthForm | [`components/features/auth/`](./components/features/auth/) | Login/Register forms |
| BlogCard | [`components/features/blog/card/`](./components/features/blog/card/) | Blog post cards |
| DataTable | [`components/ui/DataTable.tsx`](./components/ui/DataTable.tsx) | Admin data tables |
| Modal System | [`components/ui/modal/`](./components/ui/modal/) | Modal components |

### 🔄 State Management
| Slice | Path | Description |
|-------|------|-------------|
| Auth | [`stores/slice/auth.ts`](./stores/slice/auth.ts) | Authentication state |
| Blog | [`stores/slice/blog.ts`](./stores/slice/blog.ts) | Blog filters and views |
| Modal | [`stores/slice/modal.ts`](./stores/slice/modal.ts) | Modal management |
| Device | [`stores/slice/device.ts`](./stores/slice/device.ts) | Responsive state |
| Panel | [`stores/slice/panel.ts`](./stores/slice/panel.ts) | UI panels |
| Search | [`stores/slice/search.ts`](./stores/slice/search.ts) | Search functionality |

## 🌐 API Endpoints Index

### Authentication Endpoints
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
POST   /api/auth/logout         # User logout
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/social         # Social login
POST   /api/auth/verify-email   # Email verification
POST   /api/auth/reset-password # Password reset
```

### Admin API Endpoints
```
GET    /api/admin/users         # List users
GET    /api/admin/users/[id]    # Get user details
PUT    /api/admin/users/[id]    # Update user
DELETE /api/admin/users/[id]    # Delete user
GET    /api/admin/blog          # Manage blog posts
GET    /api/admin/roles         # Manage roles
GET    /api/admin/notifications # Manage notifications
```

### Public API Endpoints
```
GET    /api/post                # List blog posts
GET    /api/post/[uid]          # Get post details
POST   /api/post/like           # Like/unlike post
GET    /api/category            # List categories
GET    /api/search              # Search content
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| [`next.config.ts`](./next.config.ts) | Next.js configuration |
| [`tsconfig.json`](./tsconfig.json) | TypeScript configuration |
| [`tailwind.config.ts`](./tailwind.config.ts) | Tailwind CSS configuration |
| [`package.json`](./package.json) | Dependencies and scripts |
| [`prisma/schema.prisma`](./prisma/schema.prisma) | Database schema |
| [`.env.local`](./.env.local) | Environment variables |

## 📦 Key Dependencies

### Core Framework
- **next**: 15.4.3 - React framework
- **react**: 19.1.0 - UI library
- **typescript**: 5.9.2 - Type safety

### State & Data
- **@reduxjs/toolkit**: 2.8.2 - State management
- **@prisma/client**: 6.13.0 - Database ORM
- **swr**: 2.3.4 - Data fetching
- **zod**: 4.0.15 - Schema validation

### Authentication & Security
- **argon2**: 0.43.1 - Password hashing
- **jsonwebtoken**: 9.0.2 - JWT tokens
- **@fingerprintjs/fingerprintjs**: 4.6.2 - Device fingerprinting

### UI & Styling
- **tailwindcss**: 4.1.11 - Utility CSS
- **framer-motion**: 12.23.12 - Animations
- **lucide-react**: 0.525.0 - Icons
- **next-themes**: 0.4.6 - Theme switching

### Internationalization
- **next-intl**: 4.3.4 - i18n support

## 🌍 Internationalization

| Language | Code | File |
|----------|------|------|
| Korean (Default) | `ko` | [`i18n/translations/ko.json`](./i18n/translations/ko.json) |
| English | `en` | [`i18n/translations/en.json`](./i18n/translations/en.json) |
| Japanese | `ja` | [`i18n/translations/ja.json`](./i18n/translations/ja.json) |
| Russian | `ru` | [`i18n/translations/ru.json`](./i18n/translations/ru.json) |

## 🔒 Security Features

- ✅ JWT dual-token authentication (15min access, 7day refresh)
- ✅ Argon2 password hashing with salt
- ✅ Device fingerprinting for sessions
- ✅ Rate limiting (100 req/min)
- ✅ Security headers (XSS, CSRF, Frame-Options)
- ✅ Social OAuth (Kakao, Google, Naver, Apple)
- ✅ Two-factor authentication support
- ✅ Session management with cleanup

## 📈 Performance Optimizations

- ⚡ Turbopack for ultra-fast builds
- ⚡ Image optimization (AVIF, WebP)
- ⚡ Code splitting and lazy loading
- ⚡ React memoization patterns
- ⚡ Redux selector memoization
- ⚡ Database connection pooling
- ⚡ Redis caching layer
- ⚡ Static generation where possible

## 🧪 Testing Strategy

### Unit Testing
- Components: React Testing Library
- API Routes: Jest + Supertest
- Database: Prisma test utilities
- State: Redux test utils

### Integration Testing
- E2E: Playwright
- API: Postman/Newman
- Database: Migration tests

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| **Total Files** | 8,585+ |
| **TypeScript Coverage** | 100% |
| **Documentation Pages** | 7 guides |
| **API Endpoints** | 30+ |
| **Redux Slices** | 6 |
| **Database Models** | 15+ |
| **Supported Languages** | 4 |
| **Component Library** | 50+ components |

## 🚦 Development Workflow

### Branch Strategy
```
main           # Production-ready code
├── develop    # Integration branch
├── feature/*  # New features
├── bugfix/*   # Bug fixes
└── hotfix/*   # Emergency fixes
```

### Commit Convention
```
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
perf:     # Performance improvement
test:     # Testing
chore:    # Maintenance
```

## 📝 Common Tasks

### Adding a New Feature
1. Create feature branch from `develop`
2. Implement feature with tests
3. Update documentation
4. Create pull request
5. Code review and merge

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name [description]`
3. Generate client: `npx prisma generate`
4. Update relevant TypeScript types
5. Test migrations

### Adding API Endpoint
1. Create route in `app/api/`
2. Implement handler with validation
3. Add rate limiting if needed
4. Document in API.md
5. Add integration tests

### Component Development
1. Create component in appropriate directory
2. Add TypeScript interfaces
3. Implement with proper patterns
4. Add unit tests
5. Document in COMPONENTS.md

## 🔗 External Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools & Services
- Database GUI: `npx prisma studio`
- Redux DevTools: Browser extension
- TypeScript Playground: Testing types
- Postman: API testing

## 📞 Support & Contact

### Getting Help
1. Check [Documentation](./docs/)
2. Review [Developer Guide](./docs/DEVELOPER_GUIDE.md)
3. Search existing issues
4. Ask in development channels

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

---

## 🎯 Quick Links

- [Project Setup](./docs/DEVELOPER_GUIDE.md#quick-start)
- [API Documentation](./docs/API.md)
- [Component Library](./docs/COMPONENTS.md)
- [Database Schema](./docs/DATABASE.md)
- [Authentication Flow](./docs/AUTHENTICATION.md)
- [State Management](./docs/STATE_MANAGEMENT.md)
- [Security Guidelines](./docs/MIDDLEWARE.md)

---

*This index is maintained as the central navigation hub for the elice-next project. For detailed information on any topic, refer to the linked documentation.*