# Component Guide

Comprehensive guide to the component architecture and usage patterns in elice-next.

## 📁 Component Architecture

### Directory Structure
```
components/
├── features/           # Feature-specific components
│   ├── admin/         # Admin dashboard components
│   ├── auth/          # Authentication components
│   ├── blog/          # Blog system components
│   ├── notification/  # Notification components
│   ├── profile/       # User profile components
│   ├── search/        # Search functionality
│   ├── locale/        # Language switching
│   └── theme/         # Theme switching
├── layout/            # Layout and navigation
├── pages/             # Page-level components
├── provider/          # Context providers
├── ui/                # Reusable UI components
└── i18n/              # Internationalization
```

## 🎨 UI Components

### Core UI Components

#### Button Component
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Usage
<Button variant="primary" size="lg" loading={isSubmitting}>
  Submit
</Button>
```

#### Input Component
```typescript
// components/ui/Input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

// Usage
<Input
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

#### FormField Component
```typescript
// components/ui/form/FormField.tsx
interface FormFieldProps {
  name: string;
  type: 'email' | 'password' | 'text';
  label: string;
  autoComplete?: 'on' | 'off';
  compareValue?: string;
  onChange?: boolean;
}

// Usage in forms
const fields: FormFieldProps[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    autoComplete: 'on'
  }
];
```

#### Modal System
```typescript
// components/ui/modal/BaseModal.tsx
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

// Specialized modals
<BlogCreateModal 
  isOpen={createModalOpen}
  onClose={() => setCreateModalOpen(false)}
  onSuccess={handleCreateSuccess}
/>
```

#### Table Component
```typescript
// components/ui/Table.tsx
interface TableColumn<T> {
  key: string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Usage
<Table
  data={users}
  columns={userColumns}
  loading={loading}
  pagination={pagination}
  onPageChange={handlePageChange}
/>
```

### Layout Components

#### Header Component
```typescript
// components/layout/Header.tsx
interface HeaderProps {
  locale: string;
}

// Features:
// - User authentication status
// - Navigation menu
// - Language switcher
// - Theme switcher
// - Notification bell
// - Mobile responsive
```

#### Navigation Component
```typescript
// components/layout/Navigator.tsx
interface NavigatorProps {
  locale: string;
  className?: string;
}

// Features:
// - Dynamic menu based on user roles
// - Active route highlighting
// - Mobile collapsible menu
// - Multi-level navigation support
```

#### Footer Component
```typescript
// components/layout/Footer.tsx
// Features:
// - Site links
// - Social media links
// - Copyright information
// - Multi-language support
```

## 🔐 Authentication Components

### AuthForm Component
```typescript
// components/features/auth/AuthForm.tsx
interface AuthFormProps {
  title: string;
  fields: AuthFormField[];
  onSubmit: (formData: any) => Promise<void>;
  successRedirect?: string;
  validate?: (formData: any) => string | null;
  showSocialLogin?: boolean;
}

// Usage for login/register forms
<AuthForm
  title="Login"
  fields={loginFields}
  onSubmit={handleLogin}
  successRedirect="/dashboard"
  showSocialLogin={true}
/>
```

### SocialButtons Component
```typescript
// components/features/auth/SocialButtons.tsx
interface SocialButtonsProps {
  onSocialLogin: (provider: string) => void;
  loading?: boolean;
}

// Supports: Kakao, Google, Naver, Apple
```

## 📝 Blog Components

### Blog Display System
```typescript
// components/features/blog/Display.tsx
interface BlogDisplayProps {
  posts: Post[];
  isLoading?: boolean;
  locale?: string;
  defaultView?: 'card' | 'list';
}

// Features:
// - Card/List view toggle
// - Responsive grid layout
// - Loading states
// - Empty states
```

### Blog Card Component
```typescript
// components/features/blog/Card.tsx
interface BlogCardProps {
  post: Post;
  className?: string;
}

// Features:
// - Post thumbnail
// - Title and description
// - Category and tags
// - View count and likes
// - Author information
// - Responsive design
```

### Blog Detail Components
```typescript
// Post detail page components
<PostDetail post={post} content={content} />
<PostHeader post={post} mobile={mobile} tablet={tablet} />
<PostContent sections={sections} mobile={mobile} tablet={tablet} />
<PostGallery products={products} author={author} />
<PostActions 
  isLiked={isLiked}
  onLike={handleLike}
  onShare={handleShare}
/>
```

### Blog Filters
```typescript
// components/features/blog/Filters.tsx
interface BlogFiltersProps {
  className?: string;
  onFilterChange?: (filters: BlogFilterState) => void;
}

// Features:
// - Category selection
// - Tag filtering
// - Search input
// - Sort options
// - Active filter indicators
```

## 👥 Admin Components

### UserRoleManager
```typescript
// components/features/admin/UserRoleManager.tsx
interface UserRoleManagerProps {
  userId: string;
  currentRoles: string[];
  availableRoles: Role[];
  onRoleChange: (roles: string[]) => void;
}

// Features:
// - Role assignment/removal
// - Bulk role operations
// - Permission preview
```

### Admin Layout
```typescript
// components/layout/Admin.tsx
// Features:
// - Admin sidebar navigation
// - Breadcrumb navigation
// - User information
// - Quick actions
// - Statistics dashboard
```

### Admin Modals
```typescript
// Specialized admin modals for CRUD operations
<BlogCreateModal />
<BlogEditModal />
<CategoryCreateModal />
<UserModal />
<RoleCreateModal />
<NotificationCreateModal />
```

## 🔔 Notification Components

### Notification Button
```typescript
// components/features/notification/Button.tsx
interface NotificationButtonProps {
  locale: string;
}

// Features:
// - Unread count badge
// - Dropdown notification list
// - Mark as read functionality
// - Real-time updates
```

## 🌐 Internationalization Components

### Translated Component
```typescript
// components/i18n/Translated.tsx
interface TranslatedProps {
  path: string;
  params?: Record<string, string>;
  locale?: string;
}

// Usage
<Translated path="common.welcome" params={{ name: userName }} />
```

### LocaleSwitcher
```typescript
// components/features/locale/LocaleSwitcher.tsx
// Features:
// - Language selection dropdown
// - Country flag indicators
// - Current language highlighting
// - Persistent language preference
```

## 🎨 Theme Components

### ThemeSwitcher
```typescript
// components/features/theme/ThemeSwitcher.tsx
// Features:
// - Light/Dark mode toggle
// - System preference detection
// - Smooth transitions
// - Persistent theme preference
```

## 📊 Provider Components

### Redux Provider
```typescript
// components/provider/Redux.tsx
// Wraps app with Redux store
```

### Auth Provider
```typescript
// components/provider/Auth.tsx
// Handles authentication state
// - User session management
// - Token refresh logic
// - Route protection
```

### Admin Provider
```typescript
// components/provider/Admin.tsx
// Admin-specific context
// - Admin permissions
// - Admin navigation state
// - Bulk operations
```

## 🔧 Component Patterns

### Custom Hooks Integration
```typescript
// Components use custom hooks for logic
const BlogCard = ({ post }: BlogCardProps) => {
  const { isLiked, handleLike } = useBlogActions(post.uid);
  const { theme } = useTheme();
  
  return (
    <div className={`card ${theme}`}>
      {/* Component JSX */}
    </div>
  );
};
```

### Responsive Design Pattern
```typescript
// Mobile-first responsive components
const ResponsiveComponent = () => {
  const { mobile, tablet } = useDevice();
  
  return (
    <div className={cn(
      'base-styles',
      mobile && 'mobile-styles',
      tablet && 'tablet-styles',
      !mobile && !tablet && 'desktop-styles'
    )}>
      {mobile ? <MobileView /> : <DesktopView />}
    </div>
  );
};
```

### Loading State Pattern
```typescript
// Consistent loading states
const LoadingComponent = ({ loading, children }: LoadingProps) => {
  if (loading) {
    return <Skeleton />;
  }
  
  return <>{children}</>;
};
```

### Error Boundary Pattern
```typescript
// Error handling in components
const SafeComponent = ({ children }: SafeComponentProps) => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};
```

## 🎯 Usage Guidelines

### Component Development
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition for flexibility
3. **Props Interface**: Always define TypeScript interfaces
4. **Default Props**: Provide sensible defaults
5. **Error Handling**: Include error boundaries and fallbacks

### Performance Optimization
1. **React.memo**: Memoize expensive components
2. **useMemo/useCallback**: Optimize expensive calculations
3. **Lazy Loading**: Code split large components
4. **Virtual Scrolling**: For large lists

### Accessibility
1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Labels**: Add accessibility attributes
3. **Keyboard Navigation**: Support keyboard interaction
4. **Focus Management**: Proper focus handling

### Testing
1. **Unit Tests**: Test component logic
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Test screen reader compatibility
4. **Visual Regression**: Test UI consistency

## 📱 Responsive Breakpoints

```css
/* Tailwind CSS breakpoints used */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

Component responsive design follows mobile-first approach with conditional rendering based on screen size detection.