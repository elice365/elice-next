# Developer Onboarding Guide - Elice Next

Welcome to **elice-next**, a modern full-stack blog platform showcasing enterprise-grade web development with Next.js 15.4.3, React 19.1.0, and Tailwind CSS v4.1.11.

## 🚀 Quick Start (5 minutes)

### Prerequisites
```bash
# Required versions
Node.js >= 18.0.0
PostgreSQL >= 13.0
pnpm >= 8.0.0 (recommended)
Git >= 2.0.0
```

### Setup Steps
```bash
# 1. Clone and install
git clone <repository-url>
cd elice-next
pnpm install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with your database and service credentials

# 3. Database setup
npx prisma generate
npx prisma db push
# Optional: npx prisma db seed

# 4. Start development server
pnpm dev  # Uses Turbopack for ultra-fast builds
```

**🎉 You're ready!** Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Architecture

### Technology Stack
- **Framework**: Next.js 15.4.3 (App Router + Turbopack)
- **UI Library**: React 19.1.0 (Server Components + Concurrent Features)
- **Styling**: Tailwind CSS v4.1.11 (CSS-first configuration)
- **Language**: TypeScript 5.9.2 (Strict mode)
- **Database**: PostgreSQL + Prisma 6.13.0
- **State**: Redux Toolkit 2.8.2
- **i18n**: next-intl 4.3.4

### Directory Structure
```
elice-next/
├── app/                    # Next.js 15 App Router
│   ├── (admin)/           # Admin route group
│   ├── (main)/            # Public route group
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components
│   ├── ui/                # Reusable UI components
│   └── provider/          # Context providers
├── lib/                   # Core utilities
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database operations
│   └── services/          # External services
├── stores/                # Redux state management
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization
├── utils/                 # Utility functions
└── prisma/                # Database schema
```

---

## 🔧 Development Workflow

### Daily Development Commands
```bash
# Start development server (with Turbopack)
pnpm dev

# Type checking
pnpm run type-check

# Linting
pnpm lint

# Database operations
npx prisma studio          # Database GUI
npx prisma db push         # Push schema changes
npx prisma generate        # Generate client
```

### Branch Strategy
```bash
# Feature development
git checkout -b feature/your-feature-name
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
# Create PR for review

# Hotfix workflow
git checkout -b hotfix/fix-description
git commit -m "fix: resolve critical issue"
```

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **Components**: Single responsibility, typed props
- **Naming**: Descriptive, consistent naming conventions
- **Imports**: Use `@/` path aliases
- **Comments**: JSDoc for public APIs only

---

## 🧩 Key Concepts & Patterns

### 1. Component Architecture
**Pattern**: Feature-based organization with UI/business separation
```typescript
// Feature component example
// components/features/blog/Card.tsx
interface BlogCardProps {
  post: Post;
  className?: string;
}

export const BlogCard = ({ post, className }: BlogCardProps) => {
  const { isLiked, handleLike } = useBlogActions(post.uid);
  
  return (
    <div className={cn('card-base', className)}>
      {/* Component JSX */}
    </div>
  );
};
```

### 2. Authentication Flow
**Pattern**: JWT + Refresh Token + Social Login
```typescript
// Authentication hook usage
const { user, login, logout, loading } = useAuth();

// Protected component pattern
const ProtectedComponent = () => {
  const { user } = useAuth();
  
  if (!user) return <LoginPrompt />;
  
  return <SecureContent />;
};
```

### 3. Database Operations
**Pattern**: Repository pattern with Prisma
```typescript
// Database operation example
// lib/db/blog.ts
export async function getBlogPosts(filters: BlogFilters) {
  return await prisma.post.findMany({
    where: {
      status: 'published',
      ...(filters.category && { categoryId: filters.category }),
    },
    include: {
      category: true,
      tags: true,
      _count: { select: { likes: true } }
    },
    orderBy: { publishedAt: 'desc' }
  });
}
```

### 4. State Management
**Pattern**: Redux Toolkit slices + SWR for server state
```typescript
// Redux slice example
// stores/slice/blog.ts
export const blogSlice = createSlice({
  name: 'blog',
  initialState: {
    filters: {},
    viewMode: 'card' as 'card' | 'list'
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    }
  }
});
```

### 5. API Routes
**Pattern**: RESTful API with Next.js App Router
```typescript
// API route example
// app/api/post/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await getBlogPost(params.id);
    
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 🎨 Styling with Tailwind v4

### CSS-first Configuration
**New in v4**: Define theme directly in CSS
```css
/* styles/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #2563eb;
  --color-secondary: #dc2626;
  --font-display: "Pretendard Variable", sans-serif;
  --breakpoint-3xl: 1920px;
}
```

### Component Styling Patterns
```typescript
// Using custom theme variables
<div className="bg-primary text-white font-display">
  <h1 className="text-2xl 3xl:text-4xl">Responsive heading</h1>
</div>

// Custom animations
<div className="animate-fade-in hover:animate-scale-in">
  Interactive element
</div>
```

### Theme System
- **Light Mode**: Default theme with custom colors
- **Dark Mode**: Dark theme with adjusted contrast
- **Deep Blue**: Custom theme for specific use cases
- **System**: Auto-detect user preference

---

## 🌐 Internationalization

### Supported Languages
- **Korean (ko)**: Default language
- **English (en)**: Full translation
- **Japanese (ja)**: Full translation  
- **Russian (ru)**: Full translation

### Using Translations
```typescript
// Component translation
import { useTranslations } from 'next-intl';

const MyComponent = () => {
  const t = useTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
};

// Dynamic translation component
<Translated path="blog.post.likes" params={{ count: likeCount }} />
```

### Adding New Translations
1. Add keys to `i18n/translations/{locale}.json`
2. Use consistent key naming: `domain.section.key`
3. Test across all supported languages
4. Consider cultural context, not just translation

---

## 🔒 Authentication & Security

### Authentication Providers
- **Email/Password**: Traditional auth with Argon2 hashing
- **Social Login**: Kakao, Google, Naver, Apple
- **Two-Factor**: TOTP support (optional)

### Session Management
```typescript
// Check authentication status
const { user, session } = useAuth();

// Access user roles
const hasAdminAccess = user?.roles.includes('admin');

// Session information
console.log(session?.deviceInfo, session?.lastActivity);
```

### Security Best Practices
- All inputs validated server-side
- SQL injection protection via Prisma
- XSS prevention with proper escaping
- CSRF protection with secure headers
- Rate limiting on API endpoints

---

## 🗄️ Database Schema

### Core Models
```sql
-- Key relationships
User -> Auth (1:1)
User -> Session (1:many)
User -> UserRole (1:many)
Post -> Category (many:1)
Post -> Tag (many:many)
Post -> Like (1:many)
User -> Notification (1:many)
```

### Common Queries
```typescript
// Get user with roles
const userWithRoles = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: { role: true }
    }
  }
});

// Get posts with metadata
const posts = await prisma.post.findMany({
  include: {
    category: true,
    tags: true,
    _count: {
      select: { likes: true, viewsDetail: true }
    }
  }
});
```

---

## 📝 Common Development Tasks

### Adding a New Page
```bash
# 1. Create page file
touch app/(main)/new-page/page.tsx

# 2. Create page component
echo 'export default function NewPage() {
  return <div>New Page</div>;
}' > app/(main)/new-page/page.tsx

# 3. Add navigation (if needed)
# Edit components/layout/Navigator.tsx
```

### Creating a New Component
```bash
# 1. Create component file
mkdir -p components/features/new-feature
touch components/features/new-feature/NewComponent.tsx

# 2. Create component with proper structure
```

```typescript
// components/features/new-feature/NewComponent.tsx
interface NewComponentProps {
  // Define props with TypeScript
}

export const NewComponent = ({ }: NewComponentProps) => {
  // Component logic
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Adding a New API Endpoint
```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Implement logic
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Implement POST logic
}
```

### Adding Database Changes
```bash
# 1. Modify schema
vim prisma/schema.prisma

# 2. Generate migration
npx prisma db push
# OR for production
npx prisma migrate dev --name add_new_feature

# 3. Update types
npx prisma generate
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Errors
**Problem**: TypeScript or build errors
```bash
# Solutions
pnpm run type-check    # Check TypeScript errors
npx prisma generate    # Regenerate Prisma types
rm -rf .next && pnpm dev  # Clear Next.js cache
```

#### 2. Database Connection Issues
**Problem**: Prisma connection errors
```bash
# Check database connection
npx prisma db pull

# Reset database (development only)
npx prisma db push --force-reset
```

#### 3. Authentication Issues
**Problem**: Login not working
- Check environment variables for JWT secrets
- Verify social login credentials
- Check database session storage

#### 4. Styling Issues
**Problem**: Tailwind classes not working
- Verify `@import "tailwindcss"` in globals.css
- Check PostCSS configuration
- Clear build cache and restart dev server

#### 5. i18n Issues
**Problem**: Translations not loading
- Check translation files in `i18n/translations/`
- Verify locale configuration in middleware
- Check browser language detection

### Performance Debugging
```bash
# Check bundle size
pnpm run build && pnpm run analyze

# Profile development performance
# Use React DevTools Profiler
# Monitor Network tab for API calls
```

### Development Tools
- **Prisma Studio**: `npx prisma studio` - Database GUI
- **Redux DevTools**: Browser extension for state debugging
- **React DevTools**: Component tree and profiling
- **Next.js DevTools**: Framework-specific debugging

---

## 📚 Learning Resources

### Essential Reading
1. [Next.js 15 Documentation](https://nextjs.org/docs) - App Router patterns
2. [React 19 Features](https://react.dev/blog) - Server Components
3. [Tailwind v4 Guide](https://tailwindcss.com/docs/v4-migration) - CSS-first config
4. [Prisma Documentation](https://prisma.io/docs) - Database operations

### Project-Specific Guides
- `PROJECT_INDEX.md` - Project overview and architecture
- `API_REFERENCE.md` - Complete API documentation  
- `COMPONENT_GUIDE.md` - Component patterns and usage
- `memory-bank/` - Detailed project context and patterns

### Code Examples
- Authentication flow: `lib/auth/`, `app/api/auth/`
- Component patterns: `components/features/blog/`
- Database operations: `lib/db/`
- State management: `stores/slice/`

---

## 🚨 Important Notes

### Development Guidelines
- **Always** run TypeScript checks before committing
- **Never** commit sensitive data or credentials
- **Test** authentication flows in different browsers
- **Validate** all user inputs server-side
- **Consider** mobile-first responsive design

### Production Considerations
- Set up proper environment variables
- Configure database connection pooling
- Enable error tracking and monitoring
- Set up proper backup procedures
- Test deployment process thoroughly

### Security Reminders
- Validate all API inputs
- Use parameterized queries (Prisma handles this)
- Implement proper rate limiting
- Keep dependencies updated
- Review security headers regularly

---

## 🎯 Next Steps

After completing onboarding:

1. **Explore the codebase**: Start with `app/layout.tsx` and navigate through route groups
2. **Run the application**: Create a test account and explore features
3. **Read the Memory Bank**: Detailed context in `memory-bank/` directory
4. **Pick a task**: Check issues or ask the team for good first tasks
5. **Start contributing**: Follow the development workflow and coding standards

Welcome to the team! 🎉

---

## 📞 Getting Help

- **Code Issues**: Check existing documentation and Memory Bank
- **Setup Problems**: Refer to troubleshooting section above
- **Architecture Questions**: Review system patterns in Memory Bank
- **Feature Requests**: Discuss with team leads before implementation

**Happy coding!** 🚀