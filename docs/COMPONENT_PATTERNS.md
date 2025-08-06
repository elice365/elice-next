# Component Patterns & Usage Guide

This guide documents the critical component patterns used throughout the elice-next project, providing practical examples and best practices for consistent development.

## 📋 Table of Contents
- [Architecture Principles](#architecture-principles)
- [Component Categories](#component-categories)
- [Authentication Components](#authentication-components)
- [Blog Components](#blog-components)
- [Admin Components](#admin-components)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Form Patterns](#form-patterns)
- [State Management Patterns](#state-management-patterns)
- [Performance Patterns](#performance-patterns)

---

## Architecture Principles

### 1. Component Organization
```
components/
├── features/          # Domain-specific components
│   ├── auth/         # Authentication components
│   ├── blog/         # Blog-specific components
│   ├── admin/        # Admin-only components
│   └── notification/ # Notification components
├── layout/           # Layout and navigation
├── ui/               # Reusable UI primitives
└── provider/         # Context providers
```

### 2. Naming Conventions
- **Components**: PascalCase (`BlogCard`, `AuthForm`)
- **Files**: PascalCase matching component name
- **Props**: camelCase with descriptive names
- **Hooks**: camelCase starting with `use`

### 3. TypeScript Patterns
```typescript
// Always define explicit prop interfaces
interface ComponentProps {
  // Required props first
  title: string;
  content: string;
  
  // Optional props with defaults
  className?: string;
  variant?: 'primary' | 'secondary';
  
  // Event handlers
  onSubmit?: (data: FormData) => void;
  
  // Children when needed
  children?: React.ReactNode;
}

// Use proper generic typing for reusable components
interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
}
```

---

## Component Categories

### Feature Components
**Purpose**: Domain-specific logic and UI
**Location**: `components/features/`
**Characteristics**:
- Contains business logic
- Integrates with hooks and state
- Domain-specific styling
- Reusable within feature domain

### UI Components  
**Purpose**: Reusable interface primitives
**Location**: `components/ui/`
**Characteristics**:
- No business logic
- Highly configurable
- Consistent styling
- Framework-agnostic where possible

### Layout Components
**Purpose**: Page structure and navigation
**Location**: `components/layout/`
**Characteristics**:
- App-wide structure
- Navigation logic
- Responsive behavior
- Theme integration

---

## Authentication Components

### AuthForm Pattern
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

export const AuthForm = ({ 
  title, 
  fields, 
  onSubmit, 
  successRedirect,
  validate,
  showSocialLogin = true 
}: AuthFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (validate) {
      const error = validate(formData);
      if (error) {
        setErrors({ general: error });
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (error) {
      setErrors({ general: 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <FormField
            key={field.name}
            {...field}
            value={formData[field.name] || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
            error={errors[field.name]}
          />
        ))}
        
        {errors.general && (
          <div className="text-red-500 text-sm">{errors.general}</div>
        )}
        
        <Button 
          type="submit" 
          loading={loading}
          className="w-full"
        >
          {title}
        </Button>
      </form>
      
      {showSocialLogin && <SocialButtons onSocialLogin={handleSocialLogin} />}
    </div>
  );
};
```

### Usage Example
```typescript
// Login page implementation
const LoginPage = () => {
  const loginFields: AuthFormField[] = [
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      autoComplete: 'on'
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      autoComplete: 'on'
    }
  ];

  const handleLogin = async (formData: any) => {
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <AuthForm
      title="Login"
      fields={loginFields}
      onSubmit={handleLogin}
      successRedirect="/dashboard"
      showSocialLogin={true}
    />
  );
};
```

### SocialButtons Pattern
```typescript
// components/features/auth/SocialButtons.tsx
interface SocialButtonsProps {
  onSocialLogin: (provider: string) => void;
  loading?: boolean;
}

export const SocialButtons = ({ onSocialLogin, loading }: SocialButtonsProps) => {
  const providers = [
    { id: 'kakao', name: 'Kakao', color: 'bg-yellow-400', icon: KakaoIcon },
    { id: 'google', name: 'Google', color: 'bg-red-500', icon: GoogleIcon },
    { id: 'naver', name: 'Naver', color: 'bg-green-500', icon: NaverIcon },
    { id: 'apple', name: 'Apple', color: 'bg-black', icon: AppleIcon }
  ];

  return (
    <div className="social-login mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            onClick={() => onSocialLogin(provider.id)}
            disabled={loading}
            className="w-full"
          >
            <provider.icon className="mr-2 h-4 w-4" />
            {provider.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
```

---

## Blog Components

### BlogCard Pattern
```typescript
// components/features/blog/Card.tsx
interface BlogCardProps {
  post: Post;
  className?: string;
  variant?: 'card' | 'list';
}

export const BlogCard = ({ post, className, variant = 'card' }: BlogCardProps) => {
  const { isLiked, likeCount, handleLike } = useBlogActions(post.uid);
  const { mobile, tablet } = useDevice();

  return (
    <article 
      className={cn(
        'blog-card group cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        variant === 'card' && 'rounded-lg overflow-hidden bg-card',
        variant === 'list' && 'flex gap-4 p-4 border-b',
        className
      )}
    >
      {/* Image */}
      <div className={cn(
        'relative overflow-hidden',
        variant === 'card' && 'aspect-[16/9]',
        variant === 'list' && 'w-32 h-24 flex-shrink-0'
      )}>
        <Image
          src={post.images[0] || '/placeholder.jpg'}
          alt={post.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Category Badge */}
        {post.category && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2"
          >
            {post.category.name}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1',
        variant === 'card' && 'p-4',
        variant === 'list' && 'py-2'
      )}>
        <h3 className={cn(
          'font-semibold line-clamp-2 group-hover:text-primary',
          variant === 'card' && 'text-lg mb-2',
          variant === 'list' && 'text-base mb-1'
        )}>
          {post.title}
        </h3>

        <p className={cn(
          'text-muted-foreground line-clamp-2',
          variant === 'card' && 'text-sm mb-4',
          variant === 'list' && 'text-xs mb-2'
        )}>
          {post.description}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.uid} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={cn(
                'flex items-center gap-1 transition-colors',
                isLiked && 'text-red-500'
              )}
            >
              <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
              {likeCount}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
```

### BlogDisplay Pattern
```typescript
// components/features/blog/Display.tsx
interface BlogDisplayProps {
  posts: Post[];
  isLoading?: boolean;
  locale?: string;
  defaultView?: 'card' | 'list';
}

export const BlogDisplay = ({ 
  posts, 
  isLoading, 
  locale = 'en',
  defaultView = 'card' 
}: BlogDisplayProps) => {
  const [viewMode, setViewMode] = useState<'card' | 'list'>(defaultView);
  const { mobile } = useDevice();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No posts found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      {!mobile && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {posts.length} posts found
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Posts Grid/List */}
      <div className={cn(
        viewMode === 'card' && 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
        viewMode === 'list' && 'space-y-4'
      )}>
        {posts.map((post, index) => (
          <BlogCard
            key={post.uid}
            post={post}
            variant={mobile ? 'card' : viewMode}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## UI Components

### Button Pattern
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled,
  className,
  children,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // Variant styles
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        
        // Size styles
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 py-2',
        size === 'lg' && 'h-11 px-8',
        
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m12 2.8 3.6 7 6.6 1-4.8 4.6 1.2 6.8-6.6-3.5-6.6 3.5 1.2-6.8-4.8-4.6 6.6-1z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
```

### Modal Pattern
```typescript
// components/ui/modal/BaseModal.tsx
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BaseModal = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer
}: BaseModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative bg-background rounded-lg shadow-lg',
            'transform transition-all duration-200',
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            
            // Size variants
            size === 'sm' && 'max-w-sm w-full',
            size === 'md' && 'max-w-md w-full',
            size === 'lg' && 'max-w-lg w-full',
            size === 'xl' && 'max-w-xl w-full',
            size === 'full' && 'max-w-4xl w-full max-h-[90vh]'
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-6 py-4 border-b">
              {title && (
                <h2 className="text-lg font-semibold">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t bg-muted/50">
              {footer}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Form Patterns

### FormField Pattern
```typescript
// components/ui/form/FormField.tsx
interface FormFieldProps {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export const FormField = ({
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  autoComplete,
  className
}: FormFieldProps) => {
  const inputId = `field-${name}`;

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={inputId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <InputComponent
        id={inputId}
        name={name}
        type={type === 'textarea' ? undefined : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={cn(
          'flex h-10 w-full rounded-md border border-input',
          'bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          type === 'textarea' && 'min-h-[80px] resize-vertical',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
        rows={type === 'textarea' ? 4 : undefined}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
```

---

## State Management Patterns

### Custom Hook Pattern
```typescript
// hooks/useBlogActions.ts
interface UseBlogActionsReturn {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  isLiking: boolean;
  isBookmarking: boolean;
  handleLike: () => void;
  handleBookmark: () => void;
  handleShare: () => void;
}

export const useBlogActions = (postId: string): UseBlogActionsReturn => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Initialize state from API or local storage
  useEffect(() => {
    const loadInitialState = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/post/${postId}/status`);
          const data = await response.json();
          
          setIsLiked(data.isLiked);
          setIsBookmarked(data.isBookmarked);
          setLikeCount(data.likeCount);
        } catch (error) {
          console.error('Failed to load post status:', error);
        }
      }
    };

    loadInitialState();
  }, [postId, user]);

  const handleLike = useCallback(async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    const previousState = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const response = await fetch(`/api/post/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(previousState);
      setLikeCount(previousCount);
      console.error('Failed to update like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [user, isLiking, isLiked, likeCount, postId]);

  const handleBookmark = useCallback(async () => {
    // Similar implementation to handleLike
  }, [user, isBookmarking, isBookmarked, postId]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'Check out this post',
      url: `${window.location.origin}/blog/${postId}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareData.url);
      // Show toast notification
    }
  }, [postId]);

  return {
    isLiked,
    isBookmarked,
    likeCount,
    isLiking,
    isBookmarking,
    handleLike,
    handleBookmark,
    handleShare
  };
};
```

---

## Performance Patterns

### Lazy Loading Pattern
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const BlogEditor = lazy(() => import('./BlogEditor'));

// Component with Suspense
const LazyAdminDashboard = () => (
  <Suspense fallback={<AdminDashboardSkeleton />}>
    <AdminDashboard />
  </Suspense>
);
```

### Memoization Pattern
```typescript
// Memoize expensive components
const BlogCard = memo(({ post, className }: BlogCardProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.post.uid === nextProps.post.uid &&
         prevProps.post.likeCount === nextProps.post.likeCount;
});

// Memoize expensive calculations
const ExpensiveComponent = ({ data }: { data: ComplexData[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }));
  }, [data]);

  const handleClick = useCallback((id: string) => {
    // Handle click logic
  }, []);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.computed}
        </div>
      ))}
    </div>
  );
};
```

### Error Boundary Pattern
```typescript
// components/ui/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Best Practices Summary

### 1. Component Design
- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UIs through component composition
- **Props Interface**: Always define explicit TypeScript interfaces
- **Default Props**: Provide sensible defaults for optional props

### 2. Performance
- **Memoization**: Use `memo`, `useMemo`, `useCallback` judiciously
- **Lazy Loading**: Code split heavy components
- **Error Boundaries**: Implement error boundaries for resilience
- **Loading States**: Always provide loading and empty states

### 3. Accessibility
- **Semantic HTML**: Use proper HTML elements and ARIA attributes
- **Keyboard Navigation**: Support keyboard interaction
- **Focus Management**: Proper focus handling in modals and forms
- **Screen Readers**: Test with screen reader software

### 4. Testing Considerations
- **Testable Components**: Design components for easy testing
- **Mock External Dependencies**: Mock API calls and external services
- **User Interaction**: Test user interactions, not implementation details
- **Accessibility Testing**: Include accessibility in test coverage

This guide provides the foundation for consistent, maintainable component development across the elice-next project. Refer to specific component implementations for detailed examples and patterns.